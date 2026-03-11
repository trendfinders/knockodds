import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/services/admin-auth';

/**
 * GET /api/admin/redemptions — list all redemptions
 */
export async function GET(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { supabaseAdmin } = result;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  let query = supabaseAdmin
    .from('prize_redemptions')
    .select('*, prize:prizes(name, category)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ redemptions: data || [] });
}

/**
 * PUT /api/admin/redemptions — update redemption status
 */
export async function PUT(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { user: admin, supabaseAdmin } = result;

  const body = await request.json();
  const { id, status, admin_notes } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }

  if (!['pending', 'approved', 'shipped', 'completed', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // If rejecting, refund KO Points
  if (status === 'rejected') {
    const { data: redemption } = await supabaseAdmin
      .from('prize_redemptions')
      .select('user_id, cost_kc, status')
      .eq('id', id)
      .single();

    if (redemption && redemption.status !== 'rejected') {
      const { awardKoPoints } = await import('@/lib/services/ko-points');
      await awardKoPoints(redemption.user_id, redemption.cost_kc, 'admin_adjustment', 'Refund: prize redemption rejected', id, supabaseAdmin);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('prize_redemptions')
    .update({ status, admin_notes: admin_notes || null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(supabaseAdmin, admin.id, 'update_redemption', 'redemption', id, { status, admin_notes });
  return NextResponse.json({ redemption: data });
}
