'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { UserStats } from '@/lib/supabase/types';

interface LeaderboardWidgetProps {
  type?: 'alltime' | 'monthly';
  linkPrefix: string;
  strings: {
    topPredictors: string;
    allTime: string;
    thisMonth: string;
    points: string;
    winRate: string;
    viewLeaderboard: string;
    monthlyPrizes: string;
  };
}

const RANK_ICONS = ['👑', '🥈', '🥉'];

export function LeaderboardWidget({ type = 'alltime', linkPrefix, strings }: LeaderboardWidgetProps) {
  const [leaders, setLeaders] = useState<UserStats[]>([]);

  useEffect(() => {
    fetch(`/api/leaderboard?type=${type}&limit=5`)
      .then(r => r.json())
      .then(d => setLeaders(d.leaderboard || []))
      .catch(() => {});
  }, [type]);

  if (leaders.length === 0) return null;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-heading font-bold text-gray-400 uppercase tracking-wider mb-3">
        {strings.topPredictors}
      </h3>

      <div className="space-y-2">
        {leaders.map((u, i) => (
          <div key={u.user_id} className="flex items-center gap-2">
            <span className="w-5 text-center text-xs">
              {i < 3 ? RANK_ICONS[i] : <span className="text-gray-600">{i + 1}</span>}
            </span>
            <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
              {u.user_name[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm truncate flex-1">{u.user_name}</span>
            <div className="text-right flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {type === 'monthly' ? u.monthly_points : u.total_points}
              </span>
              <span className="text-[10px] text-gray-600 ml-1">{strings.points}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-primary/70 text-center mt-3 mb-2">{strings.monthlyPrizes}</p>

      <Link
        href={`${linkPrefix}/leaderboard`}
        className="block text-center text-xs text-primary hover:text-primary-dark py-2 rounded bg-red-50 hover:bg-red-100 transition-colors"
      >
        {strings.viewLeaderboard} &rarr;
      </Link>
    </div>
  );
}
