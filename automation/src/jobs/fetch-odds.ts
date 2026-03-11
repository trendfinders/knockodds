import { mmaFetch } from '../shared/mma-client.js';
import { wpGet, wpUpdate } from '../shared/wp-client.js';
import { createLogger } from '../shared/logger.js';

const log = createLogger('fetch-odds');

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

async function main() {
  log.info('Starting odds fetch job');

  // Get upcoming fights from WordPress
  const fights = await wpGet<any[]>('/ufc/v1/upcoming-fights', { per_page: '20' });
  log.info(`Found ${fights.length} upcoming fights`);

  let updated = 0;

  for (const fight of fights) {
    const fightApiId = fight.fight_api_id;
    if (!fightApiId) continue;

    try {
      const odds = await mmaFetch<Odds>('odds', { fight: String(fightApiId) });

      if (odds.length > 0) {
        // Store odds as JSON in fight meta
        await wpUpdate('/wp/v2/fight', fight.id, {
          acf: {
            odds_data: JSON.stringify(odds[0]),
            last_synced: new Date().toISOString(),
          },
        });
        updated++;
        log.info(`Updated odds for fight ${fightApiId}`);
      }
    } catch (err) {
      log.error(`Failed to fetch odds for fight ${fightApiId}`, { error: String(err) });
    }

    await new Promise(r => setTimeout(r, 500));
  }

  log.info(`Odds fetch completed: ${updated} fights updated`);
}

main().catch((err) => {
  log.error('Job failed', { error: String(err) });
  process.exit(1);
});
