'use client';

import Image from 'next/image';
import { buildAffiliateUrl, getBookmakerBonus } from '@/lib/config/bookmakers';
import { usePreferences } from '@/components/preferences/PreferencesProvider';

interface BettingPromoWidgetProps {
  context?: string;
  title?: string;
  betNowLabel?: string;
  bonusTemplate?: string;
  compact?: boolean;
}

/**
 * Sitewide bookmaker promo widget for monetization.
 * Shows top bookmakers with logos, currency-aware bonuses, and affiliate CTAs.
 */
export function BettingPromoWidget({
  context,
  title = 'Top Bookmakers',
  betNowLabel = 'Bet Now',
  bonusTemplate = '{percentage}% up to {symbol}{amount}',
  compact = false,
}: BettingPromoWidgetProps) {
  const { prefs, getCurrencySymbol, countryCode, filteredBookmakers } = usePreferences();
  const bookmakers = compact ? filteredBookmakers.slice(0, 3) : filteredBookmakers.slice(0, 5);
  const currencySymbol = getCurrencySymbol();

  return (
    <div className="card p-4 md:p-5">
      <h3 className="section-title">{title}</h3>
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {bookmakers.map((bm) => {
          const bonusResult = getBookmakerBonus(bm.slug, prefs.currency);
          const bonusText = bonusResult
            ? bonusTemplate
                .replace('{percentage}', String(bonusResult.bonus.percentage))
                .replace('{symbol}', currencySymbol)
                .replace('{amount}', bonusResult.bonus.amount.toLocaleString())
            : null;

          return (
            <a
              key={bm.slug}
              href={buildAffiliateUrl(bm, context, countryCode)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface-alt hover:bg-surface-muted transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {bm.logo ? (
                  <Image src={bm.logo} alt={bm.name} width={80} height={20} style={{ height: 20 }} className="opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                ) : (
                  <span className="text-sm font-bold text-gray-600 flex-shrink-0">{bm.name}</span>
                )}
                {bonusText && !compact && (
                  <span className="text-[10px] text-primary font-medium truncate hidden md:inline">
                    {bonusText}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1.5 px-3 rounded transition-colors">
                  {betNowLabel}
                </span>
                {bonusText && compact && (
                  <span className="text-[9px] text-gray-400 text-right">{bonusText}</span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Inline single-bookmaker CTA for placing inside fight cards.
 */
export function InlineBetCTA({ context, label = 'Bet Now' }: { context?: string; label?: string }) {
  const { countryCode, filteredBookmakers } = usePreferences();
  const topBm = filteredBookmakers[0];
  if (!topBm) return null;

  return (
    <a
      href={buildAffiliateUrl(topBm, context, countryCode)}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2 px-4 rounded transition-colors"
    >
      {topBm.logo && (
        <Image src={topBm.logo} alt={topBm.name} width={50} height={14} style={{ height: 14 }} className="opacity-90" />
      )}
      {label}
    </a>
  );
}
