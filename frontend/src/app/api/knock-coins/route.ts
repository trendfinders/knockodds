import { NextResponse } from 'next/server';
import { getSupabaseAuth } from '@/lib/services/admin-auth';

/**
 * GET /api/knock-coins — own KC balance + recent transactions
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
      .select('knock_coins, daily_login_at')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('knock_coin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    balance: statsResult.data?.knock_coins ?? 0,
    daily_login_at: statsResult.data?.daily_login_at ?? null,
    transactions: txResult.data ?? [],
  });
}
