'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { UserStats, UserBadge } from '@/lib/supabase/types';

interface UserStatsCardProps {
  strings: {
    yourPrediction: string;
    predictions: string;
    wins: string;
    winRate: string;
    currentStreak: string;
    points: string;
    rankTitle: string;
    badges: string;
  };
}

export function UserStatsCard({ strings }: UserStatsCardProps) {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/user-stats?user_id=${user.id}`)
      .then(r => r.json())
      .then(d => {
        setStats(d.stats || null);
        setBadges(d.badges || []);
      })
      .catch(() => {});
  }, [user]);

  if (authLoading || !user || !stats) return null;

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-primary text-sm font-bold">
          {stats.user_name[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="text-sm font-bold">{stats.user_name}</p>
          <p className="text-[10px] text-primary font-bold">{stats.rank_title}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-500">{strings.predictions}</p>
          <p className="text-sm font-bold">{stats.total_predictions}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{strings.wins}</p>
          <p className="text-sm font-bold text-green-600">{stats.total_wins}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{strings.winRate}</p>
          <p className="text-sm font-bold">{stats.win_rate.toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{strings.points}</p>
          <p className="text-sm font-bold text-primary">{stats.total_points}</p>
        </div>
      </div>

      {stats.current_streak > 0 && (
        <div className="mt-2 text-center">
          <span className="text-xs text-orange-500 font-bold">
            {stats.current_streak} {strings.currentStreak}
          </span>
        </div>
      )}

      {badges.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{strings.badges}</p>
          <div className="flex flex-wrap gap-1">
            {badges.slice(0, 8).map((ub) => (
              <span
                key={ub.id}
                className="text-base"
                title={ub.badge?.name || ub.badge_id}
              >
                {ub.badge?.icon || '🏅'}
              </span>
            ))}
            {badges.length > 8 && (
              <span className="text-[10px] text-gray-500 self-center">+{badges.length - 8}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
