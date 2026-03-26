-- Change default value of is_available from true to false
-- This ensures new car listings require admin approval before going live
ALTER TABLE public.cars ALTER COLUMN is_available SET DEFAULT false;