import type { Fight } from '@/lib/types/mma-api';

const ORG_PATTERN = /^(UFC|Bellator|PFL|ONE Championship|ONE FC|Cage Warriors|RIZIN|LFA|Invicta)/i;

const ORG_NORMALIZE: Record<string, string> = {
  'one fc': 'ONE Championship',
};

/**
 * Extract organization name from the API-Sports fight slug.
 * e.g. "UFC Fight Night: Holloway vs Korean Zombie" → "UFC"
 */
export function extractOrganization(fightSlug: string): string {
  const match = fightSlug.match(ORG_PATTERN);
  if (!match) return 'MMA';
  const raw = match[1];
  const normalized = ORG_NORMALIZE[raw.toLowerCase()];
  if (normalized) return normalized;
  if (raw.toUpperCase().startsWith('UFC')) return 'UFC';
  return raw;
}

/**
 * Get the full event display name from fights sharing the same date/event.
 * All fights on the same card share the same slug from the API.
 */
export function getEventDisplayName(fights: Fight[]): string | null {
  if (fights.length === 0) return null;
  return fights[0].slug || null;
}

/**
 * Get the organization name from a set of fights on the same card.
 */
export function getOrganizationFromFights(fights: Fight[]): string {
  const slug = fights[0]?.slug;
  if (!slug) return 'MMA';
  return extractOrganization(slug);
}
