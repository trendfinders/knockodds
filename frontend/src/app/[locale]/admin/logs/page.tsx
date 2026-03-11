'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { AdminLog } from '@/lib/supabase/types';

export default function AdminLogsPage() {
  const { locale } = useParams<{ locale: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}`); return; }
    fetch('/api/admin/logs')
      .then((r) => { if (r.status === 403) throw new Error('Not admin'); return r.json(); })
      .then((data) => setLogs(data.logs || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, locale, router]);

  if (authLoading || loading) return <div className="container-page text-center py-16 text-gray-400">Loading...</div>;
  if (error) return <div className="container-page text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="container-page">
      <AdminLayout locale={locale}>
        <h1 className="text-2xl font-heading font-bold mb-4">Admin Logs</h1>

        {logs.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No admin actions logged yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="card px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{log.action}</span>
                    {log.target_type && (
                      <span className="badge bg-gray-100 text-gray-600 text-xs">
                        {log.target_type}: {log.target_id?.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {JSON.stringify(log.details)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(log.created_at).toLocaleString('it-IT')}
                </span>
              </div>
            ))}
          </div>
        )}
      </AdminLayout>
    </div>
  );
}
