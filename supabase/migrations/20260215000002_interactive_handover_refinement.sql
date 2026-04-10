-- Migration: Interactive Handover Schema Refinement
-- Created: 2026-02-15

-- 1. Add is_interactive column to handover_sessions
ALTER TABLE public.handover_sessions
ADD COLUMN IF NOT EXISTS is_interactive BOOLEAN DEFAULT FALSE;

-- 2. Update advance_handover_step to handle special step logic
CREATE OR REPLACE FUNCTION public.advance_handover_step(
  p_session_id UUID,
  p_completed_step_name TEXT,
  p_user_id UUID,
  p_user_role TEXT,
  p_completion_data JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_current_step RECORD;
  v_is_host BOOLEAN;
  v_is_renter BOOLEAN;
  v_next_step RECORD;
BEGIN
  -- Get session and current step
  SELECT * INTO v_session FROM public.handover_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  v_is_host := (p_user_role = 'host' AND v_session.host_id = p_user_id);
  v_is_renter := (p_user_role = 'renter' AND v_session.renter_id = p_user_id);

  IF NOT v_is_host AND NOT v_is_renter THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized or invalid role');
  END IF;

  -- Get current step completion record
  SELECT * INTO v_current_step 
  FROM public.handover_step_completion 
  WHERE handover_session_id = p_session_id 
  AND step_order = v_session.current_step_order;

  -- Update completion based on role
  IF v_is_host THEN
    UPDATE public.handover_step_completion
    SET 
      host_completed = TRUE,
      host_completed_at = NOW(),
      completion_data = completion_data || p_completion_data,
      completed_by = CASE WHEN step_owner = 'host' OR (step_owner = 'both' AND renter_completed) THEN p_user_id ELSE completed_by END,
      completed_at = CASE WHEN step_owner = 'host' OR (step_owner = 'both' AND renter_completed) THEN NOW() ELSE completed_at END,
      is_completed = CASE WHEN step_owner = 'host' OR (step_owner = 'both' AND renter_completed) THEN TRUE ELSE is_completed END
    WHERE id = v_current_step.id;
  ELSIF v_is_renter THEN
    UPDATE public.handover_step_completion
    SET 
      renter_completed = TRUE,
      renter_completed_at = NOW(),
      completion_data = completion_data || p_completion_data,
      completed_by = CASE WHEN step_owner = 'renter' OR (step_owner = 'both' AND host_completed) THEN p_user_id ELSE completed_by END,
      completed_at = CASE WHEN step_owner = 'renter' OR (step_owner = 'both' AND host_completed) THEN NOW() ELSE completed_at END,
      is_completed = CASE WHEN step_owner = 'renter' OR (step_owner = 'both' AND host_completed) THEN TRUE ELSE is_completed END
    WHERE id = v_current_step.id;
  END IF;

  -- Special Logic for Location Selection
  IF p_completed_step_name = 'location_selection' AND v_is_host THEN
    UPDATE public.handover_sessions
    SET 
      handover_location_lat = (p_completion_data->>'latitude')::DOUBLE PRECISION,
      handover_location_lng = (p_completion_data->>'longitude')::DOUBLE PRECISION,
      handover_location_name = p_completion_data->>'address',
      handover_location_type = COALESCE(p_completion_data->>'type', 'custom_pin')
    WHERE id = p_session_id;
  END IF;

  -- Refresh current step data
  SELECT * INTO v_current_step FROM public.handover_step_completion WHERE id = v_current_step.id;

  -- If current step is now fully completed, advance to next step
  IF v_current_step.is_completed THEN
    -- Get next step
    SELECT * INTO v_next_step 
    FROM public.handover_step_completion 
    WHERE handover_session_id = p_session_id 
    AND step_order = v_session.current_step_order + 1;

    IF FOUND THEN
      UPDATE public.handover_sessions
      SET 
        current_step_order = v_next_step.step_order,
        waiting_for = CASE 
          WHEN v_next_step.step_owner = 'both' THEN 'both'
          ELSE v_next_step.step_owner
        END
      WHERE id = p_session_id;
    ELSE
      -- No more steps, mark session as completed
      UPDATE public.handover_sessions
      SET 
        handover_completed = TRUE,
        waiting_for = 'none'
      WHERE id = p_session_id;
    END IF;
  ELSE
    -- Step not fully completed (waiting for the other party in 'both' step)
    UPDATE public.handover_sessions
    SET 
      waiting_for = CASE 
        WHEN v_is_host THEN 'renter'
        ELSE 'host'
      END
    WHERE id = p_session_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
