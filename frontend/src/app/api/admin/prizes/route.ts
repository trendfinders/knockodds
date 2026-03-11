import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/services/admin-auth';

/**
 * GET /api/admin/prizes — list all prizes (including inactive)
 */
export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { supabaseAdmin } = result;

  const { data, error } = await supabaseAdmin
    .from('prizes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prizes: data || [] });
}

/**
 * POST /api/admin/prizes — create a new prize
 */
export async function POST(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { user: admin, supabaseAdmin } = result;

  const body = await request.json();
  const { name, description, image_url, category, cost_kc, stock } = body;

  if (!name || !description || !category || !cost_kc) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('prizes')
    .insert({ name, description, image_url: image_url || null, category, cost_kc, stock: stock ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(supabaseAdmin, admin.id, 'create_prize', 'prize', data.id, { name, cost_kc });
  return NextResponse.json({ prize: data }, { status: 201 });
}

/**
 * PUT /api/admin/prizes — update a prize
 */
export async function PUT(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { user: admin, supabaseAdmin } = result;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('prizes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(supabaseAdmin, admin.id, 'update_prize', 'prize', id, updates);
  return NextResponse.json({ prize: data });
}

/**
 * DELETE /api/admin/prizes?id=xxx — deactivate a prize
 */
export async function DELETE(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { user: admin, supabaseAdmin } = result;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  await supabaseAdmin.from('prizes').update({ is_active: false }).eq('id', id);
  await logAdminAction(supabaseAdmin, admin.id, 'deactivate_prize', 'prize', id);

  return NextResponse.json({ ok: true });
}
