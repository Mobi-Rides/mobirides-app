-- =====================================================
-- Recovery Migration: Create document_status enum
-- Date: November 20, 2025
-- Purpose: Recover document_status enum that was missing from canonical migrations
-- Source: Archived migration - uuid-migrations/20251019201232_Create_document_status_enum_plus_editing.sql
-- =====================================================

-- Create document status enum
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add comment for documentation
COMMENT ON TYPE document_status IS 'Status of document verification: pending (awaiting review), verified (approved), or rejected (failed verification)';



