import { NextResponse } from 'next/server';
import { getSupabaseAuth } from '@/lib/services/admin-auth';

/**
 * GET /api/ko-points — own KO Points balance + recent transactions
 */
export async function GET() {
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const [statsResult, txResult] = await Promise.all([
    supabase
      .from('user_stats')
      .select('ko_points, daily_login_at, referral_code, referral_count, total_revenue_usd')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('ko_point_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    balance: statsResult.data?.ko_points ?? 0,
    daily_login_at: statsResult.data?.daily_login_at ?? null,
    referral_code: statsResult.data?.referral_code ?? null,
    referral_count: statsResult.data?.referral_count ?? 0,
    total_revenue: statsResult.data?.total_revenue_usd ?? 0,
    transactions: txResult.data ?? [],
  });
}
