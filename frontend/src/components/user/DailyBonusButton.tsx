'use client';

import { useState } from 'react';

interface DailyBonusButtonProps {
  alreadyClaimed: boolean;
  strings: {
    claimDaily: string;
    claimed: string;
    earnedKO: string;
  };
  onClaimed?: (amount: number) => void;
}

export function DailyBonusButton({ alreadyClaimed, strings, onClaimed }: DailyBonusButtonProps) {
  const [claimed, setClaimed] = useState(alreadyClaimed);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClaim = async () => {
    if (claimed || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ko-points/daily', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setClaimed(true);
        setShowSuccess(true);
        onClaimed?.(data.amount);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  if (claimed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
        <span>&#10003;</span>
        <span>{strings.claimed}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClaim}
        disabled={loading}
        className="px-4 py-2 bg-accent-gold hover:bg-amber-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? '...' : strings.claimDaily}
      </button>
      {showSuccess && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-accent-gold text-sm font-bold animate-bounce">
          +10 KO!
        </span>
      )}
    </div>
  );
}
