import { NextResponse } from 'next/server';
import { getSupabaseAuth } from '@/lib/services/admin-auth';

/**
 * GET /api/prizes/my-redemptions — user's redemption history
 */
export async function GET() {
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('prize_redemptions')
    .select('*, prize:prizes(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ redemptions: data || [] });
}
