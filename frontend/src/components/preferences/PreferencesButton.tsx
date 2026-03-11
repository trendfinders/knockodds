'use client';

import { usePreferences } from './PreferencesProvider';
import { localeFlags, type Locale } from '@/i18n/config';
import { currencies } from '@/i18n/preferences';

export function PreferencesButton() {
  const { prefs, setShowPopup } = usePreferences();
  const flag = localeFlags[prefs.locale as Locale] || '';
  const currencySymbol = currencies.find((c) => c.code === prefs.currency)?.symbol || prefs.currency;

  return (
    <button
      onClick={() => setShowPopup(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-primary bg-surface-alt hover:bg-surface-muted border border-gray-200 rounded-lg transition-colors"
      title="Preferences"
    >
      <span>{flag}</span>
      <span className="hidden sm:inline">{currencySymbol}</span>
      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}
