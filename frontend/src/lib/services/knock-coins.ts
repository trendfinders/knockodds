import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// KnockCoin earning rates
export const KC_RATES = {
  DAILY_LOGIN: 5,
  PREDICTION: 10,
  WIN_BONUS: 25,
  PERFECT_PREDICTION: 100,
  STREAK_3: 15,
  STREAK_5: 30,
  STREAK_10: 75,
  PER_1000_PAGEVIEWS: 100,
  REFERRAL: 50,
  REFERRAL_FTD: 200,
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

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function awardKnockCoins(
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
    .select('knock_coins')
    .eq('user_id', userId)
    .single();

  if (!current) return { success: false, error: 'User stats not found' };

  const newBalance = (current.knock_coins || 0) + amount;

  // Update balance
  const { error: updateError } = await client
    .from('user_stats')
    .update({ knock_coins: newBalance })
    .eq('user_id', userId);

  if (updateError) return { success: false, error: updateError.message };

  // Log transaction
  const { error: txError } = await client
    .from('knock_coin_transactions')
    .insert({
      user_id: userId,
      amount,
      type,
      description,
      reference_id: referenceId || null,
    });

  if (txError) return { success: false, error: txError.message };

  return { success: true, newBalance };
}

export async function spendKnockCoins(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
  supabase?: SupabaseClient,
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const client = supabase || getServiceClient();

  // Check balance first
  const { data: stats } = await client
    .from('user_stats')
    .select('knock_coins')
    .eq('user_id', userId)
    .single();

  if (!stats || stats.knock_coins < amount) {
    return { success: false, error: 'Insufficient KnockCoins' };
  }

  const newBalance = stats.knock_coins - amount;

  const { error: updateError } = await client
    .from('user_stats')
    .update({ knock_coins: newBalance })
    .eq('user_id', userId);

  if (updateError) return { success: false, error: updateError.message };

  const { error: txError } = await client
    .from('knock_coin_transactions')
    .insert({
      user_id: userId,
      amount: -amount,
      type,
      description,
      reference_id: referenceId || null,
    });

  if (txError) {
    // Rollback balance update
    await client
      .from('user_stats')
      .update({ knock_coins: stats.knock_coins })
      .eq('user_id', userId);
    return { success: false, error: txError.message };
  }

  return { success: true, newBalance };
}

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

  // Update daily_login_at
  await client
    .from('user_stats')
    .update({ daily_login_at: today })
    .eq('user_id', userId);

  // Award KC
  const result = await awardKnockCoins(
    userId,
    KC_RATES.DAILY_LOGIN,
    'daily_login',
    'Daily login bonus',
    undefined,
    client,
  );

  return { ...result, amount: KC_RATES.DAILY_LOGIN };
}
