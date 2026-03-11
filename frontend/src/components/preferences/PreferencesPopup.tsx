'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePreferences } from './PreferencesProvider';
import { i18n, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { oddsFormats, currencies, type OddsFormat, defaultCurrencyByLocale, defaultOddsFormatByLocale } from '@/i18n/preferences';

export function PreferencesPopup() {
  const { prefs, showPopup, setShowPopup, updatePreferences } = usePreferences();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedLocale, setSelectedLocale] = useState<Locale>(prefs.locale);
  const [selectedOddsFormat, setSelectedOddsFormat] = useState<OddsFormat>(prefs.oddsFormat);
  const [selectedCurrency, setSelectedCurrency] = useState(prefs.currency);
  const [currencySearch, setCurrencySearch] = useState('');

  if (!showPopup) return null;

  // When locale changes, update default odds format and currency
  const handleLocaleChange = (locale: Locale) => {
    setSelectedLocale(locale);
    setSelectedOddsFormat(defaultOddsFormatByLocale[locale]);
    setSelectedCurrency(defaultCurrencyByLocale[locale]);
  };

  const handleSave = () => {
    updatePreferences({
      locale: selectedLocale,
      oddsFormat: selectedOddsFormat,
      currency: selectedCurrency,
    });
    setShowPopup(false);

    // Navigate to the selected locale if different from current
    if (selectedLocale !== prefs.locale) {
      // pathname from usePathname() always includes /[locale]/ segment (e.g. /en/predictions/...)
      // Strip the current locale segment to get the rest of the path
      const localePattern = new RegExp(`^/${prefs.locale}(/|$)`);
      const restOfPath = pathname.replace(localePattern, '/');
      router.push(`/${selectedLocale}${restOfPath === '/' ? '' : restOfPath}`);
    }
  };

  const handleDismiss = () => {
    // Save current defaults so popup doesn't show again
    updatePreferences({
      locale: prefs.locale,
      oddsFormat: prefs.oddsFormat,
      currency: prefs.currency,
    });
    setShowPopup(false);
  };

  const filteredCurrencies = currencySearch
    ? currencies.filter(
        (c) =>
          c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
          c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
          c.symbol.includes(currencySearch)
      )
    : currencies;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDismiss} />

      {/* Popup */}
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-transparent p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-heading font-bold text-dark">
                Knock<span className="text-primary">Odds</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Configure your experience</p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-400 hover:text-dark transition-colors rounded-lg hover:bg-surface-muted"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-semibold text-dark mb-3">
              Language / Idioma / Langue
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {i18n.locales.map((l) => (
                <button
                  key={l}
                  onClick={() => handleLocaleChange(l)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedLocale === l
                      ? 'bg-primary text-white ring-2 ring-primary/30'
                      : 'bg-surface-alt text-gray-600 hover:bg-surface-muted hover:text-dark border border-gray-200'
                  }`}
                >
                  <span className="text-lg">{localeFlags[l]}</span>
                  <span className="truncate">{localeNames[l]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Odds Format */}
          <div>
            <label className="block text-sm font-semibold text-dark mb-3">
              Odds Format / Formato Quote
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(oddsFormats) as [OddsFormat, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedOddsFormat(key)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    selectedOddsFormat === key
                      ? 'bg-primary text-white ring-2 ring-primary/30'
                      : 'bg-surface-alt text-gray-600 hover:bg-surface-muted hover:text-dark border border-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-semibold text-dark mb-3">
              Currency / Moneda / Valuta
            </label>
            <input
              type="text"
              placeholder="Search currency..."
              value={currencySearch}
              onChange={(e) => setCurrencySearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-alt border border-gray-200 rounded-lg text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-3"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {filteredCurrencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCurrency(c.code)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCurrency === c.code
                      ? 'bg-primary text-white ring-2 ring-primary/30'
                      : 'bg-surface-alt text-gray-600 hover:bg-surface-muted hover:text-dark border border-gray-200'
                  }`}
                >
                  <span className="font-bold text-base w-8">{c.symbol}</span>
                  <span className="truncate">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-medium bg-surface-alt text-gray-600 hover:text-dark border border-gray-200 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
