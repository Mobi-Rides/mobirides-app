-- Fix handover notification functions to use 'brand' instead of 'make'
-- The cars table uses 'brand' column, not 'make'

-- Drop and recreate create_handover_step_notification function
DROP FUNCTION IF EXISTS create_handover_step_notification(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_handover_step_notification(
  p_handover_session_id UUID,
  p_step_name TEXT,
  p_step_status TEXT
)
RETURNS VOID AS $$
DECLARE
  v_booking_id UUID;
  v_user_id UUID;
  v_car_id UUID;
  car_record RECORD;
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

  -- Create notification
  INSERT INTO notifications (
    id,
    user_id,
    title,
    message,
    type,
    data,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'Handover Step Update',
    format('Step "%s" %s for %s %s (%s)', 
           p_step_name, 
           p_step_status, 
           car_record.brand, 
           car_record.model, 
           car_record.license_plate),
    'handover_step',
    jsonb_build_object(
      'handover_session_id', p_handover_session_id,
      'booking_id', v_booking_id,
      'step_name', p_step_name,
      'step_status', p_step_status,
      'car_brand', car_record.brand,
      'car_model', car_record.model,
      'license_plate', car_record.license_plate
    ),
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate create_handover_progress_notification function
DROP FUNCTION IF EXISTS create_handover_progress_notification(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION create_handover_progress_notification(
  p_handover_session_id UUID,
  p_completed_steps INTEGER,
  p_total_steps INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_booking_id UUID;
  v_user_id UUID;
  v_car_id UUID;
  car_record RECORD;
  v_progress_percent INTEGER;
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

  -- Create notification
  INSERT INTO notifications (
    id,
    user_id,
    title,
    message,
    type,
    data,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'Handover Progress Update',
    format('Handover progress: %s%% complete (%s/%s steps) for %s %s (%s)', 
           v_progress_percent,
           p_completed_steps, 
           p_total_steps,
           car_record.brand, 
           car_record.model, 
           car_record.license_plate),
    'handover_progress',
    jsonb_build_object(
      'handover_session_id', p_handover_session_id,
      'booking_id', v_booking_id,
      'completed_steps', p_completed_steps,
      'total_steps', p_total_steps,
      'progress_percent', v_progress_percent,
      'car_brand', car_record.brand,
      'car_model', car_record.model,
      'license_plate', car_record.license_plate
    ),
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_handover_step_notification(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_handover_progress_notification(UUID, INTEGER, INTEGER) TO authenticated;