import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}

/**
 * GET /api/user-stats?user_id=xxx
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const supabase = await getSupabase();

  // Fetch stats, badges, and recent predictions in parallel
  const [statsRes, badgesRes, predictionsRes] = await Promise.all([
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
    supabase
      .from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false }),
    supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (statsRes.error && statsRes.error.code !== 'PGRST116') {
    return NextResponse.json({ error: statsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    stats: statsRes.data || null,
    badges: badgesRes.data || [],
    recentPredictions: predictionsRes.data || [],
  });
}
