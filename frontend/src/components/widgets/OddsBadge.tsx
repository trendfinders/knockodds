'use client';

import type { Odds } from '@/lib/types/mma-api';
import { usePreferences } from '@/components/preferences/PreferencesProvider';

interface OddsBadgeProps {
  odds: Odds | null;
  f1Name: string;
  f2Name: string;
}

/**
 * Compact inline odds badge showing best moneyline for a fight.
 * Respects user's preferred odds format (decimal/american/fractional/implied).
 */
export function OddsBadge({ odds, f1Name, f2Name }: OddsBadgeProps) {
  const { formatOdds, filteredBookmakers } = usePreferences();

  if (!odds) return null;

  const ml = extractBestMoneyline(odds, filteredBookmakers.map(b => b.apiId));
  if (!ml) return null;

  const f1Formatted = formatOdds(parseFloat(ml.f1));
  const f2Formatted = formatOdds(parseFloat(ml.f2));

  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="font-mono font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-l" title={f1Name}>
        {f1Formatted}
      </span>
      <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-r" title={f2Name}>
        {f2Formatted}
      </span>
    </div>
  );
}

/**
 * Wider odds display showing both fighter names and odds from best bookmaker.
 */
export function OddsDisplay({ odds, f1Name, f2Name }: OddsBadgeProps) {
  const { formatOdds, filteredBookmakers } = usePreferences();

  if (!odds) return null;

  const ml = extractBestMoneyline(odds, filteredBookmakers.map(b => b.apiId));
  if (!ml) return null;

  const f1Formatted = formatOdds(parseFloat(ml.f1));
  const f2Formatted = formatOdds(parseFloat(ml.f2));

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-center">
        <p className="text-[10px] text-gray-500 mb-0.5 truncate max-w-[80px]">{f1Name}</p>
        <span className="font-mono font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded text-xs">
          {f1Formatted}
        </span>
      </div>
      <span className="text-gray-600 text-[10px]">vs</span>
      <div className="text-center">
        <p className="text-[10px] text-gray-500 mb-0.5 truncate max-w-[80px]">{f2Name}</p>
        <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded text-xs">
          {f2Formatted}
        </span>
      </div>
    </div>
  );
}

function extractBestMoneyline(odds: Odds, topIds: number[]): { f1: string; f2: string; bmName: string } | null {
  for (const targetId of topIds) {
    const bm = odds.bookmakers.find(b => b.id === targetId);
    if (!bm) continue;
    const ml = findMoneyline(bm.bets);
    if (ml) return { ...ml, bmName: bm.name };
  }

  for (const bm of odds.bookmakers) {
    const ml = findMoneyline(bm.bets);
    if (ml) return { ...ml, bmName: bm.name };
  }

  return null;
}

function findMoneyline(bets: Odds['bookmakers'][0]['bets']): { f1: string; f2: string } | null {
  let bet = bets.find(b => {
    const n = b.name.toLowerCase();
    return n.includes('winner') || n.includes('match') || n.includes('moneyline') || n.includes('home/away') || n.includes('fight');
  });
  if (!bet) bet = bets.find(b => b.values.length >= 2);
  if (bet && bet.values.length >= 2) {
    return { f1: bet.values[0].odd, f2: bet.values[1].odd };
  }
  return null;
}
