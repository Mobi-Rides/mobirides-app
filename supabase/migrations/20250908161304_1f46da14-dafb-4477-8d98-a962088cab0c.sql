-- Update message notification trigger to use CompleteNotificationService for push notifications
-- This will send both database notifications AND push notifications for new messages

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
        -- Create database notification
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

        -- Send push notification via edge function
        PERFORM supabase.functions.invoke('send-push-notification', json_build_object(
            'recipient_id', participant_id,
            'sender_name', sender_name,
            'message_preview', message_preview,
            'notification_type', 'message'
        ));
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;