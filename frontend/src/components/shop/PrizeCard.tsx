'use client';

import Image from 'next/image';
import { useState } from 'react';
import { KnockCoinsBalance } from '@/components/user/KnockCoinsBalance';
import type { Prize } from '@/lib/supabase/types';

interface PrizeCardProps {
  prize: Prize;
  userBalance: number;
  onRedeem: (prizeId: string) => void;
  strings: { redeem: string; outOfStock: string; insufficientCoins: string };
}

const categoryColors: Record<string, string> = {
  betting_bonus: 'bg-green-50 text-green-600',
  gift_card: 'bg-blue-50 text-blue-600',
  merchandise: 'bg-purple-50 text-purple-600',
  experience: 'bg-amber-50 text-amber-700',
  special: 'bg-red-50 text-red-600',
};

export function PrizeCard({ prize, userBalance, onRedeem, strings }: PrizeCardProps) {
  const [imgError, setImgError] = useState(false);
  const canAfford = userBalance >= prize.cost_kc;
  const inStock = prize.stock === null || prize.stock > 0;

  return (
    <div className="card overflow-hidden">
      {/* Image */}
      <div className="relative h-40 bg-surface-muted">
        {prize.image_url && !imgError ? (
          <Image
            src={prize.image_url}
            alt={prize.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 300px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {prize.category === 'betting_bonus' ? '🎰' :
             prize.category === 'gift_card' ? '🎁' :
             prize.category === 'merchandise' ? '👕' :
             prize.category === 'experience' ? '✈️' : '⭐'}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`badge text-xs ${categoryColors[prize.category] || 'bg-gray-100 text-gray-600'}`}>
            {prize.category.replace('_', ' ')}
          </span>
          {prize.stock !== null && (
            <span className="text-xs text-gray-400">
              {prize.stock} left
            </span>
          )}
        </div>

        <h3 className="font-semibold text-sm mb-1 line-clamp-1">{prize.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{prize.description}</p>

        <div className="flex items-center justify-between">
          <KnockCoinsBalance balance={prize.cost_kc} size="sm" />
          <button
            onClick={() => onRedeem(prize.id)}
            disabled={!canAfford || !inStock}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              !inStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
              !canAfford ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
              'bg-primary hover:bg-primary-dark text-white'
            }`}
            title={!inStock ? strings.outOfStock : !canAfford ? strings.insufficientCoins : ''}
          >
            {!inStock ? strings.outOfStock : strings.redeem}
          </button>
        </div>
      </div>
    </div>
  );
}
