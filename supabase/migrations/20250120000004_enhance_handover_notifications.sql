-- Enhanced handover notification functions with proper status tracking
-- This migration enhances the existing create_handover_notification function
-- and adds new functions for different handover status notifications

-- Drop existing function to recreate with enhanced functionality
DROP FUNCTION IF EXISTS public.create_handover_notification(uuid, text, text, text, text);

-- Enhanced handover notification function with status tracking
CREATE OR REPLACE FUNCTION public.create_handover_notification(
    p_user_id uuid,
    p_handover_type text,
    p_car_brand text,
    p_car_model text,
    p_location text,
    p_status text DEFAULT 'ready',
    p_step_name text DEFAULT NULL,
    p_progress_percentage integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id uuid;
    notification_title text;
    notification_description text;
    notification_type text;
BEGIN
    -- Determine notification type and content based on status
    -- Map all handover statuses to valid notification_type enum values
    CASE p_status
        WHEN 'ready' THEN
            notification_type := 'handover_ready';
            notification_title := 'Handover Ready';
            notification_description := format('Your %s handover for %s %s is ready at %s', 
                p_handover_type, p_car_brand, p_car_model, p_location);
        
        WHEN 'in_progress' THEN
            notification_type := 'handover_ready'; -- Use handover_ready for in_progress
            notification_title := 'Handover In Progress';
            notification_description := format('Your %s handover for %s %s is %s%% complete', 
                p_handover_type, p_car_brand, p_car_model, p_progress_percentage);
            
            -- Add step-specific information if provided
            IF p_step_name IS NOT NULL THEN
                notification_description := notification_description || format(' - Currently: %s', p_step_name);
            END IF;
        
        WHEN 'step_completed' THEN
            notification_type := 'system_notification'; -- Use system_notification for step completion
            notification_title := 'Handover Step Completed';
            notification_description := format('Step "%s" completed for %s handover of %s %s', 
                COALESCE(p_step_name, 'Unknown'), p_handover_type, p_car_brand, p_car_model);
        
        WHEN 'completed' THEN
            notification_type := 'system_notification'; -- Use system_notification for completion
            notification_title := 'Handover Completed';
            notification_description := format('Your %s handover for %s %s has been completed successfully', 
                p_handover_type, p_car_brand, p_car_model);
        
        WHEN 'delayed' THEN
            notification_type := 'system_notification'; -- Use system_notification for delays
            notification_title := 'Handover Delayed';
            notification_description := format('Your %s handover for %s %s has been delayed. Please check for updates.', 
                p_handover_type, p_car_brand, p_car_model);
        
        WHEN 'cancelled' THEN
            notification_type := 'system_notification'; -- Use system_notification for cancellation
            notification_title := 'Handover Cancelled';
            notification_description := format('Your %s handover for %s %s has been cancelled', 
                p_handover_type, p_car_brand, p_car_model);
        
        ELSE
            -- Default to ready status
            notification_type := 'handover_ready';
            notification_title := 'Handover Update';
            notification_description := format('Update for your %s handover of %s %s at %s', 
                p_handover_type, p_car_brand, p_car_model, p_location);
    END CASE;

    -- Insert the notification
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        description,
        metadata,
        created_at
    )
    VALUES (
        p_user_id,
        notification_type::notification_type,
        notification_title,
        notification_description,
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
    )
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$;

-- Function to create handover step completion notifications
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
BEGIN
    -- Get handover session details
    SELECT hs.*, b.car_id, b.pickup_location
    INTO session_record
    FROM handover_sessions hs
    JOIN bookings b ON hs.booking_id = b.id
    WHERE hs.id = p_handover_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get car details
    SELECT brand, model
    INTO car_record
    FROM cars
    WHERE id = session_record.car_id;
    
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
        session_record.pickup_location::text,
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
            session_record.pickup_location::text,
            'completed',
            NULL,
            100
        );
    END IF;
END;
$$;

-- Function to create handover progress notifications
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
BEGIN
    -- Get handover session details
    SELECT hs.*, b.car_id, b.pickup_location
    INTO session_record
    FROM handover_sessions hs
    JOIN bookings b ON hs.booking_id = b.id
    WHERE hs.id = p_handover_session_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get car details
    SELECT brand, model
    INTO car_record
    FROM cars
    WHERE id = session_record.car_id;
    
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
        session_record.pickup_location::text,
        'in_progress',
        current_step,
        progress_percentage
    );
    
    PERFORM create_handover_notification(
        session_record.renter_id,
        'pickup',
        car_record.brand,
        car_record.model,
        session_record.pickup_location::text,
        'in_progress',
        current_step,
        progress_percentage
    );
END;
$$;

-- Trigger function for handover step completion
CREATE OR REPLACE FUNCTION handle_handover_step_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only create notifications when a step is completed
    IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
        PERFORM create_handover_step_notification(
            NEW.handover_session_id,
            NEW.step_name,
            NEW.completed_by
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for handover step completion
DROP TRIGGER IF EXISTS handover_step_completion_trigger ON handover_step_completion;
CREATE TRIGGER handover_step_completion_trigger
    AFTER UPDATE ON handover_step_completion
    FOR EACH ROW
    EXECUTE FUNCTION handle_handover_step_completion();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_handover_notification(uuid, text, text, text, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_handover_notification(uuid, text, text, text, text, text, text, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.create_handover_progress_notification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_handover_progress_notification(uuid) TO anon;
GRANT EXECUTE ON FUNCTION handle_handover_step_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_handover_step_completion() TO anon;

-- Add comment
COMMENT ON FUNCTION public.create_handover_notification(uuid, text, text, text, text, text, text, integer) IS 'Enhanced handover notification function with status tracking and progress monitoring';
COMMENT ON FUNCTION public.create_handover_step_notification(uuid, text, uuid) IS 'Creates notifications when handover steps are completed';
COMMENT ON FUNCTION public.create_handover_progress_notification(uuid) IS 'Creates progress notifications for handover sessions';
COMMENT ON FUNCTION handle_handover_step_completion() IS 'Trigger function to handle handover step completion notifications';