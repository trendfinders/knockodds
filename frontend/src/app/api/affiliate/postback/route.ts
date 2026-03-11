import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/services/admin-auth';
import { getTier } from '@/lib/services/ko-points';
import { createHmac } from 'crypto';

/**
 * GET /api/affiliate/postback?click_id=X&event=ftd&amount=Y&sig=Z
 * Called by bookmakers to report conversions
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clickId = searchParams.get('click_id');
  const event = searchParams.get('event');
  const amount = searchParams.get('amount');
  const sig = searchParams.get('sig');

  if (!clickId || !event) {
    return NextResponse.json({ error: 'click_id and event required' }, { status: 400 });
  }

  if (!['registration', 'ftd', 'deposit'].includes(event)) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
  }

  // Validate signature if secret is configured
  const secret = process.env.AFFILIATE_POSTBACK_SECRET;
  if (secret && sig) {
    const expected = createHmac('sha256', secret).update(`${clickId}:${event}`).digest('hex');
    if (sig !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
  }

  const admin = await getSupabaseAdmin();

  // Find the click
  const { data: click } = await admin
    .from('affiliate_clicks')
    .select('*')
    .eq('click_id', clickId)
    .single();

  if (!click) {
    return NextResponse.json({ error: 'Click not found' }, { status: 404 });
  }

  // Determine CPA tier
  const tierInfo = click.country_code ? getTier(click.country_code) : null;
  const amountUsd = amount ? parseFloat(amount) : null;
  const cpaEarned = tierInfo ? Math.min(amountUsd || tierInfo.maxCpa, tierInfo.maxCpa) : amountUsd;

  // Insert conversion (idempotent — UNIQUE(click_id, event_type))
  const { error } = await admin.from('affiliate_conversions').insert({
    click_id: clickId,
    user_id: click.user_id,
    bookmaker_slug: click.bookmaker_slug,
    event_type: event,
    amount_usd: amountUsd,
    cpa_earned: cpaEarned,
    tier: tierInfo?.tier || null,
    country_code: click.country_code,
    postback_raw: Object.fromEntries(searchParams.entries()),
  });

  if (error) {
    if (error.code === '23505') {
      // Duplicate — already processed
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Award KO Points for FTD if user is tracked
  if (event === 'ftd' && click.user_id) {
    const { awardKoPoints, KO_RATES } = await import('@/lib/services/ko-points');
    await awardKoPoints(click.user_id, KO_RATES.REFERRAL_FTD, 'ftd_bonus', `FTD conversion: ${click.bookmaker_slug}`, clickId);
  }

  return NextResponse.json({ ok: true });
}
