import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/services/admin-auth';
import { awardKoPoints } from '@/lib/services/ko-points';

/**
 * GET /api/admin/users — list all users with stats
 */
export async function GET(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { supabaseAdmin } = result;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');
  const search = searchParams.get('search') || '';

  let query = supabaseAdmin
    .from('user_stats')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.ilike('user_name', `%${search}%`);
  }

  const { data, error, count } = await query
    .order('total_points', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data || [], total: count || 0 });
}

/**
 * PUT /api/admin/users — ban/unban, toggle admin, adjust KC
 */
export async function PUT(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { user: admin, supabaseAdmin } = result;

  const body = await request.json();
  const { user_id, action, amount, reason } = body;

  if (!user_id || !action) {
    return NextResponse.json({ error: 'user_id and action required' }, { status: 400 });
  }

  switch (action) {
    case 'ban': {
      await supabaseAdmin.from('user_stats').update({ is_banned: true }).eq('user_id', user_id);
      await logAdminAction(supabaseAdmin, admin.id, 'ban_user', 'user', user_id, { reason });
      break;
    }
    case 'unban': {
      await supabaseAdmin.from('user_stats').update({ is_banned: false }).eq('user_id', user_id);
      await logAdminAction(supabaseAdmin, admin.id, 'unban_user', 'user', user_id);
      break;
    }
    case 'make_admin': {
      await supabaseAdmin.from('user_stats').update({ is_admin: true }).eq('user_id', user_id);
      await logAdminAction(supabaseAdmin, admin.id, 'make_admin', 'user', user_id);
      break;
    }
    case 'remove_admin': {
      await supabaseAdmin.from('user_stats').update({ is_admin: false }).eq('user_id', user_id);
      await logAdminAction(supabaseAdmin, admin.id, 'remove_admin', 'user', user_id);
      break;
    }
    case 'adjust_ko': {
      const koAmount = parseInt(amount);
      if (!koAmount) return NextResponse.json({ error: 'amount required' }, { status: 400 });
      await awardKoPoints(user_id, koAmount, 'admin_adjustment', reason || 'Admin adjustment', undefined, supabaseAdmin);
      await logAdminAction(supabaseAdmin, admin.id, 'adjust_ko', 'user', user_id, { amount: koAmount, reason });
      break;
    }
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
