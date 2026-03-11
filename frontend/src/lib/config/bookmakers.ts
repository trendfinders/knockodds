export interface BookmakerConfig {
  apiId: number;
  name: string;
  slug: string;
  logo: string;           // Path to logo in /public/bookmakers/
  affiliateUrl: string;
  affiliateId: string;
  priority: number;
  enabled: boolean;       // Toggle visibility from here
  /** ISO 3166-1 alpha-2 country codes where this bookmaker is allowed. Empty = all countries */
  allowedCountries?: string[];
  /** ISO 3166-1 alpha-2 country codes where this bookmaker is BLOCKED (legal restrictions) */
  blockedCountries?: string[];
  /** Geo-specific affiliate URLs: { countryCode: url } — overrides affiliateUrl for that country */
  geoAffiliateUrls?: Record<string, string>;
}

/**
 * Welcome bonus per bookmaker per currency.
 * Each entry: { amount: number, wagering: string }
 * The currency symbol is resolved at display time from user preferences.
 */
export interface BonusInfo {
  amount: number;
  wagering: string;       // e.g. "5x" or "1x"
  minOdds?: number;       // Minimum odds requirement (decimal)
  percentage: number;     // e.g. 100 = 100% match
}

export const BOOKMAKER_BONUSES: Record<string, Record<string, BonusInfo>> = {
  bet365: {
    EUR: { amount: 100, percentage: 100, wagering: '1x', minOdds: 1.20 },
    USD: { amount: 100, percentage: 100, wagering: '1x', minOdds: 1.20 },
    GBP: { amount: 50, percentage: 100, wagering: '1x', minOdds: 1.20 },
    BRL: { amount: 500, percentage: 100, wagering: '1x', minOdds: 1.20 },
    MXN: { amount: 2000, percentage: 100, wagering: '1x', minOdds: 1.20 },
    PLN: { amount: 400, percentage: 100, wagering: '1x', minOdds: 1.20 },
    RUB: { amount: 10000, percentage: 100, wagering: '1x', minOdds: 1.20 },
    UAH: { amount: 4000, percentage: 100, wagering: '1x', minOdds: 1.20 },
    BGN: { amount: 200, percentage: 100, wagering: '1x', minOdds: 1.20 },
    CAD: { amount: 100, percentage: 100, wagering: '1x', minOdds: 1.20 },
    AUD: { amount: 100, percentage: 100, wagering: '1x', minOdds: 1.20 },
    INR: { amount: 8000, percentage: 100, wagering: '1x', minOdds: 1.20 },
  },
  unibet: {
    EUR: { amount: 50, percentage: 100, wagering: '5x', minOdds: 1.40 },
    USD: { amount: 50, percentage: 100, wagering: '5x', minOdds: 1.40 },
    GBP: { amount: 40, percentage: 100, wagering: '5x', minOdds: 1.40 },
    BRL: { amount: 250, percentage: 100, wagering: '5x', minOdds: 1.40 },
    MXN: { amount: 1000, percentage: 100, wagering: '5x', minOdds: 1.40 },
    PLN: { amount: 200, percentage: 100, wagering: '5x', minOdds: 1.40 },
    SEK: { amount: 500, percentage: 100, wagering: '5x', minOdds: 1.40 },
    NOK: { amount: 500, percentage: 100, wagering: '5x', minOdds: 1.40 },
    DKK: { amount: 350, percentage: 100, wagering: '5x', minOdds: 1.40 },
    CAD: { amount: 50, percentage: 100, wagering: '5x', minOdds: 1.40 },
    AUD: { amount: 50, percentage: 100, wagering: '5x', minOdds: 1.40 },
  },
  betway: {
    EUR: { amount: 100, percentage: 100, wagering: '6x', minOdds: 1.75 },
    USD: { amount: 100, percentage: 100, wagering: '6x', minOdds: 1.75 },
    GBP: { amount: 50, percentage: 100, wagering: '6x', minOdds: 1.75 },
    BRL: { amount: 500, percentage: 100, wagering: '6x', minOdds: 1.75 },
    MXN: { amount: 2000, percentage: 100, wagering: '6x', minOdds: 1.75 },
    PLN: { amount: 400, percentage: 100, wagering: '6x', minOdds: 1.75 },
    INR: { amount: 8000, percentage: 100, wagering: '6x', minOdds: 1.75 },
    ZAR: { amount: 2000, percentage: 100, wagering: '6x', minOdds: 1.75 },
    NGN: { amount: 100000, percentage: 100, wagering: '6x', minOdds: 1.75 },
    CAD: { amount: 100, percentage: 100, wagering: '6x', minOdds: 1.75 },
  },
  '888sport': {
    EUR: { amount: 30, percentage: 100, wagering: '3x', minOdds: 1.50 },
    USD: { amount: 30, percentage: 100, wagering: '3x', minOdds: 1.50 },
    GBP: { amount: 30, percentage: 100, wagering: '3x', minOdds: 1.50 },
    BRL: { amount: 150, percentage: 100, wagering: '3x', minOdds: 1.50 },
    CAD: { amount: 30, percentage: 100, wagering: '3x', minOdds: 1.50 },
    SEK: { amount: 300, percentage: 100, wagering: '3x', minOdds: 1.50 },
  },
  bwin: {
    EUR: { amount: 100, percentage: 100, wagering: '5x', minOdds: 1.70 },
    USD: { amount: 100, percentage: 100, wagering: '5x', minOdds: 1.70 },
    GBP: { amount: 50, percentage: 100, wagering: '5x', minOdds: 1.70 },
    BRL: { amount: 500, percentage: 100, wagering: '5x', minOdds: 1.70 },
    MXN: { amount: 2000, percentage: 100, wagering: '5x', minOdds: 1.70 },
    PLN: { amount: 400, percentage: 100, wagering: '5x', minOdds: 1.70 },
    RUB: { amount: 10000, percentage: 100, wagering: '5x', minOdds: 1.70 },
    CAD: { amount: 100, percentage: 100, wagering: '5x', minOdds: 1.70 },
  },
};

