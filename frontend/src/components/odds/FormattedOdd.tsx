'use client';

import { usePreferences } from '@/components/preferences/PreferencesProvider';

interface FormattedOddProps {
  decimalOdd: string;
  className?: string;
}

/**
 * Client component that formats a decimal odd string according to user preferences.
 * Use this inside server-rendered pages to display odds in the user's chosen format.
 */
export function FormattedOdd({ decimalOdd, className }: FormattedOddProps) {
  const { formatOdds } = usePreferences();
  const num = parseFloat(decimalOdd);
  if (isNaN(num) || num <= 0) return <span className={className}>-</span>;
  return <span className={className}>{formatOdds(num)}</span>;
}

/**
 * Inline pair of formatted odds (fighter 1 vs fighter 2).
 */
export function FormattedOddPair({ f1, f2, bestF1, bestF2 }: {
  f1: string;
  f2: string;
  bestF1?: boolean;
  bestF2?: boolean;
}) {
  const { formatOdds } = usePreferences();
  const f1Num = parseFloat(f1);
  const f2Num = parseFloat(f2);

  return (
    <div className="flex gap-0.5 justify-center">
      <span className={`rounded-l px-2 py-1 font-mono text-xs font-bold ${
        bestF1 ? 'bg-green-50 text-green-700' : 'bg-surface-muted text-gray-600'
      }`}>
        {f1Num > 0 ? formatOdds(f1Num) : '-'}
      </span>
      <span className={`rounded-r px-2 py-1 font-mono text-xs font-bold ${
        bestF2 ? 'bg-blue-50 text-blue-700' : 'bg-surface-muted text-gray-600'
      }`}>
        {f2Num > 0 ? formatOdds(f2Num) : '-'}
      </span>
    </div>
  );
}
