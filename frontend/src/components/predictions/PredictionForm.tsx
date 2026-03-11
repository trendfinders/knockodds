'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { FighterAvatar } from '@/components/common/FighterAvatar';

interface FighterInfo {
  name: string;
  logo: string;
}

interface PredictionFormProps {
  fightId: number;
  fightSlug: string;
  eventSlug: string;
  eventDate: string;
  fighter1: FighterInfo;
  fighter2: FighterInfo;
  existingPrediction?: {
    id: string;
    pick: string;
    method: string;
    round: number | null;
    confidence: number;
    reasoning: string | null;
  } | null;
  onSubmitted: () => void;
  strings: {
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

const METHODS = ['KO', 'SUB', 'DEC'] as const;
const ROUNDS = [1, 2, 3, 4, 5];

export function PredictionForm({
  fightId, fightSlug, eventSlug, eventDate, fighter1, fighter2,
  existingPrediction, onSubmitted, strings,
}: PredictionFormProps) {
  const { user, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const [pick, setPick] = useState(existingPrediction?.pick || '');
  const [method, setMethod] = useState<string>(existingPrediction?.method || '');
  const [round, setRound] = useState<number | null>(existingPrediction?.round ?? null);
  const [confidence, setConfidence] = useState(existingPrediction?.confidence || 3);
  const [reasoning, setReasoning] = useState(existingPrediction?.reasoning || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!existingPrediction;
  const canSubmit = pick && method && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;
    setLoading(true);
    setError('');

    try {
      const url = '/api/predictions';
      const reqMethod = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? { id: existingPrediction!.id, pick, method, round, confidence, reasoning: reasoning.trim() || null }
        : {
            fight_id: fightId,
            fight_slug: fightSlug,
            event_slug: eventSlug,
            event_date: eventDate,
            fighter1_name: fighter1.name,
            fighter2_name: fighter2.name,
            pick, method, round, confidence,
            reasoning: reasoning.trim() || null,
          };

      const res = await fetch(url, {
        method: reqMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit');
        setLoading(false);
        return;
      }

      onSubmitted();
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  if (authLoading) {
    return <div className="card p-6 mb-6 animate-pulse bg-surface-muted h-32" />;
  }

  if (!user) {
    return (
      <>
        <div className="card p-6 mb-6 text-center">
          <p className="text-gray-500 mb-3">{strings.signInToPredict}</p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2.5 px-6 rounded transition-colors"
          >
            {strings.signIn}
          </button>
        </div>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} strings={strings} />
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 md:p-6 mb-6">
      <h3 className="text-lg font-heading font-bold mb-4">{strings.makePrediction}</h3>

      {/* Fighter selection */}
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{strings.pickWinner}</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[fighter1, fighter2].map((f) => (
          <button
            key={f.name}
            type="button"
            onClick={() => setPick(f.name)}
            className={`p-3 rounded-lg border-2 transition-all text-center ${
              pick === f.name
                ? 'border-primary bg-red-50 text-dark'
                : 'border-gray-200 hover:border-gray-300 text-gray-500'
            }`}
          >
            <div className="mx-auto mb-2">
              <FighterAvatar logo={f.logo} name={f.name} size={48} />
            </div>
            <p className="text-sm font-bold truncate">{f.name}</p>
          </button>
        ))}
      </div>

      {/* Method selection */}
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{strings.selectMethod}</p>
      <div className="flex gap-2 mb-5">
        {METHODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`flex-1 py-2 rounded text-sm font-bold transition-all ${
              method === m
                ? m === 'KO' ? 'bg-red-50 text-red-600 border border-red-200'
                  : m === 'SUB' ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-surface-alt border border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Round selection */}
      <div className="mb-5">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{strings.selectRound}</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRound(null)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
              round === null
                ? 'bg-red-50 text-primary border border-red-200'
                : 'bg-surface-alt border border-gray-200 text-gray-400'
            }`}
          >
            {strings.anyRound}
          </button>
          {ROUNDS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRound(r)}
              className={`w-8 py-1 rounded text-xs font-bold transition-all ${
                round === r
                  ? 'bg-red-50 text-primary border border-red-200'
                  : 'bg-surface-alt border border-gray-200 text-gray-400'
              }`}
            >
              R{r}
            </button>
          ))}
        </div>
      </div>

      {/* Confidence */}
      <div className="mb-5">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{strings.confidence}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setConfidence(star)}
              className={`text-lg transition-all ${
                star <= confidence ? 'text-yellow-500' : 'text-gray-300'
              }`}
            >
              &#9733;
            </button>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      <textarea
        value={reasoning}
        onChange={(e) => setReasoning(e.target.value)}
        placeholder={strings.reasoning}
        rows={2}
        maxLength={500}
        className="w-full bg-surface-alt border border-gray-200 rounded px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none resize-none mb-1"
      />
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400">{reasoning.length}/500</span>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded transition-colors disabled:opacity-50"
      >
        {loading ? '...' : isEdit ? strings.updatePrediction : strings.submitPrediction}
      </button>
    </form>
  );
}
