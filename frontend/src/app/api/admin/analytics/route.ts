import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth';

/**
 * GET /api/admin/analytics — dashboard metrics
 */
export async function GET() {
  try {
    const result = await requireAdmin();
    if (result instanceof NextResponse) return result;
    const { supabaseAdmin } = result;

    const [usersResult, predictionsResult, conversionsResult, redemptionsResult, pageviewsResult] = await Promise.all([
      supabaseAdmin.from('user_stats').select('*', { count: 'exact', head: true }).then(r => r, () => ({ count: 0, data: null })),
      supabaseAdmin.from('predictions').select('*', { count: 'exact', head: true }).then(r => r, () => ({ count: 0, data: null })),
      supabaseAdmin.from('affiliate_conversions').select('cpa_earned').then(r => r, () => ({ data: [] })),
      supabaseAdmin.from('prize_redemptions').select('cost_kc, status').then(r => r, () => ({ data: [] })),
      supabaseAdmin.from('pageviews').select('*', { count: 'exact', head: true }).then(r => r, () => ({ count: 0, data: null })),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversions = (conversionsResult.data || []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const redemptions = (redemptionsResult.data || []) as any[];

  const totalRevenue = conversions.reduce((sum: number, c: { cpa_earned: string | number }) => sum + (parseFloat(String(c.cpa_earned)) || 0), 0);
  const totalKcSpent = redemptions
    .filter((r: { status: string }) => r.status !== 'rejected')
    .reduce((sum: number, r: { cost_kc: number }) => sum + (r.cost_kc || 0), 0);
  const pendingRedemptions = redemptions.filter((r: { status: string }) => r.status === 'pending').length;

  // Estimated ad revenue from pageviews ($1.9 CPM)
  const totalPageviews = pageviewsResult.count || 0;
  const estimatedAdRevenue = (totalPageviews / 1000) * 1.9;

  return NextResponse.json({
    totalUsers: usersResult.count || 0,
    totalPredictions: predictionsResult.count || 0,
    totalPageviews,
    totalAffiliateRevenue: totalRevenue,
    estimatedAdRevenue: Math.round(estimatedAdRevenue * 100) / 100,
    totalKcSpent,
    pendingRedemptions,
    totalConversions: conversionsResult.data?.length || 0,
  });
  } catch (e) {
    console.error('Admin analytics error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
