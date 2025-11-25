-- =====================================================
-- Recovery Migration: Create handover_step_completion table
-- Date: November 20, 2025
-- Purpose: Recover handover_step_completion table that was missing from canonical migrations
-- Source: Archived migration - uuid-migrations/20250617110215-create_vehicle_condition_reports_table.sql
-- =====================================================

-- Create handover steps tracking table
CREATE TABLE IF NOT EXISTS public.handover_step_completion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handover_session_id UUID REFERENCES public.handover_sessions(id) ON DELETE CASCADE,
  step_name VARCHAR(50) NOT NULL,
  step_order INTEGER NOT NULL,
  completed_by UUID REFERENCES public.profiles(id),
  is_completed BOOLEAN DEFAULT FALSE,
  completion_data JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(handover_session_id, step_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_handover_step_completion_handover_session_id ON public.handover_step_completion(handover_session_id);
CREATE INDEX IF NOT EXISTS idx_handover_step_completion_step_name ON public.handover_step_completion(step_name);
CREATE INDEX IF NOT EXISTS idx_handover_step_completion_is_completed ON public.handover_step_completion(is_completed);

-- Enable RLS
ALTER TABLE public.handover_step_completion ENABLE ROW LEVEL SECURITY;

-- RLS policies for handover_step_completion
-- Users can view handover steps for their sessions
DROP POLICY IF EXISTS "Users can view handover steps for their sessions" ON public.handover_step_completion;
CREATE POLICY "Users can view handover steps for their sessions"
  ON public.handover_step_completion
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs
      WHERE hs.id = handover_step_completion.handover_session_id
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

-- Users can manage handover steps for their sessions
DROP POLICY IF EXISTS "Users can manage handover steps for their sessions" ON public.handover_step_completion;
CREATE POLICY "Users can manage handover steps for their sessions"
  ON public.handover_step_completion
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs
      WHERE hs.id = handover_step_completion.handover_session_id
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.handover_step_completion IS 'Tracks completion of individual steps within a handover session';



