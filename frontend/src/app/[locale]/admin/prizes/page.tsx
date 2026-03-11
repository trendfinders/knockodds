'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { Prize } from '@/lib/supabase/types';

const categories = ['betting_bonus', 'gift_card', 'merchandise', 'experience', 'special'] as const;

export default function AdminPrizesPage() {
  const { locale } = useParams<{ locale: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', image_url: '', category: 'betting_bonus', cost_kc: '', stock: '' });
  const [saving, setSaving] = useState(false);

  const fetchPrizes = () => {
    fetch('/api/admin/prizes')
      .then((r) => { if (r.status === 403) throw new Error('Not admin'); return r.json(); })
      .then((data) => setPrizes(data.prizes || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}`); return; }
    fetchPrizes();
  }, [user, authLoading, locale, router]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cost_kc: parseInt(form.cost_kc) || 100,
          stock: form.stock ? parseInt(form.stock) : null,
        }),
      });
      setShowForm(false);
      setForm({ name: '', description: '', image_url: '', category: 'betting_bonus', cost_kc: '', stock: '' });
      fetchPrizes();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (prize: Prize) => {
    if (prize.is_active) {
      await fetch(`/api/admin/prizes?id=${prize.id}`, { method: 'DELETE' });
    } else {
      await fetch('/api/admin/prizes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prize.id, is_active: true }),
      });
    }
    fetchPrizes();
  };

  if (authLoading) return <div className="container-page text-center py-16 text-gray-400">Loading...</div>;
  if (error) return <div className="container-page text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="container-page">
      <AdminLayout locale={locale}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-heading font-bold">Prize Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary-dark"
          >
            {showForm ? 'Cancel' : '+ New Prize'}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="card p-4 mb-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-surface-alt border border-gray-200 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="bg-surface-alt border border-gray-200 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none">
                {categories.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
              <input placeholder="Cost (KC)" type="number" value={form.cost_kc} onChange={(e) => setForm({ ...form, cost_kc: e.target.value })}
                className="bg-surface-alt border border-gray-200 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              <input placeholder="Stock (empty = unlimited)" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="bg-surface-alt border border-gray-200 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full bg-surface-alt border border-gray-200 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none" />
            <input placeholder="Image URL (optional)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="w-full bg-surface-alt border border-gray-200 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            <button onClick={handleCreate} disabled={saving || !form.name || !form.description}
              className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-sm disabled:opacity-50">
              {saving ? '...' : 'Create Prize'}
            </button>
          </div>
        )}

        {/* Prize list */}
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-3">
            {prizes.map((p) => (
              <div key={p.id} className={`card p-4 flex items-center justify-between gap-4 ${!p.is_active ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className="badge bg-gray-100 text-gray-600 text-xs">{p.category.replace('_', ' ')}</span>
                    {!p.is_active && <span className="badge bg-red-50 text-red-600 text-xs">Inactive</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{p.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-accent-gold text-sm">{p.cost_kc} KC</p>
                  <p className="text-xs text-gray-400">{p.stock !== null ? `${p.stock} in stock` : 'Unlimited'}</p>
                </div>
                <button
                  onClick={() => toggleActive(p)}
                  className={`text-xs px-3 py-1 rounded ${p.is_active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                >
                  {p.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminLayout>
    </div>
  );
}
