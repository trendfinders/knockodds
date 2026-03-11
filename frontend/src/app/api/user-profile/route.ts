import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAuth } from '@/lib/services/admin-auth';

/**
 * GET /api/user-profile?user_id=xxx — public profile data
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const supabase = await getSupabaseAuth();

  const [statsResult, badgesResult, predictionsResult] = await Promise.all([
    supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single(),
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

  if (!statsResult.data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    stats: statsResult.data,
    badges: badgesResult.data ?? [],
    recentPredictions: predictionsResult.data ?? [],
  });
}

/**
 * PUT /api/user-profile — update own bio
 */
export async function PUT(request: NextRequest) {
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.bio !== undefined) {
    const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 300) : null;
    updates.bio = bio || null;
  }

  if (body.user_name !== undefined) {
    const name = typeof body.user_name === 'string' ? body.user_name.trim().slice(0, 50) : null;
    if (name && name.length >= 2) {
      updates.user_name = name;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_stats')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stats: data });
}
