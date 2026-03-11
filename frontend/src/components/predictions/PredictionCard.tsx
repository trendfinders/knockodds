'use client';

import type { Prediction } from '@/lib/supabase/types';

interface PredictionCardProps {
  prediction: Prediction;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  strings: {
    correct: string;
    incorrect: string;
    pending: string;
    pointsEarned: string;
    delete: string;
  };
}

const METHOD_COLORS: Record<string, string> = {
  KO: 'bg-red-50 text-red-600',
  SUB: 'bg-blue-50 text-blue-600',
  DEC: 'bg-amber-50 text-amber-700',
};

export function PredictionCard({ prediction, currentUserId, onDelete, strings }: PredictionCardProps) {
  const p = prediction;
  const isUnsettled = p.status === 'pending' || p.status === 'published';
  const statusColor = p.status === 'won' ? 'text-green-600' : p.status === 'lost' ? 'text-red-600' : 'text-primary';
  const statusLabel = p.status === 'won' ? strings.correct : p.status === 'lost' ? strings.incorrect : 'Live';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-primary text-xs font-bold">
            {p.user_name[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-dark">{p.user_name}</span>
          <span className="text-xs text-gray-400">{formatDate(p.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${statusColor}`}>
            {statusLabel}
            {p.points_earned > 0 && (
              <span className="ml-1 text-green-600">
                {strings.pointsEarned.replace('{points}', String(p.points_earned))}
              </span>
            )}
          </span>
          {currentUserId === p.user_id && isUnsettled && onDelete && (
            <button
              onClick={() => onDelete(p.id)}
              className="text-xs text-gray-400 hover:text-red-600 transition-colors"
            >
              {strings.delete}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-bold text-dark">{p.pick}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${METHOD_COLORS[p.method] || 'bg-gray-100 text-gray-500'}`}>
          {p.method}
        </span>
        {p.round && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-surface-muted text-gray-500 font-bold">
            R{p.round}
          </span>
        )}
        <span className="text-xs text-yellow-500">
          {'★'.repeat(p.confidence)}{'☆'.repeat(5 - p.confidence)}
        </span>
      </div>

      {p.reasoning && (
        <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{p.reasoning}</p>
      )}
    </div>
  );
}
