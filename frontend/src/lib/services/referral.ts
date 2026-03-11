import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { awardKoPoints, KO_RATES } from './ko-points';

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Generate a unique referral code for a user (KO-XXXXX format)
 */
export function generateReferralCode(userId: string): string {
  const hash = userId.replace(/-/g, '').slice(0, 5).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `KO-${hash}${rand}`;
}

/**
 * Process a new user's referral signup:
 * - Build referral_tree entries (up to 3 levels)
 * - Award referrer KO Points
 * - Increment referral counts
 */
export async function processReferralSignup(
  newUserId: string,
  referralCode: string,
  supabase?: SupabaseClient,
): Promise<{ success: boolean; referrerId?: string; error?: string }> {
  const client = supabase || getServiceClient();

  // Find referrer by code
  const { data: referrer } = await client
    .from('user_stats')
    .select('user_id, referred_by')
    .eq('referral_code', referralCode)
    .single();

  if (!referrer) return { success: false, error: 'Invalid referral code' };
  if (referrer.user_id === newUserId) return { success: false, error: 'Cannot refer yourself' };

  // Set referred_by on new user
  await client
    .from('user_stats')
    .update({ referred_by: referrer.user_id })
    .eq('user_id', newUserId);

  // Build referral tree - Level 1 (direct referrer)
  await client.from('referral_tree').upsert({
    user_id: newUserId,
    referrer_id: referrer.user_id,
    level: 1,
  }, { onConflict: 'user_id,referrer_id' });

  // Increment L1 referrer count
  const { data: l1Stats } = await client
    .from('user_stats')
    .select('referral_count')
    .eq('user_id', referrer.user_id)
    .single();

  if (l1Stats) {
    await client.from('user_stats')
      .update({ referral_count: (l1Stats.referral_count || 0) + 1 })
      .eq('user_id', referrer.user_id);
  }

  // Level 2 (referrer's referrer)
  if (referrer.referred_by) {
    await client.from('referral_tree').upsert({
      user_id: newUserId,
      referrer_id: referrer.referred_by,
      level: 2,
    }, { onConflict: 'user_id,referrer_id' });

    const { data: l2Stats } = await client
      .from('user_stats')
      .select('referral_l2_count, referred_by')
      .eq('user_id', referrer.referred_by)
      .single();

    if (l2Stats) {
      await client.from('user_stats')
        .update({ referral_l2_count: (l2Stats.referral_l2_count || 0) + 1 })
        .eq('user_id', referrer.referred_by);

      // Level 3 (referrer's referrer's referrer)
      if (l2Stats.referred_by) {
        await client.from('referral_tree').upsert({
          user_id: newUserId,
          referrer_id: l2Stats.referred_by,
          level: 3,
        }, { onConflict: 'user_id,referrer_id' });

        const { data: l3Stats } = await client
          .from('user_stats')
          .select('referral_l3_count')
          .eq('user_id', l2Stats.referred_by)
          .single();

        if (l3Stats) {
          await client.from('user_stats')
            .update({ referral_l3_count: (l3Stats.referral_l3_count || 0) + 1 })
            .eq('user_id', l2Stats.referred_by);
        }
      }
    }
  }

  // Award referrer signup bonus
  await awardKoPoints(
    referrer.user_id,
    KO_RATES.REFERRAL_SIGNUP,
    'referral_signup',
    'New referral signup bonus',
    newUserId,
    client,
  );

  return { success: true, referrerId: referrer.user_id };
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(
  userId: string,
  supabase?: SupabaseClient,
): Promise<{
  referralCode: string | null;
  l1Count: number;
  l2Count: number;
  l3Count: number;
  totalPointsFromReferrals: number;
  referrals: Array<{ user_name: string; level: number; created_at: string }>;
}> {
  const client = supabase || getServiceClient();

  const { data: stats } = await client
    .from('user_stats')
    .select('referral_code, referral_count, referral_l2_count, referral_l3_count')
    .eq('user_id', userId)
    .single();

  // Get total points earned from referrals
  const { data: txData } = await client
    .from('ko_point_transactions')
    .select('amount')
    .eq('user_id', userId)
    .in('type', ['referral_l2', 'referral_l3', 'referral_signup']);

  const totalPointsFromReferrals = (txData || []).reduce((sum, t) => sum + (t.amount || 0), 0);

  // Get referral list (L1 only, with names)
  const { data: referralTree } = await client
    .from('referral_tree')
    .select('user_id, level, created_at')
    .eq('referrer_id', userId)
    .eq('level', 1)
    .order('created_at', { ascending: false })
    .limit(50);

  const referrals: Array<{ user_name: string; level: number; created_at: string }> = [];
  if (referralTree) {
    const userIds = referralTree.map(r => r.user_id);
    const { data: names } = await client
      .from('user_stats')
      .select('user_id, user_name')
      .in('user_id', userIds);

    const nameMap = new Map((names || []).map(n => [n.user_id, n.user_name]));
    for (const r of referralTree) {
      referrals.push({
        user_name: nameMap.get(r.user_id) || 'Unknown',
        level: r.level,
        created_at: r.created_at,
      });
    }
  }

  return {
    referralCode: stats?.referral_code || null,
    l1Count: stats?.referral_count || 0,
    l2Count: stats?.referral_l2_count || 0,
    l3Count: stats?.referral_l3_count || 0,
    totalPointsFromReferrals,
    referrals,
  };
}

/**
 * Ensure user has a referral code, create if missing
 */
export async function ensureReferralCode(
  userId: string,
  supabase?: SupabaseClient,
): Promise<string> {
  const client = supabase || getServiceClient();

  const { data } = await client
    .from('user_stats')
    .select('referral_code')
    .eq('user_id', userId)
    .single();

  if (data?.referral_code) return data.referral_code;

  const code = generateReferralCode(userId);
  await client
    .from('user_stats')
    .update({ referral_code: code })
    .eq('user_id', userId);

  return code;
}
