
-- Fix chat RLS policies and notification trigger

-- 1. Fix handle_new_message_notification to handle NULL participant_ids
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

    -- Create notifications for each participant ONLY if there are participants
    IF participant_ids IS NOT NULL THEN
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
                COALESCE(sender_name, 'Someone') || ' sent you a message: ' || message_preview,
                jsonb_build_object(
                    'conversation_id', NEW.conversation_id,
                    'message_id', NEW.id,
                    'sender_id', NEW.sender_id,
                    'sender_name', COALESCE(sender_name, 'Unknown')
                ),
                'user',
                false
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create Security Definer function to check participation (Avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_conversation_participant_secure(conversation_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversation_uuid
    AND user_id = auth.uid()
  );
END;
$$;


-- 3. Update RLS policies for conversation_messages
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation_messages_select_policy" ON conversation_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON conversation_messages;
DROP POLICY IF EXISTS "messages_select_policy" ON conversation_messages;

CREATE POLICY "conversation_messages_select_policy" ON conversation_messages
    FOR SELECT USING (
        public.is_conversation_participant_secure(conversation_id)
    );

-- 4. Update RLS policies for conversations (using the same secure function)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;

CREATE POLICY "conversations_select_policy" ON conversations
    FOR SELECT USING (
        public.is_conversation_participant_secure(id)
    );

-- 5. Ensure permissions are granted
GRANT EXECUTE ON FUNCTION public.is_conversation_participant_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant_secure(uuid) TO anon;
