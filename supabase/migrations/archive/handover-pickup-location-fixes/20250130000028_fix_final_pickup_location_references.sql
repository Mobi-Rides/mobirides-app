-- Fix remaining pickup_location column references in handover notification functions
-- This migration fixes the b.pickup_location references that don't exist in the bookings table

-- Drop and recreate the create_handover_step_notification function with correct location handling
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
    location_text text;
BEGIN
    -- Get handover session details
    SELECT hs.*, b.car_id, b.pickup_latitude, b.pickup_longitude
    INTO session_record
    FROM handover_sessions hs
    JOIN bookings b ON hs.booking_id = b.id
    WHERE hs.id = p_handover_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get car details including location
    SELECT brand, model, location
    INTO car_record
    FROM cars
    WHERE id = session_record.car_id;
    
    -- Determine location text - use car location or coordinates
    IF car_record.location IS NOT NULL THEN
        location_text := car_record.location;
    ELSIF session_record.pickup_latitude IS NOT NULL AND session_record.pickup_longitude IS NOT NULL THEN
        location_text := format('Lat: %s, Lng: %s', session_record.pickup_latitude, session_record.pickup_longitude);
    ELSE
        location_text := 'Location not specified';
    END IF;
    
    -- Calculate progress percentage
    SELECT calculate_handover_progress(p_handover_session_id) INTO progress_percentage;
    
    -- Determine the other user (if host completed, notify renter and vice versa)
    IF p_completed_by = session_record.host_id THEN
        other_user_id := session_record.renter_id;
    ELSE
        other_user_id := session_record.host_id;
    END IF;
    
    -- Create notification for the other user
    PERFORM create_handover_notification(
        other_user_id,
        'pickup', -- This could be determined from booking status
        car_record.brand,
        car_record.model,
        location_text,
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
            location_text,
            'completed',
            NULL,
            100
        );
    END IF;
END;
$$;

-- Drop and recreate the create_handover_progress_notification function with correct location handling
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
    location_text text;
BEGIN
    -- Get handover session details
    SELECT hs.*, b.car_id, b.pickup_latitude, b.pickup_longitude
    INTO session_record
    FROM handover_sessions hs
    JOIN bookings b ON hs.booking_id = b.id
    WHERE hs.id = p_handover_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get car details including location
    SELECT brand, model, location
    INTO car_record
    FROM cars
    WHERE id = session_record.car_id;
    
    -- Determine location text - use car location or coordinates
    IF car_record.location IS NOT NULL THEN
        location_text := car_record.location;
    ELSIF session_record.pickup_latitude IS NOT NULL AND session_record.pickup_longitude IS NOT NULL THEN
        location_text := format('Lat: %s, Lng: %s', session_record.pickup_latitude, session_record.pickup_longitude);
    ELSE
        location_text := 'Location not specified';
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
    
    -- Create progress notifications for both users
    PERFORM create_handover_notification(
        session_record.host_id,
        'pickup',
        car_record.brand,
        car_record.model,
        location_text,
        'in_progress',
        current_step,
        progress_percentage
    );
    
    PERFORM create_handover_notification(
        session_record.renter_id,
        'pickup',
        car_record.brand,
        car_record.model,
        location_text,
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
COMMENT ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) IS 'Creates notifications when handover steps are completed - fixed pickup_location references';
COMMENT ON FUNCTION public.create_handover_progress_notification(uuid) IS 'Creates progress notifications for handover sessions - fixed pickup_location references';