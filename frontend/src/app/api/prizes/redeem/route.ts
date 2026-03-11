import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAuth, getSupabaseAdmin } from '@/lib/services/admin-auth';
import { spendKoPoints } from '@/lib/services/ko-points';

/**
 * POST /api/prizes/redeem — redeem a prize with KO Points
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const { prize_id } = body;

  if (!prize_id) {
    return NextResponse.json({ error: 'prize_id required' }, { status: 400 });
  }

  const admin = await getSupabaseAdmin();

  // Fetch prize
  const { data: prize } = await admin
    .from('prizes')
    .select('*')
    .eq('id', prize_id)
    .eq('is_active', true)
    .single();

  if (!prize) {
    return NextResponse.json({ error: 'Prize not found or inactive' }, { status: 404 });
  }

  // Check stock
  if (prize.stock !== null && prize.stock <= 0) {
    return NextResponse.json({ error: 'Prize out of stock' }, { status: 409 });
  }

  // Spend KO Points
  const result = await spendKoPoints(
    user.id,
    prize.cost_kc,
    'prize_redemption',
    `Redeemed: ${prize.name}`,
    prize.id,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Create redemption
  const { data: redemption, error: redeemError } = await admin
    .from('prize_redemptions')
    .insert({
      user_id: user.id,
      prize_id: prize.id,
      cost_kc: prize.cost_kc,
      user_email: user.email || '',
    })
    .select()
    .single();

  if (redeemError) {
    // Refund KO Points on failure
    const { awardKoPoints } = await import('@/lib/services/ko-points');
    await awardKoPoints(user.id, prize.cost_kc, 'admin_adjustment', 'Refund: redemption failed');
    return NextResponse.json({ error: redeemError.message }, { status: 500 });
  }

  // Decrement stock if applicable
  if (prize.stock !== null) {
    await admin
      .from('prizes')
      .update({ stock: prize.stock - 1 })
      .eq('id', prize.id);
  }

  return NextResponse.json({ redemption, newBalance: result.newBalance }, { status: 201 });
}
