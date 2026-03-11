'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface Analytics {
  totalUsers: number;
  totalPredictions: number;
  totalPageviews: number;
  totalAffiliateRevenue: number;
  estimatedAdRevenue: number;
  totalKcSpent: number;
  pendingRedemptions: number;
  totalConversions: number;
}

export default function AdminAnalyticsPage() {
  const { locale } = useParams<{ locale: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}`); return; }
    fetch('/api/admin/analytics')
      .then((r) => { if (r.status === 403) throw new Error('Not admin'); return r.json(); })
      .then(setAnalytics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, locale, router]);

  if (authLoading || loading) return <div className="container-page text-center py-16 text-gray-400">Loading...</div>;
  if (error) return <div className="container-page text-center py-16 text-red-500">{error}</div>;

  const a = {
    totalUsers: analytics?.totalUsers ?? 0,
    totalPredictions: analytics?.totalPredictions ?? 0,
    totalPageviews: analytics?.totalPageviews ?? 0,
    totalAffiliateRevenue: analytics?.totalAffiliateRevenue ?? 0,
    estimatedAdRevenue: analytics?.estimatedAdRevenue ?? 0,
    totalKcSpent: analytics?.totalKcSpent ?? 0,
    pendingRedemptions: analytics?.pendingRedemptions ?? 0,
    totalConversions: analytics?.totalConversions ?? 0,
  };
  const totalRevenue = a.totalAffiliateRevenue + a.estimatedAdRevenue;

  return (
    <div className="container-page">
      <AdminLayout locale={locale}>
        <h1 className="text-2xl font-heading font-bold mb-6">Analytics</h1>

        {analytics && (
          <div className="space-y-8">
            {/* Revenue section */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Revenue</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4">
                  <p className="text-xs text-gray-500 mb-1">Affiliate Revenue</p>
                  <p className="text-2xl font-heading font-bold text-green-600">${a.totalAffiliateRevenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.totalConversions} conversions</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-gray-500 mb-1">Display Ad Revenue (est.)</p>
                  <p className="text-2xl font-heading font-bold text-blue-600">${a.estimatedAdRevenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.totalPageviews.toLocaleString()} pageviews @ $1.9 CPM</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Revenue (est.)</p>
                  <p className="text-2xl font-heading font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* KC Economy */}
            <div>
              <h2 className="text-lg font-semibold mb-3">KO Points Economy</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4">
                  <p className="text-xs text-gray-500 mb-1">Total KO Spent (Redemptions)</p>
                  <p className="text-2xl font-heading font-bold text-accent-gold">{a.totalKcSpent.toLocaleString()}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-gray-500 mb-1">Pending Redemptions</p>
                  <p className="text-2xl font-heading font-bold text-amber-600">{a.pendingRedemptions}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-gray-500 mb-1">Users / Predictions</p>
                  <p className="text-2xl font-heading font-bold">{a.totalUsers} / {a.totalPredictions}</p>
                </div>
              </div>
            </div>

            {/* Engagement funnel */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Engagement Funnel</h2>
              <div className="card p-4 space-y-3">
                {[
                  { label: 'Pageviews', value: a.totalPageviews, max: a.totalPageviews },
                  { label: 'Registered Users', value: a.totalUsers, max: a.totalPageviews },
                  { label: 'Predictions Made', value: a.totalPredictions, max: a.totalPageviews },
                  { label: 'Conversions (FTD)', value: a.totalConversions, max: a.totalPageviews },
                ].map((item) => {
                  const pct = item.max > 0 ? Math.min((item.value / item.max) * 100, 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(pct, 1)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </div>
  );
}
