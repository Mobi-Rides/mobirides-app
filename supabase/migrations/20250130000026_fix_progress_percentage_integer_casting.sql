-- Fix 'invalid input syntax for type integer' error in handover notification functions
-- The issue: calculate_handover_progress returns JSONB but functions try to assign it directly to INTEGER
-- Solution: Extract progress_percentage from JSONB and properly cast to INTEGER

-- Drop and recreate create_handover_step_notification function with correct JSONB handling
DROP FUNCTION IF EXISTS public.create_handover_step_notification(uuid, text, uuid);

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
    car_record record;
    other_user_id uuid;
    progress_result jsonb;
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
    
    -- Get car details (using 'brand' instead of 'make')
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
    
    -- Calculate progress and extract percentage as INTEGER
    SELECT calculate_handover_progress(p_handover_session_id) INTO progress_result;
    progress_percentage := ROUND((progress_result->>'progress_percentage')::NUMERIC)::INTEGER;
    
    -- Determine the other user (if host completed, notify renter and vice versa)
    IF p_completed_by = session_record.host_id THEN
        other_user_id := session_record.renter_id;
    ELSE
        other_user_id := session_record.host_id;
    END IF;
    
    -- Create notification for the other user
    PERFORM create_handover_notification(
        other_user_id,
        'pickup',
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

-- Drop and recreate create_handover_progress_notification function with correct JSONB handling
DROP FUNCTION IF EXISTS public.create_handover_progress_notification(uuid);

CREATE OR REPLACE FUNCTION public.create_handover_progress_notification(
    p_handover_session_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_record record;
    car_record record;
    progress_result jsonb;
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
    
    -- Get car details (using 'brand' instead of 'make')
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
    
    -- Calculate progress and extract percentage as INTEGER
    SELECT calculate_handover_progress(p_handover_session_id) INTO progress_result;
    progress_percentage := ROUND((progress_result->>'progress_percentage')::NUMERIC)::INTEGER;
    
    -- Get the most recent incomplete step
    SELECT step_name
    INTO current_step
    FROM handover_step_completion
    WHERE handover_session_id = p_handover_session_id
      AND is_completed = false
    ORDER BY step_order ASC
    LIMIT 1;
    
    -- Create progress notifications for both users
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
GRANT EXECUTE ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.create_handover_progress_notification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_handover_progress_notification(uuid) TO anon;

-- Add comments
COMMENT ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) IS 'Creates notifications when handover steps are completed (fixed JSONB to INTEGER casting)';
COMMENT ON FUNCTION public.create_handover_progress_notification(uuid) IS 'Creates progress notifications for handover sessions (fixed JSONB to INTEGER casting)';