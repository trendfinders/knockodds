import { NextRequest, NextResponse } from 'next/server';
import { mmaApi } from '@/lib/api/mma-api';
import { generatePronostic, generateSEOMeta } from '@/lib/api/openai';
import { getJWTToken } from '@/lib/api/wordpress';
import { getCachedOddsData } from '@/lib/cache/odds-cache';
import type { Fight, Odds } from '@/lib/types/mma-api';

export const runtime = 'nodejs';
export const maxDuration = 300;

const WP_URL = process.env.WP_URL || 'http://localhost:8080';
const WP_API = `${WP_URL}/wp-json`;

const MAX_PER_RUN = 3;

async function hasPrediction(fightApiId: number, token: string): Promise<boolean> {
  try {
    const url = new URL(`${WP_API}/wp/v2/pronostic`);
    url.searchParams.set('meta_key', 'fight_api_id');
    url.searchParams.set('meta_value', String(fightApiId));
    url.searchParams.set('per_page', '1');
    const res = await fetch(url.toString(), {
      headers: { 'Authorization': token },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

async function buildFighterProfile(fighterId: number): Promise<string> {
  try {
    const fighter = await mmaApi.getFighterById(fighterId);
    if (!fighter) return `Fighter ID ${fighterId}: data not available`;

    await new Promise(r => setTimeout(r, 500));

    const record = await mmaApi.getFighterRecords(fighterId);

    let profile = `## ${fighter.name}`;
    if (fighter.nickname) profile += ` "${fighter.nickname}"`;
    profile += `\n- Category: ${fighter.category}`;
    profile += `\n- Height: ${fighter.height}, Weight: ${fighter.weight}, Reach: ${fighter.reach}`;
    profile += `\n- Stance: ${fighter.stance}`;

    if (record) {
      profile += `\n- Record: ${record.total.win}W-${record.total.loss}L-${record.total.draw}D`;
      const totalWins = Math.max(record.total.win, 1);
      profile += `\n- KO wins: ${record.ko.win}/${record.total.win} (${Math.round(record.ko.win / totalWins * 100)}%)`;
      profile += `\n- SUB wins: ${record.sub.win}/${record.total.win}`;
      profile += `\n- KO losses: ${record.ko.loss}, SUB losses: ${record.sub.loss}`;
    }

    return profile;
  } catch (e) {
    return `Fighter ID ${fighterId}: error fetching data`;
  }
}

function formatOdds(odds: Odds | null): string {
  if (!odds || !odds.bookmakers || odds.bookmakers.length === 0) return 'Odds not available';

  const bm = odds.bookmakers[0];
  const homeAway = bm.bets.find(b => b.name === 'Home/Away');
  if (!homeAway) return `Odds available from ${bm.name} but no Home/Away market found`;

  return `Odds (${bm.name}): ${homeAway.values.map(v => `${v.value}: ${v.odd}`).join(', ')}`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const results: string[] = [];
  let generated = 0;

  try {
    let token: string;
    try {
      token = await getJWTToken();
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Failed to authenticate with WordPress. Check WP_API_USER and WP_API_PASSWORD.',
        detail: e instanceof Error ? e.message : String(e),
      }, { status: 500 });
    }

    // Get upcoming fights from cached data
    let upcomingFights: Fight[] = [];
    let oddsMap: Record<string, Odds> = {};
    try {
      const cachedData = await getCachedOddsData();
      upcomingFights = cachedData.upcomingFights;
      oddsMap = cachedData.odds;
      results.push(`Got ${upcomingFights.length} upcoming fights from cache`);
    } catch (e) {
      results.push(`Cache error: ${e instanceof Error ? e.message : 'unknown'}`);
      return NextResponse.json({ success: false, results, error: 'No cached fight data available' }, { status: 500 });
    }

    // Filter: only fights with both fighters, upcoming in next 14 days
    const now = new Date();
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const eligibleFights = upcomingFights.filter(f => {
      const fightDate = new Date(f.date);
      return fightDate > now && fightDate < twoWeeks &&
        f.fighters?.first?.id && f.fighters?.second?.id;
    });

    results.push(`${eligibleFights.length} fights eligible (within 14 days)`);

    let processed = 0;
    for (const fight of eligibleFights) {
      if (generated >= MAX_PER_RUN) break;

      try {
        // Check if pronostic already exists
        if (await hasPrediction(fight.id, token)) {
          continue;
        }

        processed++;
        results.push(`Processing: ${fight.fighters.first.name} vs ${fight.fighters.second.name}`);

        // Build fighter profiles (API calls with rate limiting)
        const profile1 = await buildFighterProfile(fight.fighters.first.id);
        await new Promise(r => setTimeout(r, 500));
        const profile2 = await buildFighterProfile(fight.fighters.second.id);

        // Get odds for this fight
        const fightOdds = oddsMap[String(fight.id)] || null;
        const oddsInfo = formatOdds(fightOdds);

        // Generate pronostic via AI
        const prompt = `# Fight Analysis: ${fight.fighters.first.name} vs ${fight.fighters.second.name}
Date: ${fight.date}
Category: ${fight.category}

${profile1}

${profile2}

${oddsInfo}

Generate a detailed pronostic for this fight.`;

        const pronostic = await generatePronostic(prompt, 'it');
        const seo = await generateSEOMeta(pronostic.content, 'it');

        // Publish to WordPress
        const res = await fetch(`${WP_API}/wp/v2/pronostic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          body: JSON.stringify({
            title: pronostic.title,
            content: pronostic.content,
            excerpt: pronostic.excerpt,
            status: 'publish',
            acf: {
              fight_api_id: fight.id,
              predicted_winner_id: fight.fighters.first.id, // default, AI chooses in content
              confidence: pronostic.prediction.confidence,
              predicted_method: pronostic.prediction.method,
              analysis_data: JSON.stringify(pronostic),
              seo_title: seo.seo_title,
              meta_description: seo.meta_description,
            },
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          results.push(`WP error for fight ${fight.id}: ${err}`);
          continue;
        }

        generated++;
        results.push(`Published: "${pronostic.title}"`);

        // Rate limit between articles
        await new Promise(r => setTimeout(r, 3000));
      } catch (e) {
        results.push(`Error fight ${fight.id}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      elapsed: `${elapsed}s`,
      generated,
      processed,
      results,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      elapsed: `${((Date.now() - start) / 1000).toFixed(1)}s`,
      error: e instanceof Error ? e.message : 'Unknown error',
      results,
    }, { status: 500 });
  }
}
