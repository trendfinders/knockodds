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
 * GET /api/leaderboard?type=alltime&limit=50
 * GET /api/leaderboard?type=monthly&limit=50
 * GET /api/leaderboard?type=history&month=2025-03
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'alltime';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const supabase = await getSupabase();

  if (type === 'history') {
    const month = searchParams.get('month');
    if (!month) {
      return NextResponse.json({ error: 'month required for history type' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('monthly_leaderboard')
      .select('*')
      .eq('month', month)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leaderboard: data || [], type: 'history', month });
  }

  // alltime or monthly — query user_stats
  const orderBy = type === 'monthly' ? 'monthly_points' : 'total_points';

  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .gt(orderBy, 0)
    .order(orderBy, { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leaderboard: data || [], type });
}
