/**
 * User Preferences: Language, Odds Format, Currency
 * Stored in localStorage + cookie for server access
 */

import type { Locale } from './config';

// --- Odds Formats ---
export type OddsFormat = 'decimal' | 'american' | 'fractional' | 'implied';

export const oddsFormats: Record<OddsFormat, string> = {
  decimal: 'Decimal (1.50)',
  american: 'American (-200)',
  fractional: 'Fractional (1/2)',
  implied: 'Implied (66.7%)',
};

// --- Currencies ---
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const currencies: CurrencyInfo[] = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
  { code: 'MXN', symbol: 'MX$', name: 'Peso Mexicano' },
  { code: 'ARS', symbol: 'AR$', name: 'Peso Argentino' },
  { code: 'CLP', symbol: 'CL$', name: 'Peso Chileno' },
  { code: 'COP', symbol: 'CO$', name: 'Peso Colombiano' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
];

// Default currency per locale
export const defaultCurrencyByLocale: Record<Locale, string> = {
  'es': 'EUR',
  'it': 'EUR',
  'fr': 'EUR',
  'de': 'EUR',
  'pt': 'EUR',
  'pt-br': 'BRL',
  'ru': 'RUB',
  'uk': 'UAH',
  'en': 'EUR',
  'bg': 'BGN',
  'pl': 'PLN',
  'el': 'EUR',
  'es-mx': 'MXN',
};

// Default odds format per locale
export const defaultOddsFormatByLocale: Record<Locale, OddsFormat> = {
  'es': 'decimal',
  'it': 'decimal',
  'fr': 'decimal',
  'de': 'decimal',
  'pt': 'decimal',
  'pt-br': 'decimal',
  'ru': 'decimal',
  'uk': 'decimal',
  'en': 'fractional',
  'bg': 'decimal',
  'pl': 'decimal',
  'el': 'decimal',
  'es-mx': 'american',
};

// --- User Preferences ---
export interface UserPreferences {
  locale: Locale;
  oddsFormat: OddsFormat;
  currency: string;
  configured: boolean; // true after user has seen popup and saved
}

const PREFS_KEY = 'ko_user_prefs';
const PREFS_COOKIE = 'KO_PREFS';

export function getDefaultPreferences(locale: Locale = 'en'): UserPreferences {
  return {
    locale,
    oddsFormat: defaultOddsFormatByLocale[locale],
    currency: defaultCurrencyByLocale[locale],
    configured: false,
  };
}

export function loadPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserPreferences;
  } catch {
    return null;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  const data = JSON.stringify(prefs);
  localStorage.setItem(PREFS_KEY, data);
  // Also set cookie for server-side access (1 year)
  document.cookie = `${PREFS_COOKIE}=${encodeURIComponent(data)}; path=/; max-age=31536000; SameSite=Lax`;
}

// --- Odds conversion utilities ---
export function convertOdds(decimalOdds: number, format: OddsFormat): string {
  switch (format) {
    case 'decimal':
      return decimalOdds.toFixed(2);
    case 'american': {
      if (decimalOdds >= 2) {
        return `+${Math.round((decimalOdds - 1) * 100)}`;
      }
      return `${Math.round(-100 / (decimalOdds - 1))}`;
    }
    case 'fractional': {
      const numerator = Math.round((decimalOdds - 1) * 100);
      const denominator = 100;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const d = gcd(Math.abs(numerator), denominator);
      return `${numerator / d}/${denominator / d}`;
    }
    case 'implied':
      return `${((1 / decimalOdds) * 100).toFixed(1)}%`;
    default:
      return decimalOdds.toFixed(2);
  }
}
