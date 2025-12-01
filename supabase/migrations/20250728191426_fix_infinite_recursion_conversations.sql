-- Fix infinite recursion in conversation_participants RLS policies
-- The issue is that the RLS policy queries the same table it's protecting

-- 1. Create security definer function to get user's conversation IDs
CREATE OR REPLACE FUNCTION public.get_user_conversation_ids(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(conversation_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT cp.conversation_id
  FROM public.conversation_participants cp
  WHERE cp.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Drop and recreate the problematic RLS policy
DROP POLICY IF EXISTS "Users can view participants of conversations they're in" ON public.conversation_participants;

CREATE POLICY "Users can view participants of conversations they're in" 
ON public.conversation_participants 
FOR SELECT 
USING (conversation_id IN (SELECT get_user_conversation_ids()));

-- 3. Also fix the conversations table policy that might have similar issues
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
USING (id IN (SELECT get_user_conversation_ids()));

-- 4. Fix conversation_messages policy
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.conversation_messages;

CREATE POLICY "Users can view messages in conversations they participate in" 
ON public.conversation_messages 
FOR SELECT 
USING (conversation_id IN (SELECT get_user_conversation_ids()));

-- 5. Update other policies to use the function
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

CREATE POLICY "Users can update conversations they participate in" 
ON public.conversations 
FOR UPDATE 
USING (id IN (SELECT get_user_conversation_ids()));

-- 6. Update insert policy for conversation_messages
DROP POLICY IF EXISTS "Users can send messages to conversations they participate in" ON public.conversation_messages;

CREATE POLICY "Users can send messages to conversations they participate in" 
ON public.conversation_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND 
  conversation_id IN (SELECT get_user_conversation_ids())
);

-- 7. Create function to migrate legacy messages to conversation system
CREATE OR REPLACE FUNCTION public.migrate_legacy_messages()
RETURNS void AS $$
DECLARE
  msg_record RECORD;
  conv_id uuid;
  existing_conv_id uuid;
BEGIN
  -- Loop through all legacy messages
  FOR msg_record IN 
    SELECT DISTINCT sender_id, receiver_id 
    FROM public.messages 
    ORDER BY sender_id, receiver_id
  LOOP
    -- Check if conversation already exists between these users
    SELECT c.id INTO existing_conv_id
    FROM public.conversations c
    WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp1 
      WHERE cp1.conversation_id = c.id AND cp1.user_id = msg_record.sender_id
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp2 
      WHERE cp2.conversation_id = c.id AND cp2.user_id = msg_record.receiver_id
    );
    
    -- If no conversation exists, create one
    IF existing_conv_id IS NULL THEN
      -- Create new conversation
      INSERT INTO public.conversations (type, created_by)
      VALUES ('direct', msg_record.sender_id)
      RETURNING id INTO conv_id;
      
      -- Add participants
      INSERT INTO public.conversation_participants (conversation_id, user_id)
      VALUES 
        (conv_id, msg_record.sender_id),
        (conv_id, msg_record.receiver_id);
    ELSE
      conv_id := existing_conv_id;
    END IF;
    
    -- Migrate messages for this conversation
    INSERT INTO public.conversation_messages (
      conversation_id, 
      sender_id, 
      content, 
      created_at,
      message_type,
      related_car_id
    )
    SELECT 
      conv_id,
      m.sender_id,
      m.content,
      m.created_at,
      'text',
      m.related_car_id
    FROM public.messages m
    WHERE (
      (m.sender_id = msg_record.sender_id AND m.receiver_id = msg_record.receiver_id) OR
      (m.sender_id = msg_record.receiver_id AND m.receiver_id = msg_record.sender_id)
    )
    AND NOT EXISTS (
      -- Don't duplicate if already migrated
      SELECT 1 FROM public.conversation_messages cm
      WHERE cm.conversation_id = conv_id 
      AND cm.sender_id = m.sender_id 
      AND cm.content = m.content 
      AND cm.created_at = m.created_at
    )
    ORDER BY m.created_at;
    
  END LOOP;
  
  -- Update conversation timestamps
  UPDATE public.conversations 
  SET 
    last_message_at = (
      SELECT MAX(created_at) 
      FROM public.conversation_messages 
      WHERE conversation_id = conversations.id
    ),
    updated_at = (
      SELECT MAX(created_at) 
      FROM public.conversation_messages 
      WHERE conversation_id = conversations.id
    )
  WHERE EXISTS (
    SELECT 1 FROM public.conversation_messages 
    WHERE conversation_id = conversations.id
  );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Run the migration
SELECT public.migrate_legacy_messages();

-- 9. Enable real-time for conversation tables
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_participants') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  END IF;
END $$;