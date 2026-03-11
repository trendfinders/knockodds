'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import {
  type UserPreferences,
  type OddsFormat,
  loadPreferences,
  savePreferences,
  getDefaultPreferences,
  convertOdds,
  currencies,
} from '@/i18n/preferences';
import { LOCALE_TO_COUNTRY, getBookmakersForCountry, type BookmakerConfig } from '@/lib/config/bookmakers';

interface PreferencesContextValue {
  prefs: UserPreferences;
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  formatOdds: (decimalOdds: number) => string;
  getCurrencySymbol: () => string;
  countryCode: string | undefined;
  filteredBookmakers: BookmakerConfig[];
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}

interface Props {
  children: ReactNode;
  locale: string;
}

export function PreferencesProvider({ children, locale }: Props) {
  const [prefs, setPrefs] = useState<UserPreferences>(() =>
    getDefaultPreferences(locale as Locale)
  );
  const [showPopup, setShowPopup] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [geoCountry, setGeoCountry] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    const stored = loadPreferences();
    if (stored) {
      setPrefs(stored);
      setShowPopup(false);
    } else {
      // First visit — show popup after short delay
      const timer = setTimeout(() => setShowPopup(true), 800);
      return () => clearTimeout(timer);
    }

    // Read geo-IP country from cookie set by middleware (Vercel x-vercel-ip-country)
    const match = document.cookie.match(/(?:^|;\s*)geo-country=([A-Z]{2})/);
    if (match) setGeoCountry(match[1]);
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updates, configured: true };
      savePreferences(next);
      return next;
    });
  }, []);

  const formatOdds = useCallback(
    (decimalOdds: number) => convertOdds(decimalOdds, prefs.oddsFormat),
    [prefs.oddsFormat]
  );

  const getCurrencySymbol = useCallback(() => {
    const found = currencies.find((c) => c.code === prefs.currency);
    return found?.symbol || prefs.currency;
  }, [prefs.currency]);

  // Derive country code: geo-IP (most accurate) > locale mapping (fallback)
  const countryCode = geoCountry || LOCALE_TO_COUNTRY[prefs.locale];
  const filteredBookmakers = getBookmakersForCountry(countryCode);

  // Don't show popup on SSR
  const actualShowPopup = mounted && showPopup;

  return (
    <PreferencesContext.Provider
      value={{ prefs, showPopup: actualShowPopup, setShowPopup, updatePreferences, formatOdds, getCurrencySymbol, countryCode, filteredBookmakers }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
