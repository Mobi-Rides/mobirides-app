-- CRITICAL FIX: Revert to simple, reliable RLS policies to restore messaging functionality

-- Step 1: Drop the overly complex policies that are blocking all access
DROP POLICY IF EXISTS "participants_select_policy" ON conversation_participants;
DROP POLICY IF EXISTS "messages_select_policy" ON conversation_messages;
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;

-- Step 2: Implement SIMPLE, DIRECT policies that don't depend on complex nested queries

-- Simple policy for conversation participants - just check direct user_id match
CREATE POLICY "participants_can_see_their_participation" 
ON conversation_participants 
FOR SELECT 
USING (user_id = auth.uid());

-- Simple policy for conversations - check if user is a participant
CREATE POLICY "participants_can_see_conversations" 
ON conversations 
FOR SELECT 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversations.id 
    AND user_id = auth.uid()
  )
);

-- Simple policy for messages - check if user is a participant of the conversation
CREATE POLICY "participants_can_see_messages" 
ON conversation_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversation_messages.conversation_id 
    AND user_id = auth.uid()
  )
);

-- Temporarily enable broader access for debugging auth.uid() issues if needed
-- This will help identify if the issue is with auth.uid() or policy complexity

-- Keep existing INSERT/UPDATE/DELETE policies for other operations
-- Only fixing the SELECT policies that are blocking data access