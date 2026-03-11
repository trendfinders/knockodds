-- Gamification tables for prediction community

-- User predictions (one per user per fight)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  fight_id INTEGER NOT NULL,
  fight_slug TEXT NOT NULL,
  event_slug TEXT NOT NULL,
  event_date DATE NOT NULL,
  fighter1_name TEXT NOT NULL,
  fighter2_name TEXT NOT NULL,
  pick TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('KO', 'SUB', 'DEC')),
  round INTEGER CHECK (round BETWEEN 1 AND 5),
  confidence INTEGER NOT NULL DEFAULT 3 CHECK (confidence BETWEEN 1 AND 5),
  reasoning TEXT CHECK (char_length(reasoning) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'push', 'cancelled')),
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  UNIQUE(user_id, fight_id)
);

CREATE INDEX idx_predictions_fight ON predictions(fight_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_status ON predictions(status);
CREATE INDEX idx_predictions_event ON predictions(event_slug);
CREATE INDEX idx_predictions_leaderboard ON predictions(user_id, status, points_earned);
CREATE INDEX idx_predictions_monthly ON predictions(event_date, user_id, points_earned);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read predictions"
  ON predictions FOR SELECT USING (true);

CREATE POLICY "Auth users insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth users update own pending predictions"
  ON predictions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Auth users delete own pending predictions"
  ON predictions FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');


-- Materialized user stats for fast leaderboard queries
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  rank_title TEXT NOT NULL DEFAULT 'Rookie',
  monthly_points INTEGER NOT NULL DEFAULT 0,
  monthly_wins INTEGER NOT NULL DEFAULT 0,
  monthly_losses INTEGER NOT NULL DEFAULT 0,
  last_prediction_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_stats_points ON user_stats(total_points DESC);
CREATE INDEX idx_user_stats_monthly ON user_stats(monthly_points DESC);
CREATE INDEX idx_user_stats_winrate ON user_stats(win_rate DESC) WHERE total_predictions >= 5;

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read user stats"
  ON user_stats FOR SELECT USING (true);


-- Badge definitions (static reference data)
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('milestone', 'streak', 'accuracy', 'champion', 'special')),
  threshold INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges"
  ON badges FOR SELECT USING (true);

-- Seed badges
INSERT INTO badges (id, name, description, icon, category, threshold) VALUES
  ('first_prediction', 'First Blood', 'Make your first prediction', '🩸', 'milestone', 1),
  ('predictions_10', 'Getting Started', '10 predictions made', '🎯', 'milestone', 10),
  ('predictions_50', 'Dedicated', '50 predictions made', '💪', 'milestone', 50),
  ('predictions_100', 'Century', '100 predictions made', '💯', 'milestone', 100),
  ('streak_3', 'Hat Trick', '3 correct predictions in a row', '🔥', 'streak', 3),
  ('streak_5', 'On Fire', '5 correct predictions in a row', '⚡', 'streak', 5),
  ('streak_10', 'Unstoppable', '10 correct predictions in a row', '🏆', 'streak', 10),
  ('streak_20', 'Legendary', '20 correct predictions in a row', '👑', 'streak', 20),
  ('accuracy_60', 'Sharp Eye', '60%+ win rate (min 10 predictions)', '👁', 'accuracy', 60),
  ('accuracy_70', 'Analyst', '70%+ win rate (min 20 predictions)', '🧠', 'accuracy', 70),
  ('accuracy_80', 'Oracle', '80%+ win rate (min 20 predictions)', '🔮', 'accuracy', 80),
  ('perfect_prediction', 'Perfect Call', 'Correct winner + method + round', '✨', 'special', NULL),
  ('upset_caller', 'Upset Caller', 'Correctly predicted an underdog win', '🎰', 'special', NULL);


-- User badges (earned by users)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read user badges"
  ON user_badges FOR SELECT USING (true);


-- Monthly leaderboard snapshots
CREATE TABLE monthly_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  month TEXT NOT NULL,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  rank INTEGER,
  UNIQUE(user_id, month)
);

CREATE INDEX idx_monthly_lb_month ON monthly_leaderboard(month, rank);

ALTER TABLE monthly_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read monthly leaderboard"
  ON monthly_leaderboard FOR SELECT USING (true);


-- Auto-create user_stats row when first prediction is inserted
CREATE OR REPLACE FUNCTION create_user_stats_on_first_prediction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, user_name, user_avatar_url, total_predictions, last_prediction_at)
  VALUES (NEW.user_id, NEW.user_name, NEW.user_avatar_url, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_predictions = user_stats.total_predictions + 1,
    user_name = EXCLUDED.user_name,
    user_avatar_url = EXCLUDED.user_avatar_url,
    last_prediction_at = now(),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_prediction_insert
  AFTER INSERT ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats_on_first_prediction();
