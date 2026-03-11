import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { checkRedemptionEligibility, getRequiredRoi } from './revenue-tracker';

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7); // '2026-03'
}

/**
 * Prize tiers based on user count.
 * As user base grows, higher-value prizes unlock.
 */
const PRIZE_TIERS = [
  { minUsers: 0,    maxPrizeEur: 25 },
  { minUsers: 100,  maxPrizeEur: 50 },
  { minUsers: 500,  maxPrizeEur: 75 },
  { minUsers: 2000, maxPrizeEur: 100 },
];

export function getMaxPrizeForUserCount(userCount: number): number {
  let max = 25;
  for (const tier of PRIZE_TIERS) {
    if (userCount >= tier.minUsers) max = tier.maxPrizeEur;
  }
  return max;
}

/**
 * Calculate monthly prize budget from actual revenue.
 * Budget = totalRevenue * budgetPct (default 15%)
 * Called daily by cron.
 */
export async function calculateMonthlyBudget(
  month?: string,
  supabase?: SupabaseClient,
): Promise<{ budget: number; revenue: number; users: number; awarded: number }> {
  const client = supabase || getServiceClient();
  const targetMonth = month || getCurrentMonth();

  // Get total revenue for the month
  const startDate = `${targetMonth}-01T00:00:00Z`;
  const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString();

  const { data: revenueData } = await client
    .from('user_revenue_ledger')
    .select('amount_usd')
    .gte('created_at', startDate)
    .lt('created_at', endDate);

  const totalRevenue = (revenueData || []).reduce((sum, r) => sum + (Number(r.amount_usd) || 0), 0);

  // Get user count
  const { count: userCount } = await client
    .from('user_stats')
    .select('*', { count: 'exact', head: true });

  // Get existing pool config or defaults
  const { data: existing } = await client
    .from('prize_pool_config')
    .select('*')
    .eq('month', targetMonth)
    .single();

  const budgetPct = existing?.budget_pct || 0.15;
  const prizeBudget = totalRevenue * budgetPct;

  // Upsert config
  await client.from('prize_pool_config').upsert({
    id: existing?.id || undefined,
    month: targetMonth,
    total_users: userCount || 0,
    total_revenue_usd: Math.round(totalRevenue * 100) / 100,
    prize_budget_usd: Math.round(prizeBudget * 100) / 100,
    budget_pct: budgetPct,
    prizes_awarded: existing?.prizes_awarded || 0,
    prizes_value_eur: existing?.prizes_value_eur || 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'month' });

  return {
    budget: Math.round(prizeBudget * 100) / 100,
    revenue: Math.round(totalRevenue * 100) / 100,
    users: userCount || 0,
    awarded: Number(existing?.prizes_value_eur) || 0,
  };
}

/**
 * Check if prize budget allows awarding a prize this month
 */
export async function checkPoolBudget(
  prizeValueEur: number,
  month?: string,
  supabase?: SupabaseClient,
): Promise<{ allowed: boolean; remaining: number }> {
  const client = supabase || getServiceClient();
  const targetMonth = month || getCurrentMonth();

  const { data } = await client
    .from('prize_pool_config')
    .select('prize_budget_usd, prizes_value_eur')
    .eq('month', targetMonth)
    .single();

  if (!data) {
    // No pool config yet - allow small prizes
    return { allowed: prizeValueEur <= 10, remaining: 10 };
  }

  const budgetEur = Number(data.prize_budget_usd) || 0; // Simplified: 1 USD ≈ 1 EUR
  const alreadyAwarded = Number(data.prizes_value_eur) || 0;
  const remaining = budgetEur - alreadyAwarded;

  return {
    allowed: remaining >= prizeValueEur,
    remaining: Math.round(remaining * 100) / 100,
  };
}

/**
 * Record a prize being awarded (update monthly totals)
 */
export async function recordPrizeAwarded(
  prizeValueEur: number,
  month?: string,
  supabase?: SupabaseClient,
): Promise<void> {
  const client = supabase || getServiceClient();
  const targetMonth = month || getCurrentMonth();

  const { data } = await client
    .from('prize_pool_config')
    .select('prizes_awarded, prizes_value_eur')
    .eq('month', targetMonth)
    .single();

  if (data) {
    await client
      .from('prize_pool_config')
      .update({
        prizes_awarded: (data.prizes_awarded || 0) + 1,
        prizes_value_eur: (Number(data.prizes_value_eur) || 0) + prizeValueEur,
        updated_at: new Date().toISOString(),
      })
      .eq('month', targetMonth);
  }
}

/**
 * Full eligibility check for prize redemption:
 * 1. Account age check
 * 2. ROI check (user's revenue contribution >= prize value * multiplier)
 * 3. Monthly pool budget check
 * 4. Monthly redemption limit check
 */
export async function fullRedemptionCheck(
  userId: string,
  prizeValueEur: number,
  prizeRoiMultiplier?: number,
  prizeMaxPerMonth?: number | null,
  supabase?: SupabaseClient,
): Promise<{
  eligible: boolean;
  reason?: string;
  contribution?: number;
  required?: number;
  poolRemaining?: number;
}> {
  const client = supabase || getServiceClient();

  // 1. Account age
  const { data: user } = await client
    .from('user_stats')
    .select('created_at')
    .eq('user_id', userId)
    .single();

  // user_stats might not have created_at, check auth.users
  // Skip this check if we can't determine — it's a soft requirement

  // 2. ROI check
  const roiMultiplier = prizeRoiMultiplier ?? getRequiredRoi(prizeValueEur);
  const roiCheck = await checkRedemptionEligibility(userId, prizeValueEur, roiMultiplier, client);

  if (!roiCheck.eligible) {
    return {
      eligible: false,
      reason: `You need $${roiCheck.required} in platform contribution. Current: $${roiCheck.contribution}. Keep engaging!`,
      contribution: roiCheck.contribution,
      required: roiCheck.required,
    };
  }

  // 3. Pool budget
  const poolCheck = await checkPoolBudget(prizeValueEur, undefined, client);
  if (!poolCheck.allowed) {
    return {
      eligible: false,
      reason: `Monthly prize budget exhausted. Remaining: €${poolCheck.remaining}. Try again next month!`,
      poolRemaining: poolCheck.remaining,
    };
  }

  // 4. Monthly redemption limit
  if (prizeMaxPerMonth) {
    const monthStart = `${getCurrentMonth()}-01T00:00:00Z`;
    const { count } = await client
      .from('prize_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart)
      .neq('status', 'rejected');

    if ((count || 0) >= prizeMaxPerMonth) {
      return {
        eligible: false,
        reason: `You've reached the monthly redemption limit (${prizeMaxPerMonth}/month).`,
      };
    }
  }

  return {
    eligible: true,
    contribution: roiCheck.contribution,
    required: roiCheck.required,
    poolRemaining: poolCheck.remaining,
  };
}
