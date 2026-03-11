'use client';

import { usePreferences } from '@/components/preferences/PreferencesProvider';
import { getBookmakerBonus } from '@/lib/config/bookmakers';

interface BookmakerBonusBadgeProps {
  slug: string;
  template: string;        // "{percentage}% up to {symbol}{amount}"
  noOfferText?: string;    // Fallback text when no bonus available
}

/**
 * Displays a bookmaker welcome bonus in the user's preferred currency.
 */
export function BookmakerBonusBadge({ slug, template, noOfferText = '-' }: BookmakerBonusBadgeProps) {
  const { prefs, getCurrencySymbol } = usePreferences();
  const result = getBookmakerBonus(slug, prefs.currency);
  const symbol = getCurrencySymbol();

  if (!result) return <span className="text-gray-500 text-sm">{noOfferText}</span>;

  const text = template
    .replace('{percentage}', String(result.bonus.percentage))
    .replace('{symbol}', symbol)
    .replace('{amount}', result.bonus.amount.toLocaleString());

  return <span className="text-primary font-semibold">{text}</span>;
}

/**
 * Full bonus card with details (for bookmaker review pages).
 */
export function BookmakerBonusCard({ slug, template, wageringTemplate, termsText }: {
  slug: string;
  template: string;
  wageringTemplate: string;  // "Wagering: {wagering} min. odds {minOdds}"
  termsText: string;
}) {
  const { prefs, getCurrencySymbol } = usePreferences();
  const result = getBookmakerBonus(slug, prefs.currency);
  const symbol = getCurrencySymbol();

  if (!result) return null;

  const { bonus } = result;
  const bonusText = template
    .replace('{percentage}', String(bonus.percentage))
    .replace('{symbol}', symbol)
    .replace('{amount}', bonus.amount.toLocaleString());

  const wageringText = wageringTemplate
    .replace('{wagering}', bonus.wagering)
    .replace('{minOdds}', bonus.minOdds ? bonus.minOdds.toFixed(2) : '-');

  return (
    <div className="bg-surface-alt rounded-lg p-4 border border-gray-100">
      <p className="text-primary font-semibold text-lg">{bonusText}</p>
      <p className="text-sm text-gray-500 mt-1">{wageringText}</p>
      <p className="text-xs text-gray-400 mt-1">{termsText}</p>
    </div>
  );
}
