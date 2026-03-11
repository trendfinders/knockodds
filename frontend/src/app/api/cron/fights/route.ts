import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getCachedOddsData } from '@/lib/cache/odds-cache';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Cron job: sync fights data.
 * Runs daily at 6AM via vercel.json.
 * Revalidates the same odds-data cache since fights + odds are fetched together.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  try {
    // Invalidate and re-populate the shared cache
    revalidateTag('odds-data', 'default');
    const data = await getCachedOddsData();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      elapsed: `${elapsed}s`,
      upcomingFights: data.upcomingFights.length,
      recentResults: data.recentResults.length,
      lastUpdated: data.lastUpdated,
    });
  } catch (e) {
    console.error('[CRON/FIGHTS] Failed:', e);
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 500 });
  }
}
