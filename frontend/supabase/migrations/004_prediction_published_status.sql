-- Add 'published' status to predictions table
-- Predictions are now immediately 'published' instead of 'pending'

ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_status_check;
ALTER TABLE predictions ADD CONSTRAINT predictions_status_check
  CHECK (status IN ('pending', 'published', 'won', 'lost', 'push', 'cancelled'));

-- Migrate existing pending predictions to published
UPDATE predictions SET status = 'published' WHERE status = 'pending';
