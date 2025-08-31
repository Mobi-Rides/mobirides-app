-- Fix 'message' column reference in create_handover_notification function
-- The notifications table uses 'description' column, not 'message'

-- Drop and recreate create_handover_notification function with correct column reference
DROP FUNCTION IF EXISTS create_handover_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION create_handover_notification(
    p_user_id UUID,
    p_handover_type TEXT,
    p_car_brand TEXT,
    p_car_model TEXT,
    p_location TEXT,
    p_status TEXT,
    p_step_name TEXT DEFAULT NULL,
    p_progress_percentage INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
    notification_type notification_type;
    title_text TEXT;
    description_text TEXT;
BEGIN
    -- Map status to valid notification_type enum values
    notification_type := CASE p_status
        WHEN 'in_progress' THEN 'handover_ready'
        WHEN 'step_completed' THEN 'system_notification'
        WHEN 'completed' THEN 'system_notification'
        WHEN 'delayed' THEN 'system_notification'
        WHEN 'cancelled' THEN 'system_notification'
        ELSE 'system_notification'
    END;
    
    -- Generate title based on status
    title_text := CASE p_status
        WHEN 'in_progress' THEN 'Handover In Progress'
        WHEN 'step_completed' THEN 'Handover Step Completed'
        WHEN 'completed' THEN 'Handover Completed'
        WHEN 'delayed' THEN 'Handover Delayed'
        WHEN 'cancelled' THEN 'Handover Cancelled'
        ELSE 'Handover Update'
    END;
    
    -- Generate description based on status and step
    description_text := CASE p_status
        WHEN 'in_progress' THEN 
            CONCAT('Handover for ', p_car_brand, ' ', p_car_model, ' is in progress at ', p_location)
        WHEN 'step_completed' THEN 
            CONCAT('Step "', COALESCE(p_step_name, 'Unknown'), '" completed for ', p_car_brand, ' ', p_car_model, ' handover')
        WHEN 'completed' THEN 
            CONCAT('Handover for ', p_car_brand, ' ', p_car_model, ' has been completed')
        WHEN 'delayed' THEN 
            CONCAT('Handover for ', p_car_brand, ' ', p_car_model, ' has been delayed')
        WHEN 'cancelled' THEN 
            CONCAT('Handover for ', p_car_brand, ' ', p_car_model, ' has been cancelled')
        ELSE 
            CONCAT('Handover update for ', p_car_brand, ' ', p_car_model)
    END;
    
    -- Insert notification using 'description' column instead of 'message'
    INSERT INTO notifications (
        user_id,
        type,
        title,
        description,
        metadata,
        created_at
    )
    VALUES (
        p_user_id,
        notification_type,
        title_text,
        description_text,
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_handover_notification(uuid, text, text, text, text, text, text, integer) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_handover_notification(uuid, text, text, text, text, text, text, integer) IS 'Creates handover notifications with correct description column reference';