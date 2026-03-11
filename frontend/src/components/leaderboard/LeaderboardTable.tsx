'use client';

import { useState, useEffect } from 'react';
import type { UserStats, MonthlyLeaderboardEntry } from '@/lib/supabase/types';

interface LeaderboardTableProps {
  strings: {
    allTime: string;
    thisMonth: string;
    lastMonth: string;
    rank: string;
    points: string;
    winRate: string;
    streak: string;
    predictions: string;
    wins: string;
    noPredictions: string;
  };
}

type Tab = 'alltime' | 'monthly' | 'lastmonth';

const RANK_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

export function LeaderboardTable({ strings }: LeaderboardTableProps) {
  const [tab, setTab] = useState<Tab>('alltime');
  const [data, setData] = useState<(UserStats | MonthlyLeaderboardEntry)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = '/api/leaderboard?limit=50';

    if (tab === 'alltime') url += '&type=alltime';
    else if (tab === 'monthly') url += '&type=monthly';
    else {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      url += `&type=history&month=${month}`;
    }

    fetch(url)
      .then(r => r.json())
      .then(d => setData(d.leaderboard || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'alltime', label: strings.allTime },
    { key: 'monthly', label: strings.thisMonth },
    { key: 'lastmonth', label: strings.lastMonth },
  ];

  const getPoints = (entry: UserStats | MonthlyLeaderboardEntry): number => {
    if (tab === 'monthly' && 'monthly_points' in entry) return entry.monthly_points;
    if ('points' in entry) return entry.points;
    if ('total_points' in entry) return entry.total_points;
    return 0;
  };

  const getWins = (entry: UserStats | MonthlyLeaderboardEntry): number => {
    if (tab === 'monthly' && 'monthly_wins' in entry) return entry.monthly_wins;
    if ('wins' in entry) return entry.wins;
    if ('total_wins' in entry) return entry.total_wins;
    return 0;
  };

  const getWinRate = (entry: UserStats | MonthlyLeaderboardEntry): number => {
    return entry.win_rate;
  };

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-surface-muted rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
              tab === t.key
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:text-dark'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse bg-surface-muted h-14" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p>{strings.noPredictions}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => {
            const name = 'user_name' in entry ? entry.user_name : '';
            const userId = 'user_id' in entry ? entry.user_id : '';
            const streak = 'current_streak' in entry ? (entry as UserStats).current_streak : 0;

            return (
              <div
                key={userId}
                className={`card p-4 flex items-center gap-3 ${
                  i < 3 ? 'border-primary/20' : ''
                }`}
              >
                <span className={`w-8 text-center text-sm font-bold ${i < 3 ? RANK_COLORS[i] : 'text-gray-600'}`}>
                  #{i + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                  {name[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{name}</p>
                  {tab === 'alltime' && 'rank_title' in entry && (
                    <p className="text-[10px] text-gray-500">{(entry as UserStats).rank_title}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-gray-500">{strings.wins}</p>
                    <p className="font-bold">{getWins(entry)}</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-gray-500">{strings.winRate}</p>
                    <p className="font-bold">{getWinRate(entry).toFixed(0)}%</p>
                  </div>
                  {tab !== 'lastmonth' && streak > 0 && (
                    <div className="text-center hidden md:block">
                      <p className="text-gray-500">{strings.streak}</p>
                      <p className="font-bold text-orange-500">{streak}</p>
                    </div>
                  )}
                  <div className="text-center min-w-[50px]">
                    <p className="text-gray-500">{strings.points}</p>
                    <p className="font-bold text-primary">{getPoints(entry)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
