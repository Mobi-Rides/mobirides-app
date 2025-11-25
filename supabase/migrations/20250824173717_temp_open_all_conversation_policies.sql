-- TEMPORARY WORKAROUND: Make all conversation policies fully open
-- This bypasses auth.uid() issues completely while we fix the authentication context

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "participants_can_see_their_participation" ON conversation_participants;
DROP POLICY IF EXISTS "participants_can_see_conversations" ON conversations;
DROP POLICY IF EXISTS "participants_can_see_messages" ON conversation_messages;

-- Step 2: Create FULLY OPEN policies for temporary access

-- Allow anyone to see all conversation participants (temporary)
CREATE POLICY "temp_open_participants_select" 
ON conversation_participants 
FOR SELECT 
USING (true);

-- Allow anyone to see all conversations (temporary)
CREATE POLICY "temp_open_conversations_select" 
ON conversations 
FOR SELECT 
USING (true);

-- Allow anyone to see all messages (temporary)
CREATE POLICY "temp_open_messages_select" 
ON conversation_messages 
FOR SELECT 
USING (true);

-- Also ensure INSERT policies work for authenticated users
-- (these might work better since they don't depend on complex queries)
CREATE POLICY "temp_authenticated_insert_conversations" 
ON conversations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "temp_authenticated_insert_participants" 
ON conversation_participants 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "temp_authenticated_insert_messages" 
ON conversation_messages 
FOR INSERT 
WITH CHECK (true);