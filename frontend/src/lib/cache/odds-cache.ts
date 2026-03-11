import { unstable_cache } from 'next/cache';
import { mmaApi } from '../api/mma-api';
import type { Fight, Odds } from '../types/mma-api';

/**
 * Cached odds data — fetched in background by cron every 2-4 hours.
 * Pages read from this cache instantly (no API calls on user visits).
 *
 * Flow:
 * 1. Cron /api/cron/odds runs every 2h (vercel.json)
 * 2. Cron revalidates the 'odds-data' tag
 * 3. Cron calls getCachedOddsData() to pre-populate cache with fresh data
 * 4. User visits → reads from cache instantly
 */

export interface CachedOddsData {
  upcomingFights: Fight[];
  recentResults: Fight[];
  odds: Record<string, Odds>; // fightId (as string) → Odds
  lastUpdated: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllOddsData(): Promise<CachedOddsData> {
  console.log('[ODDS-CACHE] Starting full odds data fetch...');
  const start = Date.now();

  // 1. Fetch upcoming fights (has built-in delays in mmaApi)
  let upcomingFights: Fight[] = [];
  try {
    upcomingFights = await mmaApi.getUpcomingFights();
    console.log(`[ODDS-CACHE] Got ${upcomingFights.length} upcoming fights`);
  } catch (e) {
    console.error('[ODDS-CACHE] Failed to fetch upcoming fights:', e);
  }

  // Pause between fight fetch and odds fetch
  await delay(2000);

  // 2. Fetch recent results (has built-in delays in mmaApi)
  let recentResults: Fight[] = [];
  try {
    recentResults = await mmaApi.getRecentResults();
    console.log(`[ODDS-CACHE] Got ${recentResults.length} recent results`);
  } catch (e) {
    console.error('[ODDS-CACHE] Failed to fetch recent results:', e);
  }

  await delay(2000);

  // 3. Fetch odds for all upcoming fights — batches of 2 with 1.5s delays
  const odds: Record<string, Odds> = {};
  for (let i = 0; i < upcomingFights.length; i += 2) {
    if (i > 0) await delay(1500);
    const batch = upcomingFights.slice(i, i + 2);
    const results = await Promise.allSettled(
      batch.map(f => mmaApi.getOdds({ fight: f.id }))
    );
    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (r.status === 'fulfilled' && r.value.length > 0) {
        odds[String(batch[j].id)] = r.value[0];
      }
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const oddsCount = Object.keys(odds).length;
  console.log(`[ODDS-CACHE] Done in ${elapsed}s — ${upcomingFights.length} fights, ${oddsCount} with odds, ${recentResults.length} recent results`);

  return {
    upcomingFights,
    recentResults,
    odds,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get cached odds data. Returns instantly from cache.
 * Cache is populated/refreshed by the /api/cron/odds endpoint.
 */
export const getCachedOddsData = unstable_cache(
  fetchAllOddsData,
  ['all-odds-data-v1'],
  { revalidate: false, tags: ['odds-data'] }
);

/**
 * Helper: get odds for a specific fight from cached data
 */
export function getOddsForFight(cachedData: CachedOddsData, fightId: number): Odds | null {
  return cachedData.odds[String(fightId)] || null;
}

/**
 * Helper: get fights for a specific date from cached data
 */
export function getFightsForDate(cachedData: CachedOddsData, date: string): Fight[] {
  return cachedData.upcomingFights.filter(f => f.date.split('T')[0] === date);
}

/**
 * Helper: group fights by date
 */
export function groupFightsByDate(fights: Fight[]): Map<string, Fight[]> {
  const map = new Map<string, Fight[]>();
  for (const fight of fights) {
    const date = fight.date.split('T')[0];
    const existing = map.get(date) || [];
    existing.push(fight);
    map.set(date, existing);
  }
  return map;
}
