-- Fix create_handover_step_notification function signature mismatch
-- The function is being called with (UUID, TEXT, UUID) but expects (UUID, TEXT, TEXT)
-- Update to accept: handover_session_id (UUID), step_name (TEXT), completed_by (UUID)

-- Drop the existing function
DROP FUNCTION IF EXISTS create_handover_step_notification(uuid, text, text);

-- Recreate with correct signature
CREATE OR REPLACE FUNCTION create_handover_step_notification(
    p_handover_session_id uuid,
    p_step_name text,
    p_completed_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking_id uuid;
    v_user_id uuid;
    v_user_name text;
BEGIN
    -- Get booking_id from handover_sessions
    SELECT booking_id INTO v_booking_id
    FROM handover_sessions
    WHERE id = p_handover_session_id;
    
    IF v_booking_id IS NULL THEN
        RAISE EXCEPTION 'Handover session not found: %', p_handover_session_id;
    END IF;
    
    -- Get user details
    SELECT id, COALESCE(full_name, email) INTO v_user_id, v_user_name
    FROM auth.users
    WHERE id = p_completed_by;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_completed_by;
    END IF;
    
    -- Create notification
    INSERT INTO notifications (
        user_id,
        title,
        description,
        type,
        booking_id,
        created_at
    ) VALUES (
        v_user_id,
        'Handover Step Completed',
        'Step "' || p_step_name || '" has been completed by ' || v_user_name,
        'handover_step',
        v_booking_id,
        NOW()
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_handover_step_notification(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_handover_step_notification(uuid, text, uuid) TO anon;