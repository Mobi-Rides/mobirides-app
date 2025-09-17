-- Fix RLS policies to allow profile access in conversation messages
-- This will enable the frontend to fetch sender profile data when reading conversation messages

-- First, let's update the conversation_messages RLS policies to allow profile joins
-- We need to allow users to read sender profile information for messages in conversations they participate in

-- Drop restrictive policies that prevent profile joins
DROP POLICY IF EXISTS "messages_sender_only" ON conversation_messages;
DROP POLICY IF EXISTS "messages_select_policy" ON conversation_messages;

-- Create new policy that allows users to read messages in conversations they participate in
-- This will enable the profile join to work properly
CREATE POLICY "users_can_read_conversation_messages" ON conversation_messages
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_messages.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

-- Allow users to insert messages in conversations they participate in
CREATE POLICY "users_can_insert_conversation_messages" ON conversation_messages
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_messages.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

-- Allow users to update their own messages
CREATE POLICY "users_can_update_own_messages" ON conversation_messages
FOR UPDATE 
USING (sender_id = auth.uid());

-- Allow users to delete their own messages
CREATE POLICY "users_can_delete_own_messages" ON conversation_messages
FOR DELETE 
USING (sender_id = auth.uid());

-- Similarly, update conversation_participants policies to be more permissive for reading
DROP POLICY IF EXISTS "participants_own_access_only" ON conversation_participants;
DROP POLICY IF EXISTS "participants_select_policy" ON conversation_participants;

-- Allow users to read participants in conversations they participate in
CREATE POLICY "users_can_read_conversation_participants" ON conversation_participants
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp2 
    WHERE cp2.conversation_id = conversation_participants.conversation_id 
    AND cp2.user_id = auth.uid()
  )
);

-- Allow users to insert themselves as participants (for creating conversations)
CREATE POLICY "users_can_insert_own_participation" ON conversation_participants
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Update conversations policies for better access
DROP POLICY IF EXISTS "conversations_creator_only" ON conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;

-- Allow users to read conversations they participate in
CREATE POLICY "users_can_read_participated_conversations" ON conversations
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid()
  )
);

-- Allow users to create conversations
CREATE POLICY "users_can_create_conversations" ON conversations
FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Allow conversation creators to update their conversations
CREATE POLICY "creators_can_update_conversations" ON conversations
FOR UPDATE 
USING (created_by = auth.uid());