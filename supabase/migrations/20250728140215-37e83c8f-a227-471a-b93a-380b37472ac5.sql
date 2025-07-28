-- Migrate existing messages to new conversation structure
DO $$
DECLARE
  message_record RECORD;
  new_conversation_id UUID;
BEGIN
  -- Create conversations from existing message pairs
  FOR message_record IN (
    SELECT DISTINCT 
      LEAST(sender_id, receiver_id) as user1_id,
      GREATEST(sender_id, receiver_id) as user2_id,
      MIN(created_at) as first_message_at,
      related_car_id
    FROM public.messages
    GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), related_car_id
  ) LOOP
    -- Create new conversation
    INSERT INTO public.conversations (created_by, created_at, updated_at)
    VALUES (message_record.user1_id, message_record.first_message_at, message_record.first_message_at)
    RETURNING id INTO new_conversation_id;
    
    -- Add participants
    INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
    VALUES (new_conversation_id, message_record.user1_id, message_record.first_message_at);
    
    -- Add second participant only if different from first
    IF message_record.user2_id != message_record.user1_id THEN
      INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
      VALUES (new_conversation_id, message_record.user2_id, message_record.first_message_at);
    END IF;
    
    -- Migrate messages to new format
    INSERT INTO public.conversation_messages (
      conversation_id, 
      sender_id, 
      content, 
      created_at, 
      updated_at,
      related_car_id,
      metadata
    )
    SELECT 
      new_conversation_id,
      sender_id,
      content,
      created_at,
      updated_at,
      related_car_id,
      jsonb_build_object('migrated_from_old_messages', true, 'original_receiver_id', receiver_id)
    FROM public.messages
    WHERE 
      (sender_id = message_record.user1_id AND receiver_id = message_record.user2_id) OR
      (sender_id = message_record.user2_id AND receiver_id = message_record.user1_id)
      AND (related_car_id = message_record.related_car_id OR (related_car_id IS NULL AND message_record.related_car_id IS NULL))
    ORDER BY created_at;
    
  END LOOP;
END $$;