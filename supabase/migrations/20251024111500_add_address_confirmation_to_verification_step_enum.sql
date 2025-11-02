-- Migration: Add 'ADDRESS_CONFIRMATION' to verification_step enum if missing
-- Date: 2025-10-24

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'verification_step' AND e.enumlabel = 'ADDRESS_CONFIRMATION'
  ) THEN
    ALTER TYPE verification_step ADD VALUE 'ADDRESS_CONFIRMATION';
  END IF;
END $$;
