'use client';

import type { UserBadge } from '@/lib/supabase/types';

interface BadgeDisplayProps {
  badges: UserBadge[];
  mode?: 'compact' | 'full';
  strings: {
    badges: string;
    noBadges?: string;
  };
}

export function BadgeDisplay({ badges, mode = 'compact', strings }: BadgeDisplayProps) {
  if (badges.length === 0 && mode === 'full') {
    return (
      <p className="text-gray-400 text-sm">{strings.noBadges || 'No badges yet'}</p>
    );
  }

  if (mode === 'compact') {
    return (
      <div className="flex flex-wrap gap-1">
        {badges.map((ub) => (
          <span
            key={ub.id}
            className="text-base cursor-default"
            title={`${ub.badge?.name || ub.badge_id}: ${ub.badge?.description || ''}`}
          >
            {ub.badge?.icon || '🏅'}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-heading font-bold text-gray-400 uppercase tracking-wider mb-3">
        {strings.badges}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {badges.map((ub) => (
          <div key={ub.id} className="card p-3 text-center">
            <span className="text-2xl block mb-1">{ub.badge?.icon || '🏅'}</span>
            <p className="text-xs font-bold">{ub.badge?.name || ub.badge_id}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{ub.badge?.description || ''}</p>
            <p className="text-[10px] text-gray-600 mt-1">
              {new Date(ub.earned_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
