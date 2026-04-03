ALTER TABLE insurance_packages
  ADD COLUMN IF NOT EXISTS daily_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS excess_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_segment text,
  ADD COLUMN IF NOT EXISTS international_cap_usd numeric DEFAULT 8000;