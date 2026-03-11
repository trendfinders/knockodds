'use client';

import { useState, useEffect } from 'react';
import type { Prediction } from '@/lib/supabase/types';

interface UserPredictionHistoryProps {
  userId: string;
  strings: {
    predictions: string;
    noPredictions: string;
    pending: string;
    correct: string;
    incorrect: string;
    pointsEarned: string;
    filterAll: string;
    filterWon: string;
    filterLost: string;
    filterPending: string;
  };
}

export function UserPredictionHistory({ userId, strings }: UserPredictionHistoryProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [filter, setFilter] = useState<'all' | 'won' | 'lost' | 'active'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/predictions?user_id=${userId}&limit=100`)
      .then((r) => r.json())
      .then((data) => setPredictions(data.predictions || []))
      .finally(() => setLoading(false));
  }, [userId]);

  const filtered = filter === 'all'
    ? predictions
    : filter === 'active'
      ? predictions.filter((p) => p.status === 'pending' || p.status === 'published')
      : predictions.filter((p) => p.status === filter);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'won': return <span className="badge bg-green-50 text-green-600 text-xs">{strings.correct}</span>;
      case 'lost': return <span className="badge bg-red-50 text-red-600 text-xs">{strings.incorrect}</span>;
      case 'published': return <span className="badge bg-primary/10 text-primary text-xs">Live</span>;
      default: return <span className="badge bg-primary/10 text-primary text-xs">Live</span>;
    }
  };

  const methodBadge: Record<string, string> = {
    KO: 'bg-red-50 text-red-600',
    SUB: 'bg-blue-50 text-blue-600',
    DEC: 'bg-amber-50 text-amber-700',
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">{strings.predictions}...</div>;
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([['all', strings.filterAll], ['won', strings.filterWon], ['lost', strings.filterLost], ['active', strings.filterPending]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filter === key ? 'bg-primary text-white' : 'bg-surface-alt text-gray-600 hover:bg-surface-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{strings.noPredictions}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {p.fighter1_name} vs {p.fighter2_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{p.event_slug}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {statusBadge(p.status)}
                  {p.points_earned > 0 && (
                    <span className="text-xs font-bold text-accent-gold">+{p.points_earned}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-primary">{p.pick}</span>
                <span className={`badge text-xs ${methodBadge[p.method] || ''}`}>{p.method}</span>
                {p.round && <span className="text-xs text-gray-400">R{p.round}</span>}
                <span className="text-xs text-gray-300 ml-auto">
                  {new Date(p.created_at).toLocaleDateString('it-IT')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
