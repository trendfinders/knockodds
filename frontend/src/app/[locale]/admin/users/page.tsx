'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KnockCoinsBalance } from '@/components/user/KnockCoinsBalance';
import type { UserStats } from '@/lib/supabase/types';

export default function AdminUsersPage() {
  const { locale } = useParams<{ locale: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchUsers = (q = '') => {
    setLoading(true);
    fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=100`)
      .then((r) => {
        if (r.status === 403) throw new Error('Not admin');
        return r.json();
      })
      .then((data) => setUsers(data.users || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}`); return; }
    fetchUsers();
  }, [user, authLoading, locale, router]);

  const doAction = async (userId: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(userId);
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action, ...extra }),
      });
      fetchUsers(search);
    } finally {
      setActionLoading('');
    }
  };

  if (authLoading) return <div className="container-page text-center py-16 text-gray-400">Loading...</div>;
  if (error) return <div className="container-page text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="container-page">
      <AdminLayout locale={locale}>
        <h1 className="text-2xl font-heading font-bold mb-4">User Management</h1>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers(search)}
            className="w-full max-w-md bg-surface-alt border border-gray-200 rounded px-4 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 px-3 font-medium text-gray-500">User</th>
                  <th className="py-2 px-3 font-medium text-gray-500">Rank</th>
                  <th className="py-2 px-3 font-medium text-gray-500">Points</th>
                  <th className="py-2 px-3 font-medium text-gray-500">KO</th>
                  <th className="py-2 px-3 font-medium text-gray-500">Win%</th>
                  <th className="py-2 px-3 font-medium text-gray-500">Status</th>
                  <th className="py-2 px-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-b border-gray-100 hover:bg-surface-alt">
                    <td className="py-2 px-3">
                      <p className="font-medium truncate max-w-[150px]">{u.user_name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{u.user_id.slice(0, 8)}...</p>
                    </td>
                    <td className="py-2 px-3">{u.rank_title}</td>
                    <td className="py-2 px-3 font-bold">{u.total_points}</td>
                    <td className="py-2 px-3"><KnockCoinsBalance balance={u.ko_points} size="sm" /></td>
                    <td className="py-2 px-3">{u.win_rate}%</td>
                    <td className="py-2 px-3">
                      {u.is_banned && <span className="badge bg-red-50 text-red-600 text-xs">Banned</span>}
                      {u.is_admin && <span className="badge bg-purple-50 text-purple-600 text-xs ml-1">Admin</span>}
                      {!u.is_banned && !u.is_admin && <span className="text-xs text-gray-400">Active</span>}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1 flex-wrap">
                        {u.is_banned ? (
                          <button
                            onClick={() => doAction(u.user_id, 'unban')}
                            disabled={actionLoading === u.user_id}
                            className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => doAction(u.user_id, 'ban')}
                            disabled={actionLoading === u.user_id}
                            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            Ban
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const amt = prompt('KO Points amount (positive to add, negative to remove):');
                            if (amt) doAction(u.user_id, 'adjust_ko', { amount: parseInt(amt), reason: 'Admin adjustment' });
                          }}
                          disabled={actionLoading === u.user_id}
                          className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100"
                        >
                          Adjust KO
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminLayout>
    </div>
  );
}
