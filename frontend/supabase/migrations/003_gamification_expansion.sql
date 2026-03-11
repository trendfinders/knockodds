-- Gamification Expansion: KnockCoins, Prizes, Affiliate, Admin

-- =============================================
-- 1. Extend user_stats with new columns
-- =============================================
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 300);
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS knock_coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS daily_login_at DATE;

CREATE INDEX IF NOT EXISTS idx_user_stats_referral ON user_stats(referral_code) WHERE referral_code IS NOT NULL;

-- =============================================
-- 2. Pageviews tracking
-- =============================================
CREATE TABLE pageviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pageviews_user_date ON pageviews(user_id, created_at);
CREATE INDEX idx_pageviews_created ON pageviews(created_at);

ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users insert own pageviews"
  ON pageviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No SELECT for regular users — admin queries via service_role

-- =============================================
-- 3. KnockCoin transaction ledger
-- =============================================
CREATE TABLE knock_coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'daily_login', 'prediction', 'win_bonus', 'streak_bonus',
    'pageviews', 'referral', 'ftd_bonus', 'prize_redemption', 'admin_adjustment'
  )),
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kc_transactions_user ON knock_coin_transactions(user_id, created_at DESC);

ALTER TABLE knock_coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON knock_coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 4. Prizes (reward shop items)
-- =============================================
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('betting_bonus', 'gift_card', 'merchandise', 'experience', 'special')),
  cost_kc INTEGER NOT NULL CHECK (cost_kc > 0),
  stock INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active prizes"
  ON prizes FOR SELECT
  USING (is_active = true);

-- =============================================
-- 5. Prize redemptions
-- =============================================
CREATE TABLE prize_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES prizes(id),
  cost_kc INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'shipped', 'completed', 'rejected')),
  admin_notes TEXT,
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_redemptions_user ON prize_redemptions(user_id);
CREATE INDEX idx_redemptions_status ON prize_redemptions(status);

ALTER TABLE prize_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own redemptions"
  ON prize_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Auth users insert own redemptions"
  ON prize_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 6. Affiliate click tracking
-- =============================================
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  click_id TEXT NOT NULL UNIQUE,
  bookmaker_slug TEXT NOT NULL,
  landing_url TEXT NOT NULL,
  country_code TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aff_clicks_clickid ON affiliate_clicks(click_id);
CREATE INDEX idx_aff_clicks_user ON affiliate_clicks(user_id);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- No public SELECT — managed via service_role and API routes

-- =============================================
-- 7. Affiliate conversions (postback data)
-- =============================================
CREATE TABLE affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id TEXT NOT NULL REFERENCES affiliate_clicks(click_id),
  user_id UUID REFERENCES auth.users(id),
  bookmaker_slug TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('registration', 'ftd', 'deposit')),
  amount_usd NUMERIC(10,2),
  cpa_earned NUMERIC(10,2),
  tier TEXT CHECK (tier IN ('tier1', 'tier2', 'tier3')),
  country_code TEXT,
  postback_raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(click_id, event_type)
);

CREATE INDEX idx_aff_conversions_clickid ON affiliate_conversions(click_id);
CREATE INDEX idx_aff_conversions_created ON affiliate_conversions(created_at);

ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;

-- No public SELECT — admin only via service_role

-- =============================================
-- 8. Admin action logs
-- =============================================
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- No public SELECT — admin only via service_role
