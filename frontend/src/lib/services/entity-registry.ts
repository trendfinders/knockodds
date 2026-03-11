/**
 * Entity Registry
 *
 * Centralized registry of all known entities for interlinking.
 * Loaded from WordPress CMS and API-Sports, cached with ISR.
 */

interface FighterEntity {
  id: number;
  name: string;
  slug: string;
  aliases: string[];  // Alternative names/nicknames
}

interface EventEntity {
  slug: string;
  name: string;
  aliases: string[];  // e.g., "UFC 300", "UFC300"
  date: string;
}

interface BookmakerEntity {
  slug: string;
  name: string;
  aliases: string[];
}

export interface EntityRegistry {
  fighters: FighterEntity[];
  events: EventEntity[];
  bookmakers: BookmakerEntity[];
  lastUpdated: string;
}

// In-memory cache
let cachedRegistry: EntityRegistry | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour

/**
 * Load entity registry from CMS/API
 * In production, this fetches from WordPress custom endpoint
 */
export async function getEntityRegistry(): Promise<EntityRegistry> {
  // Return cached if fresh
  if (cachedRegistry && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedRegistry;
  }

  // Default registry with static data
  // In production, this would fetch from: GET /wp-json/ufc/v1/entities
  const registry: EntityRegistry = {
    fighters: [],
    events: [],
    bookmakers: [
      { slug: '22bet', name: '22Bet', aliases: ['22bet', '22 Bet'] },
      { slug: 'bet365', name: 'Bet365', aliases: ['bet365', 'Bet 365'] },
      { slug: 'unibet', name: 'Unibet', aliases: ['unibet'] },
      { slug: 'betway', name: 'Betway', aliases: ['betway'] },
      { slug: '888sport', name: '888Sport', aliases: ['888sport', '888 Sport'] },
    ],
    lastUpdated: new Date().toISOString(),
  };

  // Try to load from WordPress API
  try {
    const wpUrl = process.env.WP_URL || 'http://localhost:8080';

    // Load fighters
    const fightersRes = await fetch(`${wpUrl}/wp-json/wp/v2/fighter?per_page=100&_fields=id,title,acf`, {
      next: { revalidate: 3600 },
    });
    if (fightersRes.ok) {
      const fighters = await fightersRes.json();
      registry.fighters = fighters.map((f: any) => ({
        id: f.acf?.fighter_api_id || f.id,
        name: f.title?.rendered || '',
        slug: String(f.acf?.fighter_api_id || f.id),
        aliases: [f.acf?.nickname].filter(Boolean),
      }));
    }

    // Load events (fights grouped by event slug)
    const fightsRes = await fetch(`${wpUrl}/wp-json/wp/v2/fight?per_page=50&_fields=id,title,acf`, {
      next: { revalidate: 3600 },
    });
    if (fightsRes.ok) {
      const fights = await fightsRes.json();
      const eventMap = new Map<string, EventEntity>();
      for (const fight of fights) {
        const eventSlug = fight.acf?.event_slug;
        if (eventSlug && !eventMap.has(eventSlug)) {
          const slug = eventSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          eventMap.set(eventSlug, {
            slug,
            name: eventSlug,
            aliases: [eventSlug.replace(/:/g, '').replace(/\s+/g, ' ')],
            date: fight.acf?.fight_date || '',
          });
        }
      }
      registry.events = Array.from(eventMap.values());
    }
  } catch (error) {
    // Silently fail - use static data
    console.warn('[EntityRegistry] Failed to load from CMS:', error);
  }

  cachedRegistry = registry;
  cacheTimestamp = Date.now();
  return registry;
}

/**
 * Build interlink entities from registry
 */
export function registryToInterlinkEntities(registry: EntityRegistry) {
  const fighters = registry.fighters.map(f => ({ id: f.id, name: f.name }));
  const events = registry.events.map(e => ({ slug: e.slug, name: e.name }));
  return { fighters, events };
}
