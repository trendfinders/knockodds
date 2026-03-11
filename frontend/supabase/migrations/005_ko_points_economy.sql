-- KO Points Economy System
-- Replaces KnockCoins with revenue-backed KO Points
-- Adds multi-level referral system, revenue tracking, dynamic prize pool

-- =============================================
-- 1. Rename knock_coins -> ko_points in user_stats
-- =============================================
ALTER TABLE user_stats RENAME COLUMN knock_coins TO ko_points;

-- Add new tracking columns
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_revenue_usd NUMERIC(10,4) NOT NULL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_pageviews_tracked BIGINT NOT NULL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS referral_l2_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS referral_l3_count INTEGER NOT NULL DEFAULT 0;

-- =============================================
-- 2. Rename knock_coin_transactions -> ko_point_transactions
-- =============================================
ALTER TABLE knock_coin_transactions RENAME TO ko_point_transactions;

-- Update type constraint with new referral types
ALTER TABLE ko_point_transactions DROP CONSTRAINT IF EXISTS knock_coin_transactions_type_check;
ALTER TABLE ko_point_transactions ADD CONSTRAINT ko_point_transactions_type_check
  CHECK (type IN (
    'daily_login', 'prediction', 'win_bonus', 'streak_bonus',
    'pageviews', 'referral', 'referral_signup', 'referral_ftd',
    'affiliate_click', 'comment', 'referral_l2', 'referral_l3',
    'ftd_bonus', 'prize_redemption', 'admin_adjustment', 'perfect_prediction'
  ));

-- Rename index
ALTER INDEX IF EXISTS idx_kc_transactions_user RENAME TO idx_ko_transactions_user;

-- Update RLS policy name
ALTER POLICY "Users can read own transactions" ON ko_point_transactions
  RENAME TO "Users can read own KO transactions";

-- =============================================
-- 3. Referral tree (3-level tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS referral_tree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, referrer_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_tree_user ON referral_tree(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_tree_referrer ON referral_tree(referrer_id, level);

ALTER TABLE referral_tree ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referral tree"
  ON referral_tree FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = referrer_id);

-- =============================================
-- 4. User revenue ledger (real money tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS user_revenue_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN (
    'ad_revenue', 'affiliate_cpa',
    'referral_ad_l1', 'referral_ad_l2',
    'referral_cpa_l1', 'referral_cpa_l2'
  )),
  amount_usd NUMERIC(10,4) NOT NULL,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_ledger_user ON user_revenue_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_ledger_created ON user_revenue_ledger(created_at);

ALTER TABLE user_revenue_ledger ENABLE ROW LEVEL SECURITY;
-- Admin only via service_role

-- =============================================
-- 5. Enhance prizes table for ROI checks
-- =============================================
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS value_eur NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS roi_multiplier NUMERIC(3,1) NOT NULL DEFAULT 3.0;
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS min_account_age_days INTEGER NOT NULL DEFAULT 7;
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS max_redemptions_per_month INTEGER DEFAULT NULL;

-- =============================================
-- 6. Prize pool config (monthly budget tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS prize_pool_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL UNIQUE,
  total_users INTEGER NOT NULL DEFAULT 0,
  total_revenue_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  prize_budget_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  budget_pct NUMERIC(4,3) NOT NULL DEFAULT 0.150,
  prizes_awarded INTEGER NOT NULL DEFAULT 0,
  prizes_value_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE prize_pool_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prize pool config"
  ON prize_pool_config FOR SELECT USING (true);