/** Get bonus for a bookmaker in user's currency, fallback to EUR then USD */
export function getBookmakerBonus(slug: string, currency: string): { bonus: BonusInfo; currency: string } | null {
  const bonuses = BOOKMAKER_BONUSES[slug];
  if (!bonuses) return null;
  if (bonuses[currency]) return { bonus: bonuses[currency], currency };
  if (bonuses['EUR']) return { bonus: bonuses['EUR'], currency: 'EUR' };
  if (bonuses['USD']) return { bonus: bonuses['USD'], currency: 'USD' };
  return null;
}

/** Format bonus text: "100% up to €100" */
export function formatBonusText(slug: string, currency: string, currencySymbol: string, template: string): string {
  const result = getBookmakerBonus(slug, currency);
  if (!result) return '';
  const { bonus } = result;
  return template
    .replace('{percentage}', String(bonus.percentage))
    .replace('{symbol}', currencySymbol)
    .replace('{amount}', bonus.amount.toLocaleString())
    .replace('{wagering}', bonus.wagering);
}

/**
 * BOOKMAKER CONFIG — Edit this to manage logos, affiliate links, and visibility.
 *
 * - `logo`: Place SVG/PNG files in /public/bookmakers/ and reference them here
 * - `affiliateUrl`: Your affiliate base URL (with tracking params appended automatically)
 * - `affiliateId`: Your affiliate ID for this bookmaker
 * - `enabled`: Set to false to hide a bookmaker from all pages
 * - `priority`: Lower = shown first
 */
