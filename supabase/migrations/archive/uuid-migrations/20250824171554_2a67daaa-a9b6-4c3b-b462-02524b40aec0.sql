-- Fix critical self-referential RLS policy bugs identified by user

-- Drop the broken policies with self-referential conditions
DROP POLICY IF EXISTS "participants_select_policy" ON conversation_participants;
DROP POLICY IF EXISTS "messages_select_policy" ON conversation_messages;
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;

-- Create correct policies without self-referential bugs
CREATE POLICY "participants_select_policy" ON conversation_participants
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = conversation_participants.conversation_id 
    AND c.created_by = auth.uid()
  )
);

CREATE POLICY "messages_select_policy" ON conversation_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_messages.conversation_id 
    AND cp.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = conversation_messages.conversation_id 
    AND c.created_by = auth.uid()
  )
);

CREATE POLICY "conversations_select_policy" ON conversations
FOR SELECT USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid()
  )
);