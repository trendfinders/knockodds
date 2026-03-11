import { mmaFetch } from '../shared/mma-client.js';
import { wpGet, wpPost, wpFindByMeta } from '../shared/wp-client.js';
import { aiGeneratePronostic, aiGenerateSEO } from '../shared/openai-client.js';
import { createLogger } from '../shared/logger.js';

const log = createLogger('generate-pronostics');

interface Fighter {
  id: number;
  name: string;
  nickname: string | null;
  category: string;
  height: string;
  weight: string;
  reach: string;
  stance: string;
}

interface FighterRecord {
  fighter: { id: number; name: string };
  total: { win: number; loss: number; draw: number };
  ko: { win: number; loss: number };
  sub: { win: number; loss: number };
}

interface Odds {
  fight: { id: number };
  bookmakers: Array<{
    id: number;
    name: string;
    bets: Array<{
      id: number;
      name: string;
      values: Array<{ value: string; odd: string }>;
    }>;
  }>;
}

async function buildFighterProfile(fighterId: number): Promise<string> {
  const fighters = await mmaFetch<Fighter>('fighters', { id: String(fighterId) });
  const fighter = fighters[0];
  if (!fighter) return `Fighter ID ${fighterId}: data not available`;

  await new Promise(r => setTimeout(r, 300));

  const records = await mmaFetch<FighterRecord>('fighters/records', { id: String(fighterId) });
  const record = records[0];

  let profile = `## ${fighter.name}`;
  if (fighter.nickname) profile += ` "${fighter.nickname}"`;
  profile += `\n- Category: ${fighter.category}`;
  profile += `\n- Height: ${fighter.height}, Weight: ${fighter.weight}, Reach: ${fighter.reach}`;
  profile += `\n- Stance: ${fighter.stance}`;

  if (record) {
    const total = record.total.win + record.total.loss + record.total.draw;
    profile += `\n- Record: ${record.total.win}W-${record.total.loss}L-${record.total.draw}D`;
    profile += `\n- KO wins: ${record.ko.win}/${record.total.win} (${total > 0 ? Math.round(record.ko.win / Math.max(record.total.win, 1) * 100) : 0}%)`;
    profile += `\n- SUB wins: ${record.sub.win}/${record.total.win}`;
    profile += `\n- KO losses: ${record.ko.loss}, SUB losses: ${record.sub.loss}`;
  }

  return profile;
}

async function main() {
  log.info('Starting pronostics generation job');

  // Get upcoming fights that don't have pronostics yet
  const fights = await wpGet<any[]>('/ufc/v1/upcoming-fights', { per_page: '20' });
  log.info(`Found ${fights.length} upcoming fights`);

  let generated = 0;

  for (const fight of fights) {
    const fightApiId = fight.fight_api_id;
    if (!fightApiId) continue;

    // Check if pronostic already exists
    const existing = await wpFindByMeta('pronostic', 'fight_api_id', fightApiId);
    if (existing) {
      log.debug(`Pronostic already exists for fight ${fightApiId}`);
      continue;
    }

    try {
      log.info(`Generating pronostic for: ${fight.title}`);

      // Build fighter profiles
      const profile1 = await buildFighterProfile(fight.fighter1_id);
      await new Promise(r => setTimeout(r, 300));
      const profile2 = await buildFighterProfile(fight.fighter2_id);

      // Fetch odds
      let oddsInfo = 'Odds not available';
      try {
        const odds = await mmaFetch<Odds>('odds', { fight: String(fightApiId) });
        if (odds.length > 0 && odds[0].bookmakers.length > 0) {
          const bm = odds[0].bookmakers[0];
          const homeAway = bm.bets.find(b => b.name === 'Home/Away');
          if (homeAway) {
            oddsInfo = `Odds (${bm.name}): ${homeAway.values.map(v => `${v.value}: ${v.odd}`).join(', ')}`;
          }
        }
      } catch {
        log.warn(`Could not fetch odds for fight ${fightApiId}`);
      }

      const prompt = `# Fight Analysis: ${fight.title}
Event: ${fight.event_slug || 'TBD'}
Date: ${fight.fight_date}
Category: ${fight.category}

${profile1}

${profile2}

${oddsInfo}

Generate a detailed pronostic for this fight.`;

      const pronostic = await aiGeneratePronostic(prompt);
      const seo = await aiGenerateSEO(pronostic.content);

      // Publish to WordPress
      await wpPost('/wp/v2/pronostic', {
        title: pronostic.title,
        content: pronostic.content,
        excerpt: pronostic.excerpt,
        status: 'publish',
        acf: {
          fight_api_id: fightApiId,
          predicted_winner_id: pronostic.prediction.winner_id,
          confidence: pronostic.prediction.confidence,
          predicted_method: pronostic.prediction.method,
          recommended_bet: pronostic.prediction.recommended_bet,
          analysis_data: JSON.stringify(pronostic),
        },
      });

      generated++;
      log.info(`Generated pronostic: ${pronostic.title}`);
    } catch (err) {
      log.error(`Failed for fight ${fightApiId}`, { error: String(err) });
    }

    await new Promise(r => setTimeout(r, 3000)); // Rate limit
  }

  log.info(`Pronostics generation completed: ${generated} new pronostics`);
}

main().catch((err) => {
  log.error('Job failed', { error: String(err) });
  process.exit(1);
});
