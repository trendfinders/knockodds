export interface Comment {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  page_type: 'prediction' | 'news';
  page_slug: string;
  content: string;
  parent_id: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  fight_id: number;
  fight_slug: string;
  event_slug: string;
  event_date: string;
  fighter1_name: string;
  fighter2_name: string;
  pick: string;
  method: 'KO' | 'SUB' | 'DEC';
  round: number | null;
  confidence: number;
  reasoning: string | null;
  status: 'pending' | 'published' | 'won' | 'lost' | 'push' | 'cancelled';
  points_earned: number;
  created_at: string;
  settled_at: string | null;
}

export interface UserStats {
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  total_predictions: number;
  total_wins: number;
  total_losses: number;
  total_points: number;
  current_streak: number;
  best_streak: number;
  win_rate: number;
  rank_title: string;
  monthly_points: number;
  monthly_wins: number;
  monthly_losses: number;
  last_prediction_at: string | null;
  updated_at: string;
  bio: string | null;
  ko_points: number;
  referral_code: string | null;
  referred_by: string | null;
  is_admin: boolean;
  is_banned: boolean;
  country_code: string | null;
  daily_login_at: string | null;
  total_revenue_usd: number;
  total_pageviews_tracked: number;
  referral_count: number;
  referral_l2_count: number;
  referral_l3_count: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'streak' | 'accuracy' | 'champion' | 'special';
  threshold: number | null;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface MonthlyLeaderboardEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  month: string;
  total_predictions: number;
  wins: number;
  losses: number;
  points: number;
  win_rate: number;
  rank: number | null;
}

export interface KoPointTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'daily_login' | 'prediction' | 'win_bonus' | 'streak_bonus' | 'pageviews' | 'referral' | 'referral_signup' | 'referral_ftd' | 'affiliate_click' | 'comment' | 'referral_l2' | 'referral_l3' | 'ftd_bonus' | 'prize_redemption' | 'admin_adjustment' | 'perfect_prediction';
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

// Keep backward compat alias
export type KnockCoinTransaction = KoPointTransaction;

export interface Prize {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  category: 'betting_bonus' | 'gift_card' | 'merchandise' | 'experience' | 'special';
  cost_kc: number;
  value_eur: number;
  roi_multiplier: number;
  min_account_age_days: number;
  max_redemptions_per_month: number | null;
  stock: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ReferralTree {
  id: string;
  user_id: string;
  referrer_id: string;
  level: 1 | 2 | 3;
  created_at: string;
}

export interface UserRevenueLedger {
  id: string;
  user_id: string;
  source: 'ad_revenue' | 'affiliate_cpa' | 'referral_ad_l1' | 'referral_ad_l2' | 'referral_cpa_l1' | 'referral_cpa_l2';
  amount_usd: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface PrizePoolConfig {
  id: string;
  month: string;
  total_users: number;
  total_revenue_usd: number;
  prize_budget_usd: number;
  budget_pct: number;
  prizes_awarded: number;
  prizes_value_eur: number;
  created_at: string;
  updated_at: string;
}

export interface PrizeRedemption {
  id: string;
  user_id: string;
  prize_id: string;
  cost_kc: number;
  status: 'pending' | 'approved' | 'shipped' | 'completed' | 'rejected';
  admin_notes: string | null;
  user_email: string;
  created_at: string;
  updated_at: string;
  prize?: Prize;
}

export interface AffiliateClick {
  id: string;
  user_id: string | null;
  click_id: string;
  bookmaker_slug: string;
  landing_url: string;
  country_code: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AffiliateConversion {
  id: string;
  click_id: string;
  user_id: string | null;
  bookmaker_slug: string;
  event_type: 'registration' | 'ftd' | 'deposit';
  amount_usd: number | null;
  cpa_earned: number | null;
  tier: 'tier1' | 'tier2' | 'tier3' | null;
  country_code: string | null;
  postback_raw: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
