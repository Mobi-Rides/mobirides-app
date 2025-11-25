-- Fix handover notification functions to use correct location columns
-- The bookings table has latitude/longitude, cars table has location
-- Replace non-existent b.pickup_location with proper location data

-- Drop and recreate create_handover_step_notification function
DROP FUNCTION IF EXISTS create_handover_step_notification(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_handover_step_notification(
    p_booking_id UUID,
    p_step_name TEXT,
    p_status TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_booking_record RECORD;
    v_car_location TEXT;
    v_location_text TEXT;
BEGIN
    -- Get booking details with car location
    SELECT 
        b.*,
        c.location as car_location
    INTO v_booking_record
    FROM bookings b
    JOIN cars c ON b.car_id = c.id
    WHERE b.id = p_booking_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found: %', p_booking_id;
    END IF;
    
    -- Create location text from available data
    IF v_booking_record.latitude IS NOT NULL AND v_booking_record.longitude IS NOT NULL THEN
        v_location_text := CONCAT('Lat: ', v_booking_record.latitude, ', Lng: ', v_booking_record.longitude);
    ELSE
        v_location_text := COALESCE(v_booking_record.car_location, 'Location not specified');
    END IF;
    
    -- Create the notification
    SELECT create_handover_notification(
        v_booking_record.renter_id,
        'handover_step',
        CONCAT('Handover step "', p_step_name, '" ', p_status, ' for booking at ', v_location_text),
        jsonb_build_object(
            'booking_id', p_booking_id,
            'step_name', p_step_name,
            'status', p_status,
            'location', v_location_text
        )
    ) INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Drop and recreate create_handover_progress_notification function
DROP FUNCTION IF EXISTS create_handover_progress_notification(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION create_handover_progress_notification(
    p_booking_id UUID,
    p_completed_steps INTEGER,
    p_total_steps INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_booking_record RECORD;
    v_car_location TEXT;
    v_location_text TEXT;
    v_progress_percent INTEGER;
BEGIN
    -- Get booking details with car location
    SELECT 
        b.*,
        c.location as car_location
    INTO v_booking_record
    FROM bookings b
    JOIN cars c ON b.car_id = c.id
    WHERE b.id = p_booking_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found: %', p_booking_id;
    END IF;
    
    -- Create location text from available data
    IF v_booking_record.latitude IS NOT NULL AND v_booking_record.longitude IS NOT NULL THEN
        v_location_text := CONCAT('Lat: ', v_booking_record.latitude, ', Lng: ', v_booking_record.longitude);
    ELSE
        v_location_text := COALESCE(v_booking_record.car_location, 'Location not specified');
    END IF;
    
    -- Calculate progress percentage
    v_progress_percent := CASE 
        WHEN p_total_steps > 0 THEN (p_completed_steps * 100 / p_total_steps)
        ELSE 0
    END;
    
    -- Create the notification
    SELECT create_handover_notification(
        v_booking_record.renter_id,
        'handover_progress',
        CONCAT('Handover progress: ', p_completed_steps, '/', p_total_steps, ' steps completed (', v_progress_percent, '%) at ', v_location_text),
        jsonb_build_object(
            'booking_id', p_booking_id,
            'completed_steps', p_completed_steps,
            'total_steps', p_total_steps,
            'progress_percent', v_progress_percent,
            'location', v_location_text
        )
    ) INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_handover_step_notification(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_handover_progress_notification(UUID, INTEGER, INTEGER) TO authenticated;