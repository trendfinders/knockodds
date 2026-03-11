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

export default function AdminOverviewPage() {
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
      .then((r) => {
        if (r.status === 403) throw new Error('Not admin');
        return r.json();
      })
      .then(setAnalytics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, locale, router]);

  if (authLoading || loading) return <div className="container-page text-center py-16 text-gray-400">Loading...</div>;
  if (error) return <div className="container-page text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="container-page">
      <AdminLayout locale={locale}>
        <h1 className="text-2xl font-heading font-bold mb-6">Admin Dashboard</h1>

        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={analytics.totalUsers ?? 0} />
            <StatCard label="Total Predictions" value={analytics.totalPredictions ?? 0} />
            <StatCard label="Total Pageviews" value={(analytics.totalPageviews ?? 0).toLocaleString()} />
            <StatCard label="Pending Redemptions" value={analytics.pendingRedemptions ?? 0} highlight />
            <StatCard label="Affiliate Revenue" value={`$${(analytics.totalAffiliateRevenue ?? 0).toFixed(2)}`} />
            <StatCard label="Est. Ad Revenue" value={`$${(analytics.estimatedAdRevenue ?? 0).toFixed(2)}`} />
            <StatCard label="Total Conversions" value={analytics.totalConversions ?? 0} />
            <StatCard label="KO Spent" value={(analytics.totalKcSpent ?? 0).toLocaleString()} />
          </div>
        )}
      </AdminLayout>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? 'border-amber-300 border-2' : ''}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-heading font-bold">{value}</p>
    </div>
  );
}
