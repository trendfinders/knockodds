import { mmaFetch } from '../shared/mma-client.js';
import { wpPost, wpUpdate, wpFindByMeta } from '../shared/wp-client.js';
import { createLogger } from '../shared/logger.js';

const log = createLogger('sync-fights');

interface Fight {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  slug: string;
  is_main: boolean;
  category: string;
  status: { long: string; short: string };
  fighters: {
    first: { id: number; name: string; logo: string; winner: boolean | null };
    second: { id: number; name: string; logo: string; winner: boolean | null };
  };
}

async function syncFightsForDate(date: string) {
  log.info(`Syncing fights for ${date}`);
  const fights = await mmaFetch<Fight>('fights', { date });

  let created = 0;
  let updated = 0;

  for (const fight of fights) {
    const existing = await wpFindByMeta('fight', 'fight_api_id', fight.id);
    const title = `${fight.fighters.first.name} vs ${fight.fighters.second.name}`;

    const postData = {
      title,
      status: 'publish',
      content: `${fight.slug} - ${fight.category}`,
      acf: {
        fight_api_id: fight.id,
        event_slug: fight.slug,
        fight_date: fight.date,
        category: fight.category,
        fighter1_id: fight.fighters.first.id,
        fighter2_id: fight.fighters.second.id,
        status: fight.status.short,
        is_main: fight.is_main,
        last_synced: new Date().toISOString(),
      },
    };

    if (existing) {
      await wpUpdate('/wp/v2/fight', existing.id, postData);
      updated++;
    } else {
      await wpPost('/wp/v2/fight', postData);
      created++;
    }
  }

  log.info(`Date ${date}: ${created} created, ${updated} updated`);
}

async function main() {
  log.info('Starting fight sync job');

  // Sync next 30 days
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    try {
      await syncFightsForDate(dateStr);
    } catch (err) {
      log.error(`Failed to sync ${dateStr}`, { error: String(err) });
    }

    // Rate limit: ~2 requests per second
    await new Promise(r => setTimeout(r, 500));
  }

  log.info('Fight sync job completed');
}

main().catch((err) => {
  log.error('Job failed', { error: String(err) });
  process.exit(1);
});
