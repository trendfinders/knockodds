import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAuth, getSupabaseAdmin } from '@/lib/services/admin-auth';
import { randomUUID } from 'crypto';

/**
 * POST /api/affiliate/click — generate click_id and log affiliate click
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { bookmaker_slug, landing_url } = body;

  if (!bookmaker_slug || !landing_url) {
    return NextResponse.json({ error: 'bookmaker_slug and landing_url required' }, { status: 400 });
  }

  // Get user if logged in (optional)
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();

  const clickId = randomUUID();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

  const admin = await getSupabaseAdmin();

  await admin.from('affiliate_clicks').insert({
    user_id: user?.id || null,
    click_id: clickId,
    bookmaker_slug,
    landing_url,
    country_code: null, // Could be resolved from IP via GeoIP service
    ip_address: ip,
  });

  // Build redirect URL with click_id
  const separator = landing_url.includes('?') ? '&' : '?';
  const redirectUrl = `${landing_url}${separator}click_id=${clickId}`;

  return NextResponse.json({ click_id: clickId, redirect_url: redirectUrl });
}
