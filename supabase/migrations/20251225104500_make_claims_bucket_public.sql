-- Make insurance-claims bucket public and ensure booking_status enum is complete
-- This follows the "do the same" instruction for claims

-- 1. Update insurance-claims bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'insurance-claims';

-- If it doesn't exist, create it (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'insurance-claims', 
  'insurance-claims', 
  true, 
  10485760, 
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Ensure booking_status has all required values
-- PostgreSQL doesn't support IF NOT EXISTS for ADD VALUE directly in a transaction easily without logic
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'booking_status'::regtype AND enumlabel = 'in_progress') THEN
    ALTER TYPE booking_status ADD VALUE 'in_progress';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add in_progress to booking_status (might already exist or type missing)';
END $$;
