import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { awardKoPoints, KO_RATES } from '@/lib/services/ko-points';

// Rate limits
const LIMITS = { perMinute: 2, perHour: 10, perDay: 50 };

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

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET /api/predictions?fight_id=123
 * GET /api/predictions?user_id=xxx
 * GET /api/predictions?fight_id=123&user_id=xxx
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fightId = searchParams.get('fight_id');
  const userId = searchParams.get('user_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const supabase = await getSupabase();

  let query = supabase.from('predictions').select('*');

  if (fightId) query = query.eq('fight_id', parseInt(fightId));
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ predictions: data || [] });
}

/**
 * POST /api/predictions
 * Body: { fight_id, fight_slug, event_slug, event_date, fighter1_name, fighter2_name, pick, method, round?, confidence, reasoning? }
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const { fight_id, fight_slug, event_slug, event_date, fighter1_name, fighter2_name, pick, method, round, confidence, reasoning } = body;

  if (!fight_id || !fight_slug || !event_slug || !event_date || !fighter1_name || !fighter2_name || !pick || !method) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['KO', 'SUB', 'DEC'].includes(method)) {
    return NextResponse.json({ error: 'method must be KO, SUB, or DEC' }, { status: 400 });
  }

  // Validate pick matches one of the fighters
  if (pick !== fighter1_name && pick !== fighter2_name) {
    return NextResponse.json({ error: 'pick must match one of the fighter names' }, { status: 400 });
  }

  // Validate fight hasn't started (event_date must be today or future)
  const eventDateObj = new Date(event_date + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (eventDateObj < today) {
    return NextResponse.json({ error: 'Cannot predict a past fight' }, { status: 400 });
  }

  if (reasoning && reasoning.length > 500) {
    return NextResponse.json({ error: 'Reasoning too long (max 500 chars)' }, { status: 400 });
  }

  // Rate limiting: check predictions created in last minute, hour, and day
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const serviceClient = getServiceSupabase();
  const [minResult, hourResult, dayResult] = await Promise.all([
    serviceClient.from('predictions').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', oneMinuteAgo),
    serviceClient.from('predictions').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', oneHourAgo),
    serviceClient.from('predictions').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', startOfDay.toISOString()),
  ]);

  if ((minResult.count ?? 0) >= LIMITS.perMinute) {
    return NextResponse.json({ error: 'Too many predictions. Wait a minute before trying again.' }, { status: 429 });
  }
  if ((hourResult.count ?? 0) >= LIMITS.perHour) {
    return NextResponse.json({ error: 'Hourly prediction limit reached (10/hour). Try again later.' }, { status: 429 });
  }
  if ((dayResult.count ?? 0) >= LIMITS.perDay) {
    return NextResponse.json({ error: 'Daily prediction limit reached (50/day). Come back tomorrow!' }, { status: 429 });
  }

  const conf = Math.max(1, Math.min(5, parseInt(confidence) || 3));
  const roundVal = round ? Math.max(1, Math.min(5, parseInt(round))) : null;

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.user_metadata?.avatar_url || null;

  const { data, error } = await supabase
    .from('predictions')
    .insert({
      user_id: user.id,
      user_name: displayName,
      user_avatar_url: avatarUrl,
      fight_id: parseInt(fight_id),
      fight_slug,
      event_slug,
      event_date,
      fighter1_name,
      fighter2_name,
      pick,
      method,
      round: roundVal,
      confidence: conf,
      reasoning: reasoning?.trim() || null,
      status: 'published',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You already have a prediction for this fight' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Award KO Points for making a prediction
  await awardKoPoints(user.id, KO_RATES.PREDICTION, 'prediction', 'Prediction submitted', data.id);

  // Increment total_predictions in user_stats
  const { data: stats } = await serviceClient
    .from('user_stats')
    .select('total_predictions')
    .eq('user_id', user.id)
    .single();

  if (stats) {
    await serviceClient.from('user_stats').update({
      total_predictions: (stats.total_predictions || 0) + 1,
    }).eq('user_id', user.id);
  }

  return NextResponse.json({ prediction: data, koAwarded: KO_RATES.PREDICTION }, { status: 201 });
}

/**
 * PUT /api/predictions
 * Body: { id, pick, method, round?, confidence, reasoning? }
 */
export async function PUT(request: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const { id, pick, method, round, confidence, reasoning } = body;

  if (!id) {
    return NextResponse.json({ error: 'Prediction id required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (pick) updates.pick = pick;
  if (method && ['KO', 'SUB', 'DEC'].includes(method)) updates.method = method;
  if (round !== undefined) updates.round = round ? Math.max(1, Math.min(5, parseInt(round))) : null;
  if (confidence) updates.confidence = Math.max(1, Math.min(5, parseInt(confidence)));
  if (reasoning !== undefined) updates.reasoning = reasoning?.trim() || null;

  const { data, error } = await supabase
    .from('predictions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .in('status', ['pending', 'published'])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prediction: data });
}

/**
 * DELETE /api/predictions?id=<prediction_id>
 */
export async function DELETE(request: NextRequest) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Prediction id required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('predictions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .in('status', ['pending', 'published']);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
