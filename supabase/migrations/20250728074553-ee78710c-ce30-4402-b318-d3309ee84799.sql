-- Enable real-time for handover tables
ALTER TABLE handover_sessions REPLICA IDENTITY FULL;
ALTER TABLE handover_step_completion REPLICA IDENTITY FULL;
ALTER TABLE vehicle_condition_reports REPLICA IDENTITY FULL;
ALTER TABLE identity_verification_checks REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE handover_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE handover_step_completion;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_condition_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE identity_verification_checks;

-- Add step dependency validation function
CREATE OR REPLACE FUNCTION public.validate_step_dependencies(
  handover_session_id_param UUID,
  step_name_param VARCHAR,
  step_order_param INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  required_steps_completed BOOLEAN;
BEGIN
  -- Check if all previous steps are completed
  SELECT COALESCE(bool_and(is_completed), FALSE) INTO required_steps_completed
  FROM handover_step_completion
  WHERE handover_session_id = handover_session_id_param
  AND step_order < step_order_param;
  
  RETURN required_steps_completed;
END;
$$;

-- Add trigger to enforce step dependencies
CREATE OR REPLACE FUNCTION public.enforce_step_dependencies()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check dependencies when marking a step as completed
  IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
    -- Skip dependency check for the first step
    IF NEW.step_order > 1 THEN
      IF NOT public.validate_step_dependencies(NEW.handover_session_id, NEW.step_name, NEW.step_order) THEN
        RAISE EXCEPTION 'Cannot complete step %. Previous steps must be completed first.', NEW.step_name;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the trigger
DROP TRIGGER IF EXISTS enforce_step_dependencies_trigger ON handover_step_completion;
CREATE TRIGGER enforce_step_dependencies_trigger
  BEFORE UPDATE ON handover_step_completion
  FOR EACH ROW
  EXECUTE FUNCTION enforce_step_dependencies();

-- Add handover progress calculation function
CREATE OR REPLACE FUNCTION public.calculate_handover_progress(handover_session_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_steps INTEGER;
  completed_steps INTEGER;
  current_step INTEGER;
  progress_percentage NUMERIC;
  result JSONB;
BEGIN
  -- Count total steps
  SELECT COUNT(*) INTO total_steps
  FROM handover_step_completion
  WHERE handover_session_id = handover_session_id_param;
  
  -- Count completed steps
  SELECT COUNT(*) INTO completed_steps
  FROM handover_step_completion
  WHERE handover_session_id = handover_session_id_param
  AND is_completed = TRUE;
  
  -- Find current step (first incomplete step order)
  SELECT COALESCE(MIN(step_order), total_steps + 1) INTO current_step
  FROM handover_step_completion
  WHERE handover_session_id = handover_session_id_param
  AND is_completed = FALSE;
  
  -- Calculate progress percentage
  progress_percentage := CASE 
    WHEN total_steps = 0 THEN 0
    ELSE ROUND((completed_steps::NUMERIC / total_steps::NUMERIC) * 100, 2)
  END;
  
  result := jsonb_build_object(
    'total_steps', total_steps,
    'completed_steps', completed_steps,
    'current_step', current_step,
    'progress_percentage', progress_percentage,
    'is_completed', completed_steps = total_steps
  );
  
  RETURN result;
END;
$$;

-- Add handover status update trigger
CREATE OR REPLACE FUNCTION public.update_handover_session_on_step_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  all_steps_completed BOOLEAN;
BEGIN
  -- Check if all steps are completed for this handover session
  SELECT COALESCE(bool_and(is_completed), FALSE) INTO all_steps_completed
  FROM handover_step_completion
  WHERE handover_session_id = NEW.handover_session_id;
  
  -- Update handover session completion status if all steps are done
  IF all_steps_completed THEN
    UPDATE handover_sessions
    SET 
      handover_completed = TRUE,
      updated_at = NOW()
    WHERE id = NEW.handover_session_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the trigger
DROP TRIGGER IF EXISTS update_handover_session_trigger ON handover_step_completion;
CREATE TRIGGER update_handover_session_trigger
  AFTER UPDATE ON handover_step_completion
  FOR EACH ROW
  EXECUTE FUNCTION update_handover_session_on_step_completion();