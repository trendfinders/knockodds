export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'it', 'fr', 'de', 'pt', 'pt-br', 'ru', 'uk', 'bg', 'pl', 'el', 'es-mx'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

// Display names for language switcher
export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'es': 'Español',
  'it': 'Italiano',
  'fr': 'Français',
  'de': 'Deutsch',
  'pt': 'Português',
  'pt-br': 'Português (Brasil)',
  'ru': 'Русский',
  'uk': 'Українська',
  'bg': 'Български',
  'pl': 'Polski',
  'el': 'Ελληνικά',
  'es-mx': 'Español (México)',
};

// Country flags for UI
export const localeFlags: Record<Locale, string> = {
  'en': '🇮🇪', 'es': '🇪🇸', 'it': '🇮🇹', 'fr': '🇫🇷', 'de': '🇩🇪', 'pt': '🇵🇹',
  'pt-br': '🇧🇷', 'ru': '🇷🇺', 'uk': '🇺🇦', 'bg': '🇧🇬',
  'pl': '🇵🇱', 'el': '🇬🇷', 'es-mx': '🇲🇽',
};

// URL prefix: empty for default locale (English), /{locale} for others
export function localePrefix(locale: Locale | string): string {
  return locale === i18n.defaultLocale ? '' : `/${locale}`;
}

// HTML lang attributes
export const localeHtmlLang: Record<Locale, string> = {
  'en': 'en-IE', 'es': 'es', 'it': 'it', 'fr': 'fr', 'de': 'de', 'pt': 'pt',
  'pt-br': 'pt-BR', 'ru': 'ru', 'uk': 'uk', 'bg': 'bg',
  'pl': 'pl', 'el': 'el', 'es-mx': 'es-MX',
};
