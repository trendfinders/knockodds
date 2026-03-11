'use client';

import { KnockCoinsBalance } from '@/components/user/KnockCoinsBalance';
import type { Prize } from '@/lib/supabase/types';

interface RedeemModalProps {
  prize: Prize;
  userBalance: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  strings: { confirmRedeem: string; cancel: string; balanceAfter: string; redeem: string };
}

export function RedeemModal({ prize, userBalance, loading, onConfirm, onCancel, strings }: RedeemModalProps) {
  const balanceAfter = userBalance - prize.cost_kc;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-sm border border-gray-200">
        <h3 className="text-lg font-heading font-bold mb-4">{strings.confirmRedeem}</h3>

        <div className="mb-4">
          <p className="font-medium">{prize.name}</p>
          <p className="text-sm text-gray-500 mt-1">{prize.description}</p>
        </div>

        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Cost</span>
            <KnockCoinsBalance balance={prize.cost_kc} size="sm" />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{strings.balanceAfter}</span>
            <KnockCoinsBalance balance={balanceAfter} size="sm" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-surface-alt text-gray-600 font-medium rounded-lg hover:bg-surface-muted transition-colors"
          >
            {strings.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '...' : strings.redeem}
          </button>
        </div>
      </div>
    </div>
  );
}
