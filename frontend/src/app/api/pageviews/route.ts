import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAuth } from '@/lib/services/admin-auth';

/**
 * POST /api/pageviews — log a pageview (called via sendBeacon)
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true }); // Silently ignore non-authed pageviews
  }

  let body: { page_path?: string; session_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const pagePath = body.page_path;
  const sessionId = body.session_id || 'unknown';

  if (!pagePath || typeof pagePath !== 'string') {
    return NextResponse.json({ error: 'page_path required' }, { status: 400 });
  }

  await supabase.from('pageviews').insert({
    user_id: user.id,
    session_id: sessionId,
    page_path: pagePath.slice(0, 500),
  });

  return NextResponse.json({ ok: true });
}
