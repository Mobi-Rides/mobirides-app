
-- Fix RLS policies for conversation_messages
-- The previous policies might have been too restrictive or missing for inserts

-- Enable RLS
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- 1. Policy for INSERT: Allow users to insert messages into conversations they are participants of
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON conversation_messages;
CREATE POLICY "Users can insert messages in their conversations"
ON conversation_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversation_messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- 2. Policy for SELECT: Allow users to view messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON conversation_messages;
CREATE POLICY "Users can view messages in their conversations"
ON conversation_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversation_messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- 3. Policy for UPDATE: Allow users to edit their own messages (optional, but good to have)
DROP POLICY IF EXISTS "Users can update their own messages" ON conversation_messages;
CREATE POLICY "Users can update their own messages"
ON conversation_messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

-- 4. Policy for DELETE: Allow users to delete their own messages (optional)
DROP POLICY IF EXISTS "Users can delete their own messages" ON conversation_messages;
CREATE POLICY "Users can delete their own messages"
ON conversation_messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());
