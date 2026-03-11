import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mmaApi } from '@/lib/api/mma-api';
import { scorePrediction, getRankTitle, normalizeMethod } from '@/lib/services/prediction-scoring';
import type { Prediction } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Cron: settle pending predictions by checking fight results.
 * Runs every 2 hours via vercel.json.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const supabase = getServiceSupabase();

  try {
    // Get unsettled predictions for past events
    const today = new Date().toISOString().split('T')[0];
    const { data: pending, error: fetchErr } = await supabase
      .from('predictions')
      .select('*')
      .in('status', ['pending', 'published'])
      .lt('event_date', today)
      .limit(500);

    if (fetchErr) throw fetchErr;
    if (!pending || pending.length === 0) {
      return NextResponse.json({ success: true, settled: 0, elapsed: '0s' });
    }

    // Group by fight_id
    const byFight = new Map<number, Prediction[]>();
    for (const p of pending as Prediction[]) {
      const arr = byFight.get(p.fight_id) || [];
      arr.push(p);
      byFight.set(p.fight_id, arr);
    }

    let settled = 0;
    let errors = 0;

    for (const [fightId, predictions] of byFight) {
      try {
        // Get fight data and results from API-Sports
        const [fight, results] = await Promise.all([
          mmaApi.getFightById(fightId),
          mmaApi.getFightResults({ id: fightId }),
        ]);

        if (!fight) continue;

        // Determine winner
        let winnerName: string | null = null;
        if (fight.fighters.first.winner === true) winnerName = fight.fighters.first.name;
        else if (fight.fighters.second.winner === true) winnerName = fight.fighters.second.name;

        // Fight not yet decided
        if (!winnerName) {
          // Check if it's a no-contest or cancelled
          if (['CANC', 'NC', 'WO'].includes(fight.status.short)) {
            for (const pred of predictions) {
              await supabase.from('predictions').update({
                status: 'cancelled',
                settled_at: new Date().toISOString(),
              }).eq('id', pred.id);
            }
            settled += predictions.length;
          }
          continue;
        }

        // Get result details
        const result = results[0];
        const method = result ? normalizeMethod(result.won_type) : 'DEC';
        const round = result?.round ?? null;

        // Score each prediction
        for (const pred of predictions) {
          // Get current user stats for streak
          const { data: stats } = await supabase
            .from('user_stats')
            .select('current_streak')
            .eq('user_id', pred.user_id)
            .single();

          const currentStreak = stats?.current_streak ?? 0;

          const score = scorePrediction(
            {
              pick: pred.pick,
              method: pred.method,
              round: pred.round,
              confidence: pred.confidence,
              currentStreak,
            },
            { winnerName, method, round }
          );

          // Update prediction
          await supabase.from('predictions').update({
            status: score.won ? 'won' : 'lost',
            points_earned: score.points,
            settled_at: new Date().toISOString(),
          }).eq('id', pred.id);

          // Update user_stats
          const { data: currentStats } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', pred.user_id)
            .single();

          if (currentStats) {
            const newWins = currentStats.total_wins + (score.won ? 1 : 0);
            const newLosses = currentStats.total_losses + (score.won ? 0 : 1);
            const totalSettled = newWins + newLosses;
            const newWinRate = totalSettled > 0 ? (newWins / totalSettled) * 100 : 0;
            const newBestStreak = Math.max(currentStats.best_streak, score.won ? score.newStreak : 0);
            const newTotalPoints = currentStats.total_points + score.points;

            await supabase.from('user_stats').update({
              total_wins: newWins,
              total_losses: newLosses,
              total_points: newTotalPoints,
              current_streak: score.newStreak,
              best_streak: newBestStreak,
              win_rate: Math.round(newWinRate * 100) / 100,
              rank_title: getRankTitle(newTotalPoints),
              monthly_points: currentStats.monthly_points + score.points,
              monthly_wins: currentStats.monthly_wins + (score.won ? 1 : 0),
              monthly_losses: currentStats.monthly_losses + (score.won ? 0 : 1),
              updated_at: new Date().toISOString(),
            }).eq('user_id', pred.user_id);

            // Check and award badges
            await checkAndAwardBadges(supabase, pred.user_id, {
              totalPredictions: currentStats.total_predictions,
              totalWins: newWins,
              winRate: newWinRate,
              bestStreak: newBestStreak,
              currentStreak: score.newStreak,
              isPerfect: score.won && pred.method === method && pred.round === round,
            });
          }

          settled++;
        }
      } catch (e) {
        console.error(`[SETTLE] Error processing fight ${fightId}:`, e);
        errors++;
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return NextResponse.json({ success: true, settled, errors, elapsed: `${elapsed}s` });
  } catch (e) {
    console.error('[CRON/SETTLE] Failed:', e);
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 500 });
  }
}

interface BadgeCheckInput {
  totalPredictions: number;
  totalWins: number;
  winRate: number;
  bestStreak: number;
  currentStreak: number;
  isPerfect: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkAndAwardBadges(
  supabase: any,
  userId: string,
  input: BadgeCheckInput
) {
  const badgesToAward: string[] = [];

  if (input.totalPredictions >= 1) badgesToAward.push('first_prediction');
  if (input.totalPredictions >= 10) badgesToAward.push('predictions_10');
  if (input.totalPredictions >= 50) badgesToAward.push('predictions_50');
  if (input.totalPredictions >= 100) badgesToAward.push('predictions_100');

  if (input.bestStreak >= 3) badgesToAward.push('streak_3');
  if (input.bestStreak >= 5) badgesToAward.push('streak_5');
  if (input.bestStreak >= 10) badgesToAward.push('streak_10');
  if (input.bestStreak >= 20) badgesToAward.push('streak_20');

  if (input.totalPredictions >= 10 && input.winRate >= 60) badgesToAward.push('accuracy_60');
  if (input.totalPredictions >= 20 && input.winRate >= 70) badgesToAward.push('accuracy_70');
  if (input.totalPredictions >= 20 && input.winRate >= 80) badgesToAward.push('accuracy_80');

  if (input.isPerfect) badgesToAward.push('perfect_prediction');

  for (const badgeId of badgesToAward) {
    await supabase
      .from('user_badges')
      .upsert({ user_id: userId, badge_id: badgeId }, { onConflict: 'user_id,badge_id' })
      .select();
  }
}
