'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserProfileCard } from '@/components/user/UserProfileCard';
import { UserPredictionHistory } from '@/components/user/UserPredictionHistory';
import type { UserStats, UserBadge } from '@/lib/supabase/types';

interface UserProfileClientProps {
  userId: string;
  strings: {
    predictions: string;
    wins: string;
    winRate: string;
    streak: string;
    points: string;
    memberSince: string;
    badges: string;
    noBadges: string;
    noPredictions: string;
    pending: string;
    correct: string;
    incorrect: string;
    pointsEarned: string;
    filterAll: string;
    filterWon: string;
    filterLost: string;
    filterPending: string;
    recentPredictions: string;
    loading: string;
    notFound: string;
  };
}

export function UserProfileClient({ userId, strings }: UserProfileClientProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    fetch(`/api/user-profile?user_id=${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data) => {
        setStats(data.stats);
        setBadges(data.badges || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <div className="text-center py-16 text-gray-400">{strings.loading}</div>;
  }

  if (notFound || !stats) {
    return <div className="text-center py-16 text-gray-400">{strings.notFound}</div>;
  }

  return (
    <div className="space-y-6">
      <UserProfileCard
        stats={stats}
        badges={badges}
        isOwnProfile={isOwnProfile}
        strings={strings}
      />

      <div>
        <h2 className="text-lg font-heading font-bold mb-4">{strings.recentPredictions}</h2>
        <UserPredictionHistory
          userId={userId}
          strings={strings}
        />
      </div>
    </div>
  );
}
