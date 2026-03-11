import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { awardKoPoints, KO_RATES } from '@/lib/services/ko-points';

export const runtime = 'nodejs';
export const maxDuration = 120;

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Cron: calculate KnockCoin rewards from yesterday's pageviews.
 * Awards 100 KC per 1,000 pageviews per user.
 * Runs daily at midnight UTC via vercel.json.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const supabase = getServiceSupabase();

  try {
    // Calculate yesterday's date range (UTC)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString();
    const dayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1).toISOString();

    // Count pageviews per user for yesterday
    const { data: pageviewCounts, error: countErr } = await supabase
      .from('pageviews')
      .select('user_id')
      .gte('created_at', dayStart)
      .lt('created_at', dayEnd)
      .not('user_id', 'is', null);

    if (countErr) throw countErr;

    if (!pageviewCounts || pageviewCounts.length === 0) {
      return NextResponse.json({ success: true, rewarded: 0, elapsed: '0s' });
    }

    // Count per user
    const userCounts = new Map<string, number>();
    for (const pv of pageviewCounts) {
      if (pv.user_id) {
        userCounts.set(pv.user_id, (userCounts.get(pv.user_id) || 0) + 1);
      }
    }

    let rewarded = 0;
    const dateStr = yesterday.toISOString().split('T')[0];

    for (const [userId, count] of userCounts) {
      const rewardUnits = Math.floor(count / 1000);
      if (rewardUnits <= 0) continue;

      const kcAmount = rewardUnits * KO_RATES.PER_1000_PAGEVIEWS;

      await awardKoPoints(
        userId,
        kcAmount,
        'pageviews',
        `Pageview reward: ${count} views on ${dateStr}`,
        `pageviews_${dateStr}`,
        supabase,
      );

      rewarded++;
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return NextResponse.json({
      success: true,
      totalUsers: userCounts.size,
      rewarded,
      elapsed: `${elapsed}s`,
    });
  } catch (e) {
    console.error('[CRON/PAGEVIEW-REWARDS] Failed:', e);
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 500 });
  }
}
