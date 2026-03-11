'use client';

import Image from 'next/image';
import { useState } from 'react';
import { KnockCoinsBalance } from './KnockCoinsBalance';
import type { UserStats, UserBadge } from '@/lib/supabase/types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.charAt(0) || '?').toUpperCase();
}

interface UserProfileCardProps {
  stats: UserStats;
  badges: UserBadge[];
  isOwnProfile?: boolean;
  strings: {
    predictions: string;
    wins: string;
    winRate: string;
    streak: string;
    points: string;
    memberSince: string;
    badges: string;
    noBadges: string;
  };
}

export function UserProfileCard({ stats, badges, isOwnProfile, strings }: UserProfileCardProps) {
  const [imgError, setImgError] = useState(false);

  const rankColors: Record<string, string> = {
    Rookie: 'bg-gray-100 text-gray-600',
    Amateur: 'bg-blue-50 text-blue-600',
    Contender: 'bg-green-50 text-green-600',
    Veteran: 'bg-purple-50 text-purple-600',
    Expert: 'bg-amber-50 text-amber-700',
    Master: 'bg-red-50 text-red-600',
    Champion: 'bg-yellow-50 text-yellow-700',
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-muted flex-shrink-0">
          {stats.user_avatar_url && !imgError ? (
            <Image
              src={stats.user_avatar_url}
              alt={stats.user_name}
              fill
              className="object-cover"
              sizes="80px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary font-bold text-2xl">
              {getInitials(stats.user_name)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-heading font-bold truncate">{stats.user_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge text-xs ${rankColors[stats.rank_title] || 'bg-gray-100 text-gray-600'}`}>
              {stats.rank_title}
            </span>
            {isOwnProfile && <KnockCoinsBalance balance={stats.ko_points} size="sm" />}
          </div>
          {stats.bio && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{stats.bio}</p>}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-heading font-bold">{stats.total_predictions}</p>
          <p className="text-xs text-gray-500">{strings.predictions}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-heading font-bold text-green-600">{stats.total_wins}</p>
          <p className="text-xs text-gray-500">{strings.wins}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-heading font-bold">{stats.win_rate}%</p>
          <p className="text-xs text-gray-500">{strings.winRate}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-heading font-bold text-primary">{stats.current_streak}</p>
          <p className="text-xs text-gray-500">{strings.streak}</p>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">{strings.badges}</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((ub) => (
              <span
                key={ub.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-surface-alt rounded-full text-xs"
                title={ub.badge?.description || ub.badge_id}
              >
                <span>{ub.badge?.icon}</span>
                <span className="font-medium">{ub.badge?.name || ub.badge_id}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {badges.length === 0 && (
        <p className="text-sm text-gray-400">{strings.noBadges}</p>
      )}
    </div>
  );
}
