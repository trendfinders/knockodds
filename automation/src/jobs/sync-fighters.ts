import { mmaFetch } from '../shared/mma-client.js';
import { wpPost, wpUpdate, wpFindByMeta } from '../shared/wp-client.js';
import { createLogger } from '../shared/logger.js';

const log = createLogger('sync-fighters');

interface Fighter {
  id: number;
  name: string;
  nickname: string | null;
  photo: string;
  gender: string;
  birth_date: string;
  age: number;
  height: string;
  weight: string;
  reach: string;
  stance: string;
  category: string;
  team: { id: number; name: string };
}

interface FighterRecord {
  fighter: { id: number; name: string; photo: string };
  total: { win: number; loss: number; draw: number };
  ko: { win: number; loss: number };
  sub: { win: number; loss: number };
}

const CATEGORIES = [
  'Heavyweight', 'Light Heavyweight', 'Middleweight', 'Welterweight',
  'Lightweight', 'Featherweight', 'Bantamweight', 'Flyweight',
  "Women's Bantamweight", "Women's Flyweight", "Women's Strawweight", "Women's Featherweight"
];

async function syncFightersByCategory(category: string) {
  log.info(`Syncing fighters for ${category}`);
  const fighters = await mmaFetch<Fighter>('fighters', { category });

  let created = 0;
  let updated = 0;

  for (const fighter of fighters) {
    // Fetch record
    let record: FighterRecord | null = null;
    try {
      const records = await mmaFetch<FighterRecord>('fighters/records', { id: String(fighter.id) });
      record = records[0] ?? null;
      await new Promise(r => setTimeout(r, 300)); // Rate limit
    } catch {
      log.warn(`Could not fetch record for fighter ${fighter.id}`);
    }

    const existing = await wpFindByMeta('fighter', 'fighter_api_id', fighter.id);

    const postData = {
      title: fighter.name,
      status: 'publish',
      excerpt: `${fighter.name}${fighter.nickname ? ` "${fighter.nickname}"` : ''} - ${fighter.category}`,
      acf: {
        fighter_api_id: fighter.id,
        category: fighter.category,
        team_name: fighter.team?.name ?? '',
        nickname: fighter.nickname ?? '',
        height: fighter.height,
        weight: fighter.weight,
        reach: fighter.reach,
        stance: fighter.stance,
        record_wins: record?.total.win ?? 0,
        record_losses: record?.total.loss ?? 0,
        record_draws: record?.total.draw ?? 0,
        photo_cdn: fighter.photo,
        last_synced: new Date().toISOString(),
      },
    };

    if (existing) {
      await wpUpdate('/wp/v2/fighter', existing.id, postData);
      updated++;
    } else {
      await wpPost('/wp/v2/fighter', postData);
      created++;
    }
  }

  log.info(`${category}: ${created} created, ${updated} updated`);
}

async function main() {
  log.info('Starting fighter sync job');

  for (const category of CATEGORIES) {
    try {
      await syncFightersByCategory(category);
    } catch (err) {
      log.error(`Failed to sync ${category}`, { error: String(err) });
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  log.info('Fighter sync job completed');
}

main().catch((err) => {
  log.error('Job failed', { error: String(err) });
  process.exit(1);
});
