import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth';

/**
 * GET /api/admin/logs — admin action logs
 */
export async function GET(request: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;
  const { supabaseAdmin } = result;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  const { data, error } = await supabaseAdmin
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data || [] });
}
