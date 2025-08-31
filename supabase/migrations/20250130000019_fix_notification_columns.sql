-- Fix message notification trigger to use correct notification table columns
-- The notifications table has 'description' not 'message', and type should be 'message_received'

CREATE OR REPLACE FUNCTION handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    participant_ids UUID[];
    participant_id UUID;
BEGIN
    -- Get sender name from profiles table, fallback to auth.users email if full_name is null
    SELECT 
        COALESCE(
            p.full_name, 
            (SELECT au.email FROM auth.users au WHERE au.id = NEW.sender_id)
        )
    INTO sender_name
    FROM public.profiles p
    WHERE p.id = NEW.sender_id;

    -- Get all participants in the conversation except the sender
    SELECT array_agg(cp.user_id)
    INTO participant_ids
    FROM conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id;

    -- Create notifications for each participant
    IF participant_ids IS NOT NULL THEN
        FOREACH participant_id IN ARRAY participant_ids
        LOOP
            INSERT INTO notifications (
                user_id,
                title,
                description,
                type,
                metadata
            ) VALUES (
                participant_id,
                'New Message',
                COALESCE(sender_name, 'Someone') || ' sent you a message',
                'message_received',
                jsonb_build_object(
                    'conversation_id', NEW.conversation_id,
                    'message_id', NEW.id,
                    'sender_id', NEW.sender_id,
                    'sender_name', COALESCE(sender_name, 'Unknown')
                )
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS message_notification_trigger ON conversation_messages;

CREATE TRIGGER message_notification_trigger
    AFTER INSERT ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message_notification();