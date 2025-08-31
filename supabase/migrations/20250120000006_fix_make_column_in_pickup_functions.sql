-- Fix remaining 'make' column references in pickup location functions
-- Replace 'make' with 'brand' to match the actual cars table schema

-- Drop and recreate create_handover_step_notification function with correct column reference
DROP FUNCTION IF EXISTS create_handover_step_notification(UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.create_handover_step_notification(
    p_handover_session_id uuid,
    p_step_name text,
    p_completed_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_record record;
    booking_record record;
    car_record record;
    other_user_id uuid;
    progress_percentage integer;
    v_location_text text;
BEGIN
    -- Get handover session details with proper location data
    SELECT hs.*, b.car_id, b.latitude, b.longitude
    INTO session_record
    FROM handover_sessions hs
    JOIN bookings b ON hs.booking_id = b.id
    WHERE hs.id = p_handover_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get car details including location (using 'brand' instead of 'make')
    SELECT brand, model, location
    INTO car_record
    FROM cars
    WHERE id = session_record.car_id;
    
    -- Create location text from available data
    IF session_record.latitude IS NOT NULL AND session_record.longitude IS NOT NULL THEN
        v_location_text := CONCAT('Lat: ', session_record.latitude, ', Lng: ', session_record.longitude);
    ELSE
        v_location_text := COALESCE(car_record.location, 'Location not specified');
    END IF;
    
    -- Calculate progress percentage
    SELECT calculate_handover_progress(p_handover_session_id) INTO progress_percentage;
    
    -- Determine the other user (if host completed, notify renter and vice versa)
    IF p_completed_by = session_record.host_id THEN
        other_user_id := session_record.renter_id;
    ELSE
        other_user_id := session_record.host_id;
    END IF;
    
    -- Create notification for the other user (using 'brand' instead of 'make')
    PERFORM create_handover_notification(
        other_user_id,
        'pickup', -- This could be determined from booking status
        car_record.brand,
        car_record.model,
        v_location_text,
        'step_completed',
        p_step_name,
        progress_percentage
    );
    
    -- If handover is complete, create completion notification
    IF progress_percentage >= 100 THEN
        PERFORM create_handover_notification(
            other_user_id,
            'pickup',
            car_record.brand,
            car_record.model,
            v_location_text,
            'completed',
            NULL,
            100
        );
    END IF;
END;
$$;

-- Drop and recreate create_handover_progress_notification function with correct column reference
DROP FUNCTION IF EXISTS create_handover_progress_notification(UUID);

CREATE OR REPLACE FUNCTION public.create_handover_progress_notification(
    p_handover_session_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_record record;
    booking_record record;
    car_record record;
    progress_percentage integer;
    current_step text;
    v_location_text text;
BEGIN
    -- Get handover session details with proper location data
    SELECT hs.*, b.car_id, b.latitude, b.longitude
    INTO session_record
    FROM handover_sessions hs
    JOIN bookings b ON hs.booking_id = b.id
    WHERE hs.id = p_handover_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get car details including location (using 'brand' instead of 'make')
    SELECT brand, model, location
    INTO car_record
    FROM cars
    WHERE id = session_record.car_id;
    
    -- Create location text from available data
    IF session_record.latitude IS NOT NULL AND session_record.longitude IS NOT NULL THEN
        v_location_text := CONCAT('Lat: ', session_record.latitude, ', Lng: ', session_record.longitude);
    ELSE
        v_location_text := COALESCE(car_record.location, 'Location not specified');
    END IF;
    
    -- Calculate progress and get current step
    SELECT calculate_handover_progress(p_handover_session_id) INTO progress_percentage;
    
    -- Get the most recent incomplete step
    SELECT step_name
    INTO current_step
    FROM handover_step_completion
    WHERE handover_session_id = p_handover_session_id
      AND is_completed = false
    ORDER BY step_order ASC
    LIMIT 1;
    
    -- Create progress notifications for both users (using 'brand' instead of 'make')
    PERFORM create_handover_notification(
        session_record.host_id,
        'pickup',
        car_record.brand,
        car_record.model,
        v_location_text,
        'in_progress',
        current_step,
        progress_percentage
    );
    
    PERFORM create_handover_notification(
        session_record.renter_id,
        'pickup',
        car_record.brand,
        car_record.model,
        v_location_text,
        'in_progress',
        current_step,
        progress_percentage
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_handover_progress_notification(uuid) TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) IS 'Creates notifications when handover steps are completed (fixed make->brand column reference)';
COMMENT ON FUNCTION public.create_handover_progress_notification(uuid) IS 'Creates progress notifications for handover sessions (fixed make->brand column reference)';