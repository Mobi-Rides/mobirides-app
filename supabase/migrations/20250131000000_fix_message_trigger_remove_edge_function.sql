-- Fix message notification trigger by removing supabase.functions.invoke call
-- This resolves the "cross-database references are not implemented" error
-- Push notifications will be handled at the application layer instead

CREATE OR REPLACE FUNCTION handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    participant_ids UUID[];
    participant_id UUID;
    message_preview TEXT;
BEGIN
    -- Get sender name from profiles table, fallback to auth.users email if full_name is null
    SELECT COALESCE(p.full_name, au.email, 'Unknown User') INTO sender_name
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE au.id = NEW.sender_id;

    -- Get message preview (first 100 characters)
    message_preview := LEFT(NEW.content, 100);

    -- Get all participant IDs for this conversation (excluding sender)
    SELECT array_agg(cp.user_id) INTO participant_ids
    FROM conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id;

    -- Create notifications for each participant
    FOREACH participant_id IN ARRAY participant_ids
    LOOP
        -- Create database notification only (no edge function call)
        INSERT INTO notifications (
            user_id,
            type,
            title,
            description,
            metadata,
            role_target,
            is_read
        ) VALUES (
            participant_id,
            'message_received'::notification_type,
            'New Message',
            CASE 
                WHEN LENGTH(message_preview) > 50 THEN 
                    sender_name || ': ' || LEFT(message_preview, 50) || '...'
                ELSE 
                    sender_name || ': ' || message_preview
            END,
            jsonb_build_object(
                'sender_name', sender_name,
                'sender_id', NEW.sender_id,
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id
            ),
            'system_wide'::notification_role,
            false
        );

        -- NOTE: Push notifications will be handled by the application layer
        -- after successful message sending, not by this database trigger
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_message_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_message_notification() TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION handle_new_message_notification() IS 'Creates database notifications for new messages. Push notifications are handled at application layer to avoid cross-database reference errors.';