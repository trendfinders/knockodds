import { NextResponse } from 'next/server';
import { getSupabaseAuth } from '@/lib/services/admin-auth';

/**
 * GET /api/prizes — list active prizes
 */
export async function GET() {
  const supabase = await getSupabaseAuth();

  const { data, error } = await supabase
    .from('prizes')
    .select('*')
    .eq('is_active', true)
    .order('cost_kc', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prizes: data || [] });
}
