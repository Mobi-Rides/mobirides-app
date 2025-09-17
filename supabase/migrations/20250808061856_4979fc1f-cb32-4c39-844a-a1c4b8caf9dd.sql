-- Migration to clean up legacy message usage and consolidate to conversation system

-- First, let's create a function to migrate existing messages to conversations
CREATE OR REPLACE FUNCTION migrate_legacy_messages_to_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Execute the migration
SELECT migrate_legacy_messages_to_conversations();

-- Add column to track legacy migration status
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS migrated_to_conversation_id uuid REFERENCES public.conversations(id);

-- Update migrated messages to reference their conversation
UPDATE public.messages 
SET migrated_to_conversation_id = (
  SELECT c.id 
  FROM public.conversations c
  WHERE EXISTS (
    SELECT 1 FROM public.conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = messages.sender_id
  )
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp2  
    WHERE cp2.conversation_id = c.id AND cp2.user_id = messages.receiver_id
  )
  AND c.type = 'direct'
  LIMIT 1
)
WHERE migrated_to_conversation_id IS NULL;