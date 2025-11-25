-- =====================================================
-- Recovery Migration: Create guides table
-- Date: November 20, 2025
-- Purpose: Recover guides table that was missing from canonical migrations
-- Source: Archived migration - uuid-migrations/20250906074018_create_help_center_guides_table.sql
-- =====================================================

-- Create guides table for help center content
CREATE TABLE IF NOT EXISTS public.guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('renter', 'host', 'shared')),
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  read_time TEXT DEFAULT '5 min',
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guides_role ON public.guides(role);
CREATE INDEX IF NOT EXISTS idx_guides_section ON public.guides(section);
CREATE INDEX IF NOT EXISTS idx_guides_is_popular ON public.guides(is_popular);

-- Enable RLS on guides table
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read guides
DROP POLICY IF EXISTS "Authenticated users can read guides" ON public.guides;
CREATE POLICY "Authenticated users can read guides" 
ON public.guides 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Note: Initial guide content seeding removed - should be done separately or via seed script
-- Original archived migration had INSERT statements, but we're keeping migrations lean

-- Add comments for documentation
COMMENT ON TABLE public.guides IS 'Help center guides and documentation for renters and hosts';



