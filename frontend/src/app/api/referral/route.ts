import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAuth } from '@/lib/services/admin-auth';
import { getReferralStats, ensureReferralCode, processReferralSignup } from '@/lib/services/referral';

/**
 * GET /api/referral — get own referral stats + code
 */
export async function GET() {
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Ensure user has a referral code
  const code = await ensureReferralCode(user.id);
  const stats = await getReferralStats(user.id);

  return NextResponse.json({
    ...stats,
    referralCode: code,
    referralLink: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://knockodds.com'}?ref=${code}`,
  });
}

/**
 * POST /api/referral — apply a referral code (for new users)
 */
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json();
  const { referralCode } = body;

  if (!referralCode || typeof referralCode !== 'string') {
    return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
  }

  const result = await processReferralSignup(user.id, referralCode.trim());

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, referrerId: result.referrerId });
}