export const BOOKMAKER_CONFIGS: BookmakerConfig[] = [
  {
    apiId: 5, name: 'Bet365', slug: 'bet365', logo: '/bookmakers/bet365.svg',
    affiliateUrl: 'https://www.bet365.com', affiliateId: 'knockodds', priority: 1, enabled: true,
    blockedCountries: ['US', 'FR', 'TR', 'BE', 'NL', 'CY', 'SG'],
    geoAffiliateUrls: { IT: 'https://www.bet365.it', ES: 'https://www.bet365.es', DE: 'https://www.bet365.de' },
  },
  {
    apiId: 6, name: 'Unibet', slug: 'unibet', logo: '/bookmakers/unibet.svg',
    affiliateUrl: 'https://www.unibet.com', affiliateId: 'knockodds', priority: 2, enabled: true,
    blockedCountries: ['US', 'TR', 'SG'],
    geoAffiliateUrls: { IT: 'https://www.unibet.it', FR: 'https://www.unibet.fr', ES: 'https://www.unibet.es' },
  },
  {
    apiId: 11, name: 'Betway', slug: 'betway', logo: '/bookmakers/betway.svg',
    affiliateUrl: 'https://www.betway.com', affiliateId: 'knockodds', priority: 3, enabled: true,
    blockedCountries: ['US', 'FR', 'TR', 'AU'],
  },
  {
    apiId: 13, name: '888Sport', slug: '888sport', logo: '/bookmakers/888sport.svg',
    affiliateUrl: 'https://www.888sport.com', affiliateId: 'knockodds', priority: 4, enabled: true,
    blockedCountries: ['US', 'FR', 'TR', 'AU', 'BE'],
    geoAffiliateUrls: { IT: 'https://www.888sport.it', ES: 'https://www.888sport.es' },
  },
  {
    apiId: 2, name: 'bwin', slug: 'bwin', logo: '/bookmakers/bwin.svg',
    affiliateUrl: 'https://www.bwin.com', affiliateId: 'knockodds', priority: 5, enabled: true,
    blockedCountries: ['US', 'GB', 'TR', 'AU'],
    geoAffiliateUrls: { IT: 'https://www.bwin.it', FR: 'https://www.bwin.fr', ES: 'https://www.bwin.es', DE: 'https://www.bwin.de' },
  },
  {
    apiId: 1, name: 'Marathon', slug: 'marathon', logo: '/bookmakers/marathon.svg',
    affiliateUrl: 'https://www.marathonbet.com', affiliateId: 'knockodds', priority: 6, enabled: false,
    blockedCountries: ['US', 'GB', 'IT', 'FR', 'ES', 'DE'],
  },
];

/** Active bookmakers only, sorted by priority */
export const ACTIVE_BOOKMAKERS = BOOKMAKER_CONFIGS.filter(b => b.enabled).sort((a, b) => a.priority - b.priority);

/** Top 3 bookmakers shown inline on listing pages */
export const TOP_BOOKMAKERS = ACTIVE_BOOKMAKERS.slice(0, 3);

/** Map of API bookmaker ID → config */
const configMap = new Map(BOOKMAKER_CONFIGS.map(b => [b.apiId, b]));

export function getBookmakerConfig(apiId: number): BookmakerConfig | undefined {
  return configMap.get(apiId);
}

/** Build affiliate URL with UTM tracking, geo-aware */
export function buildAffiliateUrl(config: BookmakerConfig, context?: string, countryCode?: string): string {
  const baseUrl = (countryCode && config.geoAffiliateUrls?.[countryCode]) || config.affiliateUrl;
  const url = new URL(baseUrl);
  url.searchParams.set('ref', config.affiliateId);
  url.searchParams.set('utm_source', 'knockodds');
  url.searchParams.set('utm_medium', 'referral');
  if (context) url.searchParams.set('utm_content', context);
  return url.toString();
}

/** Check if a bookmaker is available in a specific country */
export function isBookmakerAvailableInCountry(config: BookmakerConfig, countryCode: string): boolean {
  const cc = countryCode.toUpperCase();
  if (config.blockedCountries?.includes(cc)) return false;
  if (config.allowedCountries && config.allowedCountries.length > 0) {
    return config.allowedCountries.includes(cc);
  }
  return true;
}

/** Filter active bookmakers by country code */
export function getBookmakersForCountry(countryCode?: string): BookmakerConfig[] {
  if (!countryCode) return ACTIVE_BOOKMAKERS;
  return ACTIVE_BOOKMAKERS.filter(b => isBookmakerAvailableInCountry(b, countryCode));
}

/**
 * Map locale → default country code (for initial filtering before geo-IP).
 * Users can override via preferences. Geo-IP detection can refine this.
 */
export const LOCALE_TO_COUNTRY: Record<string, string> = {
  it: 'IT',
  fr: 'FR',
  de: 'DE',
  es: 'ES',
  'es-mx': 'MX',
  pt: 'PT',
  'pt-br': 'BR',
  ru: 'RU',
  uk: 'UA',
  bg: 'BG',
  pl: 'PL',
  el: 'GR',
  en: 'GB', // Default English to GB; US users would be detected by geo-IP
};
