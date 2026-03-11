'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { PredictionForm } from './PredictionForm';
import { PredictionCard } from './PredictionCard';
import type { Prediction } from '@/lib/supabase/types';

interface FighterInfo {
  name: string;
  logo: string;
}

interface FightPredictionsListProps {
  fightId: number;
  fightSlug: string;
  eventSlug: string;
  eventDate: string;
  fighter1: FighterInfo;
  fighter2: FighterInfo;
  isFightUpcoming: boolean;
  strings: {
    communityPredictions: string;
    noPredictions: string;
    percentPick: string;
    correct: string;
    incorrect: string;
    pending: string;
    pointsEarned: string;
    delete: string;
    makePrediction: string;
    pickWinner: string;
    selectMethod: string;
    selectRound: string;
    anyRound: string;
    confidence: string;
    reasoning: string;
    submitPrediction: string;
    updatePrediction: string;
    signInToPredict: string;
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    displayName: string;
    signInWithGoogle: string;
    or: string;
    noAccount: string;
    hasAccount: string;
    close: string;
  };
}

export function FightPredictionsList({
  fightId, fightSlug, eventSlug, eventDate,
  fighter1, fighter2, isFightUpcoming, strings,
}: FightPredictionsListProps) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [myPrediction, setMyPrediction] = useState<Prediction | null>(null);

  const fetchPredictions = useCallback(async () => {
    try {
      const res = await fetch(`/api/predictions?fight_id=${fightId}`);
      const data = await res.json();
      if (data.predictions) {
        setPredictions(data.predictions);
        if (user) {
          const mine = data.predictions.find((p: Prediction) => p.user_id === user.id);
          setMyPrediction(mine || null);
        }
      }
    } catch {}
  }, [fightId, user]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/predictions?id=${id}`, { method: 'DELETE' });
      await fetchPredictions();
    } catch {}
  };

  // Community consensus
  const total = predictions.length;
  const f1Count = predictions.filter(p => p.pick === fighter1.name).length;
  const f2Count = total - f1Count;
  const f1Pct = total > 0 ? Math.round((f1Count / total) * 100) : 0;
  const f2Pct = total > 0 ? 100 - f1Pct : 0;

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-heading font-bold mb-6">{strings.communityPredictions}</h2>

      {/* Prediction form */}
      {isFightUpcoming && !myPrediction && (
        <PredictionForm
          fightId={fightId}
          fightSlug={fightSlug}
          eventSlug={eventSlug}
          eventDate={eventDate}
          fighter1={fighter1}
          fighter2={fighter2}
          onSubmitted={fetchPredictions}
          strings={strings}
        />
      )}

      {/* Edit existing prediction */}
      {isFightUpcoming && myPrediction && myPrediction.status === 'pending' && (
        <PredictionForm
          fightId={fightId}
          fightSlug={fightSlug}
          eventSlug={eventSlug}
          eventDate={eventDate}
          fighter1={fighter1}
          fighter2={fighter2}
          existingPrediction={myPrediction}
          onSubmitted={fetchPredictions}
          strings={strings}
        />
      )}

      {/* Consensus bar */}
      {total > 0 && (
        <div className="card p-4 mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>{strings.percentPick.replace('{percent}', String(f1Pct)).replace('{fighter}', fighter1.name)}</span>
            <span>{strings.percentPick.replace('{percent}', String(f2Pct)).replace('{fighter}', fighter2.name)}</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-surface-muted">
            <div
              className="bg-primary transition-all"
              style={{ width: `${f1Pct}%` }}
            />
            <div
              className="bg-blue-500 transition-all"
              style={{ width: `${f2Pct}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            {total} {total === 1 ? 'prediction' : 'predictions'}
          </p>
        </div>
      )}

      {/* Predictions list */}
      {predictions.length > 0 ? (
        <div className="space-y-3">
          {predictions.map((pred) => (
            <PredictionCard
              key={pred.id}
              prediction={pred}
              currentUserId={user?.id}
              onDelete={pred.status === 'pending' ? handleDelete : undefined}
              strings={strings}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">{strings.noPredictions}</p>
      )}
    </section>
  );
}
