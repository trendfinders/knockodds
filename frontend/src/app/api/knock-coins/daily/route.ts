import { NextResponse } from 'next/server';
import { getSupabaseAuth } from '@/lib/services/admin-auth';
import { claimDailyLogin } from '@/lib/services/knock-coins';

/**
 * POST /api/knock-coins/daily — claim daily login bonus
 */
export async function POST() {
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const result = await claimDailyLogin(user.id);

  if (result.alreadyClaimed) {
    return NextResponse.json({ error: 'Already claimed today', alreadyClaimed: true }, { status: 409 });
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    amount: result.amount,
    newBalance: result.newBalance,
  });
}
