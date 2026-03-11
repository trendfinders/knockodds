import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Cron: monthly leaderboard snapshot and reset.
 * Runs on the 1st of each month at 00:05 UTC via vercel.json.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const supabase = getServiceSupabase();

  try {
    // Calculate previous month string (YYYY-MM)
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    // Get all users with monthly activity
    const { data: activeUsers, error: fetchErr } = await supabase
      .from('user_stats')
      .select('*')
      .gt('monthly_points', 0)
      .order('monthly_points', { ascending: false });

    if (fetchErr) throw fetchErr;

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({ success: true, month, snapshotted: 0 });
    }

    // Snapshot into monthly_leaderboard
    const snapshots = activeUsers.map((u, i) => ({
      user_id: u.user_id,
      user_name: u.user_name,
      user_avatar_url: u.user_avatar_url,
      month,
      total_predictions: u.monthly_wins + u.monthly_losses,
      wins: u.monthly_wins,
      losses: u.monthly_losses,
      points: u.monthly_points,
      win_rate: (u.monthly_wins + u.monthly_losses) > 0
        ? Math.round((u.monthly_wins / (u.monthly_wins + u.monthly_losses)) * 10000) / 100
        : 0,
      rank: i + 1,
    }));

    const { error: insertErr } = await supabase
      .from('monthly_leaderboard')
      .upsert(snapshots, { onConflict: 'user_id,month' });

    if (insertErr) throw insertErr;

    // Award monthly champion and podium badges
    for (let i = 0; i < Math.min(3, snapshots.length); i++) {
      const badgeId = i === 0
        ? `monthly_champion_${month}`
        : `monthly_podium_${month}`;

      // Create the dynamic badge if it doesn't exist
      await supabase.from('badges').upsert({
        id: badgeId,
        name: i === 0 ? `Champion ${month}` : `Podium ${month}`,
        description: i === 0
          ? `#1 predictor for ${month}`
          : `Top 3 predictor for ${month}`,
        icon: i === 0 ? '👑' : '🥇',
        category: 'champion',
        threshold: null,
      }, { onConflict: 'id' });

      await supabase.from('user_badges').upsert({
        user_id: snapshots[i].user_id,
        badge_id: badgeId,
      }, { onConflict: 'user_id,badge_id' });
    }

    // Reset monthly counters
    const { error: resetErr } = await supabase
      .from('user_stats')
      .update({
        monthly_points: 0,
        monthly_wins: 0,
        monthly_losses: 0,
        updated_at: new Date().toISOString(),
      })
      .gt('monthly_points', 0);

    if (resetErr) throw resetErr;

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return NextResponse.json({
      success: true,
      month,
      snapshotted: snapshots.length,
      elapsed: `${elapsed}s`,
    });
  } catch (e) {
    console.error('[CRON/MONTHLY-RESET] Failed:', e);
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 500 });
  }
}
