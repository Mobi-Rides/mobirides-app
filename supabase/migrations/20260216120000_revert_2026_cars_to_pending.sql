-- One-time data revert: set all cars created in 2026 that are currently
-- available back to pending so they can be reviewed in the Car Verification Queue.
-- No schema or RLS changes.
UPDATE cars
SET is_available = false
WHERE created_at >= '2026-01-01'
  AND is_available = true;
