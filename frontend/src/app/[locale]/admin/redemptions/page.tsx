'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { PrizeRedemption } from '@/lib/supabase/types';

const statuses = ['pending', 'approved', 'shipped', 'completed', 'rejected'] as const;

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-600',
  shipped: 'bg-purple-50 text-purple-600',
  completed: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-600',
};

export default function AdminRedemptionsPage() {
  const { locale } = useParams<{ locale: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [redemptions, setRedemptions] = useState<PrizeRedemption[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRedemptions = (status = '') => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    fetch(`/api/admin/redemptions${qs}`)
      .then((r) => { if (r.status === 403) throw new Error('Not admin'); return r.json(); })
      .then((data) => setRedemptions(data.redemptions || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}`); return; }
    fetchRedemptions();
  }, [user, authLoading, locale, router]);

  const updateStatus = async (id: string, status: string) => {
    const notes = status === 'rejected' ? prompt('Rejection reason:') : undefined;
    await fetch('/api/admin/redemptions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, admin_notes: notes }),
    });
    fetchRedemptions(filter);
  };

  if (authLoading) return <div className="container-page text-center py-16 text-gray-400">Loading...</div>;
  if (error) return <div className="container-page text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="container-page">
      <AdminLayout locale={locale}>
        <h1 className="text-2xl font-heading font-bold mb-4">Redemption Queue</h1>

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => { setFilter(''); fetchRedemptions(); }}
            className={`px-3 py-1.5 text-sm rounded-lg ${!filter ? 'bg-primary text-white' : 'bg-surface-alt text-gray-600'}`}
          >
            All
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); fetchRedemptions(s); }}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize ${filter === s ? 'bg-primary text-white' : 'bg-surface-alt text-gray-600'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : redemptions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No redemptions found.</p>
        ) : (
          <div className="space-y-3">
            {redemptions.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{r.prize?.name || 'Prize'}</span>
                      <span className={`badge text-xs ${statusColors[r.status]}`}>{r.status}</span>
                    </div>
                    <p className="text-xs text-gray-500">User: {r.user_email || r.user_id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-400">Cost: {r.cost_kc} KC | {new Date(r.created_at).toLocaleDateString('it-IT')}</p>
                    {r.admin_notes && <p className="text-xs text-gray-500 mt-1 italic">Note: {r.admin_notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0 flex-wrap">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(r.id, 'approved')}
                          className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">Approve</button>
                        <button onClick={() => updateStatus(r.id, 'rejected')}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">Reject</button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button onClick={() => updateStatus(r.id, 'shipped')}
                        className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">Mark Shipped</button>
                    )}
                    {r.status === 'shipped' && (
                      <button onClick={() => updateStatus(r.id, 'completed')}
                        className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">Complete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminLayout>
    </div>
  );
}
