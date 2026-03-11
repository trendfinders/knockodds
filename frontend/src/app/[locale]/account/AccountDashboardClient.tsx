'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { KnockCoinsBalance } from '@/components/user/KnockCoinsBalance';
import { DailyBonusButton } from '@/components/user/DailyBonusButton';
import { UserPredictionHistory } from '@/components/user/UserPredictionHistory';
import type { UserStats, UserBadge, Badge, KoPointTransaction, PrizeRedemption } from '@/lib/supabase/types';

type Tab = 'overview' | 'predictions' | 'badges' | 'rewards' | 'settings';

interface AccountDashboardClientProps {
  locale: string;
  strings: Record<string, string>;
}

export function AccountDashboardClient({ locale, strings }: AccountDashboardClientProps) {
  const { user, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [transactions, setTransactions] = useState<KoPointTransaction[]>([]);
  const [redemptions, setRedemptions] = useState<PrizeRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    Promise.all([
      fetch(`/api/user-profile?user_id=${user.id}`).then((r) => r.json()),
      fetch('/api/ko-points').then((r) => r.json()),
      fetch('/api/prizes/my-redemptions').then((r) => r.ok ? r.json() : { redemptions: [] }),
    ]).then(([profileData, kcData, redeemData]) => {
      setStats(profileData.stats);
      setBadges(profileData.badges || []);
      setTransactions(kcData.transactions || []);
      setRedemptions(redeemData.redemptions || []);
      setBio(profileData.stats?.bio || '');
      setDisplayName(profileData.stats?.user_name || '');
    }).finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return <div className="text-center py-16 text-gray-400">{strings.loading}</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">{strings.signInRequired}</p>
        <button onClick={() => setShowAuth(true)} className="btn-primary px-6 py-2">
          Sign In
        </button>
        {showAuth && (
          <AuthModal
            isOpen={showAuth}
            onClose={() => setShowAuth(false)}
            strings={{ signIn: 'Sign In', signUp: 'Sign Up', email: 'Email', password: 'Password', displayName: 'Display Name', signInWithGoogle: 'Continue with Google', or: 'or', noAccount: "Don't have an account?", hasAccount: 'Already have an account?', close: 'Close' }}
          />
        )}
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: strings.overview },
    { key: 'predictions', label: strings.predictions },
    { key: 'badges', label: strings.badgesAll },
    { key: 'rewards', label: strings.rewards },
    { key: 'settings', label: strings.settings },
  ];

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, user_name: displayName }),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setSaveMsg('Saved!');
        setTimeout(() => setSaveMsg(''), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const dailyClaimed = stats?.daily_login_at === today;

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-6">{strings.dashboard}</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-primary text-white' : 'bg-surface-alt text-gray-600 hover:bg-surface-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-heading font-bold">{stats.total_points}</p>
              <p className="text-xs text-gray-500">{strings.totalPoints}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-heading font-bold">{stats.win_rate}%</p>
              <p className="text-xs text-gray-500">{strings.winRate}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-heading font-bold text-primary">{stats.current_streak}</p>
              <p className="text-xs text-gray-500">{strings.streak}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-sm font-bold">{stats.rank_title}</p>
              <p className="text-xs text-gray-500">{strings.rank}</p>
            </div>
          </div>

          {/* KC + Daily bonus */}
          <div className="card p-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">{strings.koPoints}</p>
              <KnockCoinsBalance balance={stats.ko_points} size="lg" />
            </div>
            <DailyBonusButton
              alreadyClaimed={dailyClaimed}
              strings={{ claimDaily: strings.claimDaily, claimed: strings.claimed, earnedKO: strings.earnedKO }}
              onClaimed={() => setStats((s) => s ? { ...s, ko_points: s.ko_points + 10, daily_login_at: today } : s)}
            />
          </div>

          {/* Recent transactions */}
          {transactions.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1">{tx.description || tx.type}</span>
                    <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} KO
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Predictions Tab */}
      {tab === 'predictions' && user && (
        <UserPredictionHistory
          userId={user.id}
          strings={{
            predictions: strings.predictions,
            noPredictions: strings.noPredictions,
            pending: strings.pending,
            correct: strings.correct,
            incorrect: strings.incorrect,
            pointsEarned: strings.pointsEarned,
            filterAll: strings.filterAll,
            filterWon: strings.filterWon,
            filterLost: strings.filterLost,
            filterPending: strings.filterPending,
          }}
        />
      )}

      {/* Badges Tab */}
      {tab === 'badges' && (
        <div>
          {badges.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{strings.noBadges}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((ub) => (
                <div key={ub.id} className="card p-4 text-center">
                  <p className="text-3xl mb-2">{ub.badge?.icon}</p>
                  <p className="text-sm font-bold">{ub.badge?.name || ub.badge_id}</p>
                  <p className="text-xs text-gray-500 mt-1">{ub.badge?.description}</p>
                  <p className="text-xs text-gray-300 mt-2">
                    {new Date(ub.earned_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {tab === 'rewards' && stats && (
        <div className="space-y-6">
          <div className="card p-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">{strings.koPoints}</p>
              <KnockCoinsBalance balance={stats.ko_points} size="lg" />
            </div>
            <Link
              href={`/${locale}/shop`}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-sm"
            >
              {strings.viewShop}
            </Link>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">{strings.redeemHistory}</h3>
            {redemptions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">{strings.noRedemptions}</p>
            ) : (
              <div className="space-y-3">
                {redemptions.map((r) => (
                  <div key={r.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{r.prize?.name || 'Prize'}</p>
                      <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('it-IT')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent-gold">-{r.cost_kc} KO</p>
                      <span className={`text-xs badge ${
                        r.status === 'completed' ? 'bg-green-50 text-green-600' :
                        r.status === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{strings.displayName}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full bg-surface-alt border border-gray-200 rounded px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{strings.bio}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full bg-surface-alt border border-gray-200 rounded px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none resize-none"
              placeholder="Tell the community about yourself..."
            />
            <p className="text-xs text-gray-400 text-right">{bio.length}/300</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '...' : strings.save}
            </button>
            {saveMsg && <span className="text-green-600 text-sm">{saveMsg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
