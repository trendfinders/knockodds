import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// =============================================
// KO Points Economy - Revenue-Backed Point System
// =============================================
// 1 KO Point ≈ $0.001 in expected platform revenue
// Points are calibrated so that by the time a user
// accumulates enough for a prize, their actions (and
// referral chain) have generated 2x-5x the prize value.
// =============================================

export const KO_RATES = {
  // Engagement (ad-revenue backed, ~$5.70 RPM with 3 ads/page)
  DAILY_LOGIN:         10,    // $0.01 — user sees ~2 pages = $0.011 ad rev
  PREDICTION:          15,    // $0.015 — deep engagement, ~3 PVs = $0.017
  WIN_BONUS:           30,    // $0.03 — retention driver, ~5 PVs over time
  PERFECT_PREDICTION:  100,   // $0.10 — viral sharing potential
  STREAK_3:            20,    // $0.02 — retention signal
  STREAK_5:            40,    // $0.04 — strong retention
  STREAK_10:           80,    // $0.08 — power user
  COMMENT:             5,     // $0.005 — community engagement

  // Pageviews (direct ad-revenue backed)
  PER_1000_PAGEVIEWS:  50,    // $0.05 vs $5.70 actual RPM = 0.88% payout

  // Affiliate (CPA-backed)
  AFFILIATE_CLICK:     5,     // $0.005 — click incentive token
  REFERRAL_SIGNUP:     100,   // $0.10 — new user LTV potential
  REFERRAL_FTD:        500,   // $0.50 vs $30-200 actual CPA

  // Referral chain rates
  REFERRAL_L2_RATE:    0.10,  // 10% of referral's earned points
  REFERRAL_L3_RATE:    0.05,  // 5% of L2 referral's points
} as const;

// CPA tier configuration
export const CPA_TIERS = {
  tier1: {
    countries: ['IT', 'DE', 'FR', 'ES', 'GB', 'CA', 'AU', 'NZ', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT'],
    maxCpa: 200,
  },
  tier2: {
    countries: ['JP', 'KR', 'SG', 'HK', 'TW', 'IN', 'TH', 'MY', 'PH', 'ID'],
    maxCpa: 90,
  },
  tier3: {
    countries: ['BR', 'MX', 'AR', 'CO', 'CL', 'ZA', 'NG', 'KE', 'EG', 'GH'],
    maxCpa: 30,
  },
} as const;

export function getTier(countryCode: string): { tier: string; maxCpa: number } | null {
  const code = countryCode.toUpperCase();
  for (const [tier, config] of Object.entries(CPA_TIERS)) {
    if ((config.countries as readonly string[]).includes(code)) {
      return { tier, maxCpa: config.maxCpa };
    }
  }
  return null;
}

// Types that should NOT trigger referral distribution
const NON_DISTRIBUTABLE_TYPES = new Set([
  'referral_l2', 'referral_l3', 'prize_redemption', 'admin_adjustment',
]);

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Award KO Points to a user + distribute to referral chain (L2: 10%, L3: 5%)
 */
export async function awardKoPoints(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
  supabase?: SupabaseClient,
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const client = supabase || getServiceClient();

  // Read current balance
  const { data: current } = await client
    .from('user_stats')
    .select('ko_points')
    .eq('user_id', userId)
    .single();

  if (!current) return { success: false, error: 'User stats not found' };

  const newBalance = (current.ko_points || 0) + amount;

  // Update balance
  const { error: updateError } = await client
    .from('user_stats')
    .update({ ko_points: newBalance })
    .eq('user_id', userId);

  if (updateError) return { success: false, error: updateError.message };

  // Log transaction
  const { error: txError } = await client
    .from('ko_point_transactions')
    .insert({
      user_id: userId,
      amount,
      type,
      description,
      reference_id: referenceId || null,
    });

  if (txError) return { success: false, error: txError.message };

  // Distribute to referral chain (only for distributable types)
  if (amount > 0 && !NON_DISTRIBUTABLE_TYPES.has(type)) {
    await distributeReferralPoints(userId, amount, type, client);
  }

  return { success: true, newBalance };
}

/**
 * Spend KO Points (prize redemption, etc.)
 */
export async function spendKoPoints(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
  supabase?: SupabaseClient,
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const client = supabase || getServiceClient();

  const { data: stats } = await client
    .from('user_stats')
    .select('ko_points')
    .eq('user_id', userId)
    .single();

  if (!stats || stats.ko_points < amount) {
    return { success: false, error: 'Insufficient KO Points' };
  }

  const newBalance = stats.ko_points - amount;

  const { error: updateError } = await client
    .from('user_stats')
    .update({ ko_points: newBalance })
    .eq('user_id', userId);

  if (updateError) return { success: false, error: updateError.message };

  const { error: txError } = await client
    .from('ko_point_transactions')
    .insert({
      user_id: userId,
      amount: -amount,
      type,
      description,
      reference_id: referenceId || null,
    });

  if (txError) {
    // Rollback
    await client
      .from('user_stats')
      .update({ ko_points: stats.ko_points })
      .eq('user_id', userId);
    return { success: false, error: txError.message };
  }

  return { success: true, newBalance };
}

/**
 * Distribute referral chain points: L2 gets 10%, L3 gets 5%
 * NEVER triggers recursion (referral_l2/l3 types are excluded)
 */
async function distributeReferralPoints(
  userId: string,
  amount: number,
  sourceType: string,
  client: SupabaseClient,
): Promise<void> {
  const { data: referrers } = await client
    .from('referral_tree')
    .select('referrer_id, level')
    .eq('user_id', userId)
    .in('level', [1, 2]);

  if (!referrers || referrers.length === 0) return;

  for (const ref of referrers) {
    const rate = ref.level === 1 ? KO_RATES.REFERRAL_L2_RATE : KO_RATES.REFERRAL_L3_RATE;
    const bonus = Math.floor(amount * rate);
    if (bonus <= 0) continue;

    const refType = ref.level === 1 ? 'referral_l2' : 'referral_l3';

    // Direct update without recursive distribution
    const { data: current } = await client
      .from('user_stats')
      .select('ko_points')
      .eq('user_id', ref.referrer_id)
      .single();

    if (!current) continue;

    await client
      .from('user_stats')
      .update({ ko_points: (current.ko_points || 0) + bonus })
      .eq('user_id', ref.referrer_id);

    await client
      .from('ko_point_transactions')
      .insert({
        user_id: ref.referrer_id,
        amount: bonus,
        type: refType,
        description: `L${ref.level + 1} referral bonus from ${sourceType}`,
        reference_id: userId,
      });
  }
}

/**
 * Daily login bonus claim
 */
export async function claimDailyLogin(
  userId: string,
  supabase?: SupabaseClient,
): Promise<{ success: boolean; alreadyClaimed?: boolean; amount?: number; newBalance?: number; error?: string }> {
  const client = supabase || getServiceClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: stats } = await client
    .from('user_stats')
    .select('daily_login_at')
    .eq('user_id', userId)
    .single();

  if (stats?.daily_login_at === today) {
    return { success: false, alreadyClaimed: true };
  }

  await client
    .from('user_stats')
    .update({ daily_login_at: today })
    .eq('user_id', userId);

  const result = await awardKoPoints(
    userId,
    KO_RATES.DAILY_LOGIN,
    'daily_login',
    'Daily login bonus',
    undefined,
    client,
  );

  return { ...result, amount: KO_RATES.DAILY_LOGIN };
}
