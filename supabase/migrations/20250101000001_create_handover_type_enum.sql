-- =====================================================
-- Recovery Migration: Create handover_type enum
-- Date: November 20, 2025
-- Purpose: Recover handover_type enum that was missing from canonical migrations
-- Source: Archived migration - undated-migrations/20250610150609_add_handover_type_field.sql
-- =====================================================

-- Create enum for handover types
DO $$ BEGIN
  CREATE TYPE handover_type AS ENUM ('pickup', 'return');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add comment for documentation
COMMENT ON TYPE handover_type IS 'Type of handover session: pickup (start of rental) or return (end of rental)';



