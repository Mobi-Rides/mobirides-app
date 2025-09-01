-- Fix 'full_name' column reference error in create_handover_step_notification function
-- The auth.users table doesn't have a 'full_name' column - use profiles table instead

-- Drop the existing function
DROP FUNCTION IF EXISTS public.create_handover_step_notification(uuid, text, uuid);

-- Recreate the function with proper join to profiles table
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
    v_booking_id uuid;
    v_user_name text;
    v_notification_title text;
    v_notification_content text;
BEGIN
    -- Get the booking ID from handover session
    SELECT booking_id INTO v_booking_id
    FROM handover_sessions
    WHERE id = p_handover_session_id;

    -- Get user name from profiles table, fallback to email from auth.users
    SELECT COALESCE(p.full_name, u.email) INTO v_user_name
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE u.id = p_completed_by;

    -- Create notification title and content
    v_notification_title := 'Handover Step Completed';
    v_notification_content := format('Step "%s" has been completed by %s', p_step_name, COALESCE(v_user_name, 'Unknown User'));

    -- Insert notification
    INSERT INTO notifications (
        user_id,
        title,
        content,
        type,
        related_booking_id,
        created_at
    )
    SELECT 
        b.user_id,
        v_notification_title,
        v_notification_content,
        'handover_step_completed',
        v_booking_id,
        NOW()
    FROM bookings b
    WHERE b.id = v_booking_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to create handover step notification: %', SQLERRM;
END;
$$;