'use client';

import { AffiliateTracker } from '../tracking/AffiliateTracker';
import { usePreferences } from '@/components/preferences/PreferencesProvider';

interface OddsValue {
  value: string;
  odd: string;
}

interface BookmakerOdds {
  id: number;
  name: string;
  homeAway?: OddsValue[];
  overUnder?: OddsValue[];
}

interface OddsTableStrings {
  noOddsAvailable: string;
  betNow: string;
  bookmaker: string;
  disclaimer: string;
  oddsDisclaimer: string;
}

interface OddsTableProps {
  fightTitle: string;
  fighter1Name: string;
  fighter2Name: string;
  bookmakers: BookmakerOdds[];
  affiliateConfigs?: Record<number, { url: string; id: string }>;
  strings: OddsTableStrings;
}

export function OddsTable({ fightTitle, fighter1Name, fighter2Name, bookmakers, affiliateConfigs = {}, strings }: OddsTableProps) {
  const { formatOdds } = usePreferences();

  if (bookmakers.length === 0) {
    return (
      <div className="card p-6 text-center text-gray-500">
        <p>{strings.noOddsAvailable}</p>
      </div>
    );
  }

  // Find best odds per fighter (using raw decimal for comparison)
  const f1Odds = bookmakers.map(bm => parseFloat(bm.homeAway?.find(v => v.value === 'Home')?.odd ?? '0')).filter(o => o > 0);
  const f2Odds = bookmakers.map(bm => parseFloat(bm.homeAway?.find(v => v.value === 'Away')?.odd ?? '0')).filter(o => o > 0);
  const bestF1 = f1Odds.length > 0 ? Math.max(...f1Odds) : 0;
  const bestF2 = f2Odds.length > 0 ? Math.max(...f2Odds) : 0;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-alt border-b border-gray-200">
              <th className="text-left p-2.5 sm:p-4 font-medium text-gray-400">{strings.bookmaker}</th>
              <th className="text-center p-2.5 sm:p-4 font-medium text-gray-400 max-w-[100px] truncate">{fighter1Name}</th>
              <th className="text-center p-2.5 sm:p-4 font-medium text-gray-400 max-w-[100px] truncate">{fighter2Name}</th>
              <th className="text-center p-2.5 sm:p-4 font-medium text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {bookmakers.map((bm) => {
              const config = affiliateConfigs[bm.id];
              const homeRaw = bm.homeAway?.find(v => v.value === 'Home')?.odd;
              const awayRaw = bm.homeAway?.find(v => v.value === 'Away')?.odd;
              const homeNum = homeRaw ? parseFloat(homeRaw) : 0;
              const awayNum = awayRaw ? parseFloat(awayRaw) : 0;
              const homeOdd = homeNum > 0 ? formatOdds(homeNum) : '-';
              const awayOdd = awayNum > 0 ? formatOdds(awayNum) : '-';
              const isHomeBest = homeNum > 0 && homeNum === bestF1;
              const isAwayBest = awayNum > 0 && awayNum === bestF2;

              return (
                <tr key={bm.id} className="border-b border-gray-100 hover:bg-surface-alt/50 transition-colors">
                  <td className="p-2.5 sm:p-4 font-medium text-xs sm:text-sm">{bm.name}</td>
                  <td className={`text-center p-2.5 sm:p-4 font-mono font-semibold text-xs sm:text-sm ${isHomeBest ? 'text-green-700' : 'text-gray-600'}`}>
                    {homeOdd}
                    {isHomeBest && <span className="ml-1 text-[10px] text-green-500">★</span>}
                  </td>
                  <td className={`text-center p-2.5 sm:p-4 font-mono font-semibold text-xs sm:text-sm ${isAwayBest ? 'text-green-700' : 'text-gray-600'}`}>
                    {awayOdd}
                    {isAwayBest && <span className="ml-1 text-[10px] text-green-500">★</span>}
                  </td>
                  <td className="text-center p-2.5 sm:p-4">
                    {config ? (
                      <AffiliateTracker
                        bookmakerName={bm.name}
                        bookmakerUrl={config.url}
                        affiliateId={config.id}
                        fightContext={fightTitle}
                        odds={homeRaw ?? '-'}
                        className="inline-block bg-primary hover:bg-primary-dark text-white text-xs font-semibold py-1.5 px-3 rounded transition-colors"
                      >
                        {strings.betNow}
                      </AffiliateTracker>
                    ) : (
                      <span className="text-xs text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="gambling-disclaimer mx-4 mb-4">
        <p>{strings.disclaimer}</p>
        <p>{strings.oddsDisclaimer}</p>
      </div>
    </div>
  );
}
