-- Fix handover notification functions to match actual notifications table structure
-- The table uses 'description' not 'message', enum values are different, and id is bigint not UUID

-- Drop existing functions first
DROP FUNCTION IF EXISTS create_handover_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS create_handover_step_notification(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_handover_progress_notification(UUID, INTEGER, INTEGER);

-- Create corrected create_handover_notification function
CREATE OR REPLACE FUNCTION create_handover_notification(
  p_user_id UUID,
  p_handover_type TEXT,
  p_car_brand TEXT,
  p_car_model TEXT,
  p_location TEXT,
  p_status TEXT DEFAULT 'ready',
  p_step_name TEXT DEFAULT NULL,
  p_progress_percentage INTEGER DEFAULT 0
)
RETURNS BIGINT AS $$
DECLARE
  notification_type notification_type;
  notification_title TEXT;
  notification_description TEXT;
  notification_id BIGINT;
BEGIN
  -- Determine notification type based on status (use only valid enum values)
  CASE p_status
    WHEN 'ready', 'pickup', 'return', 'completed' THEN
      notification_type := 'handover_ready';
    ELSE
      notification_type := 'system_notification';
  END CASE;
  
  -- Create appropriate title and description
  IF p_step_name IS NOT NULL THEN
    notification_title := 'Handover Step Update';
    notification_description := format('Step "%s" for %s %s at %s', 
                                      p_step_name, p_car_brand, p_car_model, p_location);
  ELSIF p_progress_percentage > 0 THEN
    notification_title := 'Handover Progress Update';
    notification_description := format('Handover %s%% complete for %s %s at %s', 
                                      p_progress_percentage, p_car_brand, p_car_model, p_location);
  ELSE
    notification_title := format('Handover %s', initcap(p_status));
    notification_description := format('Your %s handover for %s %s is %s at %s', 
                                      p_handover_type, p_car_brand, p_car_model, p_status, p_location);
  END IF;
  
  -- Insert notification using correct column names and let ID auto-generate
  INSERT INTO public.notifications (
    user_id,
    title,
    description,  -- Use 'description' not 'message'
    type,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    notification_title,
    notification_description,
    notification_type::notification_type,  -- Explicit cast
    jsonb_build_object(
      'handover_type', p_handover_type,
      'car_brand', p_car_brand,
      'car_model', p_car_model,
      'location', p_location,
      'status', p_status,
      'step_name', p_step_name,
      'progress_percentage', p_progress_percentage
    ),
    NOW()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create corrected create_handover_step_notification function
CREATE OR REPLACE FUNCTION create_handover_step_notification(
  p_handover_session_id UUID,
  p_step_name TEXT,
  p_step_status TEXT
)
RETURNS BIGINT AS $$
DECLARE
  v_booking_id UUID;
  v_user_id UUID;
  v_car_id UUID;
  car_record RECORD;
  notification_id BIGINT;
BEGIN
  -- Get booking and user info from handover session
  SELECT hs.booking_id, b.user_id, b.car_id
  INTO v_booking_id, v_user_id, v_car_id
  FROM handover_sessions hs
  JOIN bookings b ON hs.booking_id = b.id
  WHERE hs.id = p_handover_session_id;

  -- Get car details
  SELECT brand, model, license_plate
  INTO car_record
  FROM cars
  WHERE id = v_car_id;

  -- Create notification using the corrected function
  notification_id := create_handover_notification(
    v_user_id,
    'step_update',
    car_record.brand,
    car_record.model,
    car_record.license_plate,
    p_step_status,
    p_step_name,
    0
  );
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create corrected create_handover_progress_notification function
CREATE OR REPLACE FUNCTION create_handover_progress_notification(
  p_handover_session_id UUID,
  p_completed_steps INTEGER,
  p_total_steps INTEGER
)
RETURNS BIGINT AS $$
DECLARE
  v_booking_id UUID;
  v_user_id UUID;
  v_car_id UUID;
  car_record RECORD;
  v_progress_percent INTEGER;
  notification_id BIGINT;
BEGIN
  -- Calculate progress percentage
  v_progress_percent := ROUND((p_completed_steps::FLOAT / p_total_steps::FLOAT) * 100);

  -- Get booking and user info from handover session
  SELECT hs.booking_id, b.user_id, b.car_id
  INTO v_booking_id, v_user_id, v_car_id
  FROM handover_sessions hs
  JOIN bookings b ON hs.booking_id = b.id
  WHERE hs.id = p_handover_session_id;

  -- Get car details
  SELECT brand, model, license_plate
  INTO car_record
  FROM cars
  WHERE id = v_car_id;

  -- Create notification using the corrected function
  notification_id := create_handover_notification(
    v_user_id,
    'progress_update',
    car_record.brand,
    car_record.model,
    car_record.license_plate,
    'in_progress',
    NULL,
    v_progress_percent
  );
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_handover_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_handover_step_notification(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_handover_progress_notification(UUID, INTEGER, INTEGER) TO authenticated;