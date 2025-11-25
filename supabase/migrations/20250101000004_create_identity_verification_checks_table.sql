-- =====================================================
-- Recovery Migration: Create identity_verification_checks table
-- Date: November 20, 2025
-- Purpose: Recover identity_verification_checks table that was missing from canonical migrations
-- Source: Archived migration - uuid-migrations/20250617110215-create_vehicle_condition_reports_table.sql
-- =====================================================

-- Create identity verification checks table
CREATE TABLE IF NOT EXISTS public.identity_verification_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handover_session_id UUID REFERENCES public.handover_sessions(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Who is doing the verification
  verified_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Who is being verified
  verification_photo_url TEXT, -- Photo taken during handover for verification
  license_photo_url TEXT, -- License photo for comparison
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_identity_verification_checks_handover_session_id ON public.identity_verification_checks(handover_session_id);
CREATE INDEX IF NOT EXISTS idx_identity_verification_checks_verified_user_id ON public.identity_verification_checks(verified_user_id);

-- Enable RLS
ALTER TABLE public.identity_verification_checks ENABLE ROW LEVEL SECURITY;

-- RLS policies for identity_verification_checks
-- Users can view identity checks for their handovers
DROP POLICY IF EXISTS "Users can view identity checks for their handovers" ON public.identity_verification_checks;
CREATE POLICY "Users can view identity checks for their handovers"
  ON public.identity_verification_checks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs
      WHERE hs.id = identity_verification_checks.handover_session_id
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

-- Users can create identity checks for their handovers
DROP POLICY IF EXISTS "Users can create identity checks for their handovers" ON public.identity_verification_checks;
CREATE POLICY "Users can create identity checks for their handovers"
  ON public.identity_verification_checks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs
      WHERE hs.id = identity_verification_checks.handover_session_id
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
    AND verifier_id = auth.uid()
  );

-- Users can update identity checks they created
DROP POLICY IF EXISTS "Users can update identity checks for their handovers" ON public.identity_verification_checks;
CREATE POLICY "Users can update identity checks for their handovers"
  ON public.identity_verification_checks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs
      WHERE hs.id = identity_verification_checks.handover_session_id
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.identity_verification_checks IS 'Tracks identity verification performed during handover sessions';



