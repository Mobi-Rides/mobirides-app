-- Migration: Add calculate_handover_progress RPC
-- Created: 2026-02-15

CREATE OR REPLACE FUNCTION public.calculate_handover_progress(
  handover_session_id_param UUID
) RETURNS JSONB AS $$
DECLARE
  v_total_steps INTEGER;
  v_completed_steps INTEGER;
  v_current_step_order INTEGER;
  v_handover_completed BOOLEAN;
  v_progress_percentage FLOAT;
BEGIN
  -- Get session status
  SELECT 
    current_step_order, 
    handover_completed 
  INTO 
    v_current_step_order, 
    v_handover_completed 
  FROM public.handover_sessions 
  WHERE id = handover_session_id_param;

  -- Count total steps
  SELECT COUNT(*) INTO v_total_steps 
  FROM public.handover_step_completion 
  WHERE handover_session_id = handover_session_id_param;

  -- Count completed steps
  SELECT COUNT(*) INTO v_completed_steps 
  FROM public.handover_step_completion 
  WHERE handover_session_id = handover_session_id_param 
  AND is_completed = TRUE;

  -- Calculate percentage
  IF v_total_steps > 0 THEN
    v_progress_percentage := (v_completed_steps::FLOAT / v_total_steps::FLOAT) * 100;
  ELSE
    v_progress_percentage := 0;
  END IF;

  RETURN jsonb_build_object(
    'total_steps', v_total_steps,
    'completed_steps', v_completed_steps,
    'current_step', v_current_step_order,
    'progress_percentage', v_progress_percentage,
    'is_completed', v_handover_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
