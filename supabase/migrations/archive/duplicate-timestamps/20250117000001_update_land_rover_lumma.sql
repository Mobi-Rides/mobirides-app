-- Update Land Rover Lumma to Range Rover Lumma CLR RS
-- This migration updates any existing car records with brand 'Land Rover' and model 'Lumma'
-- to change the brand to 'Range Rover' and model to 'Lumma CLR RS'

UPDATE public.cars 
SET 
  brand = 'Range Rover',
  model = 'Lumma CLR RS',
  updated_at = timezone('utc'::text, now())
WHERE 
  brand = 'Land Rover' 
  AND model = 'Lumma';

-- Log the number of affected rows for verification
-- Note: This will be visible in the migration output
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Updated % car record(s) from Land Rover Lumma to Range Rover Lumma CLR RS', affected_count;
END $$;