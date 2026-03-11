import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getCachedOddsData } from '@/lib/cache/odds-cache';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min — fetching odds for all fights takes time with rate limit delays

/**
 * Cron job: fetch all upcoming fights + odds and populate cache.
 * Runs every 2 hours via vercel.json.
 *
 * Flow:
 * 1. Invalidate the 'odds-data' cache tag
 * 2. Call getCachedOddsData() to execute the fetch and re-populate cache
 * 3. All subsequent page visits read from this pre-populated cache (instant)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  try {
    // Invalidate stale cache
    revalidateTag('odds-data', 'default');

    // Re-populate cache (this does the slow API calls — all in background, not user-facing)
    const data = await getCachedOddsData();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const oddsCount = Object.keys(data.odds).length;

    return NextResponse.json({
      success: true,
      elapsed: `${elapsed}s`,
      upcomingFights: data.upcomingFights.length,
      fightsWithOdds: oddsCount,
      recentResults: data.recentResults.length,
      lastUpdated: data.lastUpdated,
    });
  } catch (e) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error('[CRON/ODDS] Failed:', e);
    return NextResponse.json({
      success: false,
      elapsed: `${elapsed}s`,
      error: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 500 });
  }
}
