'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { KnockCoinsBalance } from '@/components/user/KnockCoinsBalance';
import { PrizeCard } from '@/components/shop/PrizeCard';
import { RedeemModal } from '@/components/shop/RedeemModal';
import type { Prize } from '@/lib/supabase/types';

type Category = 'all' | 'betting_bonus' | 'gift_card' | 'merchandise' | 'experience' | 'special';

interface ShopClientProps {
  locale: string;
  strings: Record<string, string>;
}

export function ShopClient({ locale, strings }: ShopClientProps) {
  const { user } = useAuth();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [balance, setBalance] = useState(0);
  const [category, setCategory] = useState<Category>('all');
  const [loading, setLoading] = useState(true);
  const [redeemPrize, setRedeemPrize] = useState<Prize | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/prizes').then((r) => r.json()),
      user ? fetch('/api/ko-points').then((r) => r.json()) : Promise.resolve({ balance: 0 }),
    ]).then(([prizesData, kcData]) => {
      setPrizes(prizesData.prizes || []);
      setBalance(kcData.balance || 0);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleRedeem = async () => {
    if (!redeemPrize || redeeming) return;
    setRedeeming(true);

    try {
      const res = await fetch('/api/prizes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prize_id: redeemPrize.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setBalance(data.newBalance);
        // Update stock locally
        setPrizes((prev) => prev.map((p) =>
          p.id === redeemPrize.id && p.stock !== null
            ? { ...p, stock: p.stock - 1 }
            : p
        ));
        setRedeemPrize(null);
      }
    } finally {
      setRedeeming(false);
    }
  };

  const categories: { key: Category; label: string }[] = [
    { key: 'all', label: strings.all },
    { key: 'betting_bonus', label: strings.bettingBonus },
    { key: 'gift_card', label: strings.giftCard },
    { key: 'merchandise', label: strings.merchandise },
    { key: 'experience', label: strings.experience },
    { key: 'special', label: strings.special },
  ];

  const filtered = category === 'all' ? prizes : prizes.filter((p) => p.category === category);

  if (loading) {
    return <div className="text-center py-16 text-gray-400">{strings.loading}</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">{strings.title}</h1>
          <p className="text-gray-500 mt-1">{strings.description}</p>
        </div>
        {user && (
          <div className="card px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">{strings.yourBalance}</p>
            <KnockCoinsBalance balance={balance} size="lg" />
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              category === c.key ? 'bg-primary text-white' : 'bg-surface-alt text-gray-600 hover:bg-surface-muted'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Prize grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-16">{strings.noPrizes}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((prize) => (
            <PrizeCard
              key={prize.id}
              prize={prize}
              userBalance={balance}
              onRedeem={() => setRedeemPrize(prize)}
              strings={{ redeem: strings.redeem, outOfStock: strings.outOfStock, insufficientCoins: strings.insufficientCoins }}
            />
          ))}
        </div>
      )}

      {/* Redeem modal */}
      {redeemPrize && (
        <RedeemModal
          prize={redeemPrize}
          userBalance={balance}
          loading={redeeming}
          onConfirm={handleRedeem}
          onCancel={() => setRedeemPrize(null)}
          strings={{ confirmRedeem: strings.confirmRedeem, cancel: strings.cancel, balanceAfter: strings.balanceAfter, redeem: strings.redeem }}
        />
      )}
    </div>
  );
}
