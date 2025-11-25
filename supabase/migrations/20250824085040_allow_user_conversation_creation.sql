-- Fix RLS policies for conversations to allow user creation
-- First, let's check what policies exist and create a proper function

-- Create a helper function to check if user is conversation participant
CREATE OR REPLACE FUNCTION is_conversation_participant(conversation_uuid uuid, user_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM conversation_participants 
    WHERE conversation_id = conversation_uuid 
    AND user_id = user_uuid
  ) OR EXISTS (
    SELECT 1 
    FROM conversations 
    WHERE id = conversation_uuid 
    AND created_by = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "conversations_insert_by_creator" ON conversations;
DROP POLICY IF EXISTS "conversations_participants_only" ON conversations;

-- Create new, working policies for conversations
CREATE POLICY "conversations_authenticated_insert" 
ON conversations 
FOR INSERT 
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations_participant_select" 
ON conversations 
FOR SELECT 
TO authenticated
USING (is_conversation_participant(id, auth.uid()));

CREATE POLICY "conversations_creator_update" 
ON conversations 
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Fix conversation_participants policies
DROP POLICY IF EXISTS "participants_delete_own_only" ON conversation_participants;
DROP POLICY IF EXISTS "participants_in_user_conversations" ON conversation_participants;
DROP POLICY IF EXISTS "participants_insert_own_only" ON conversation_participants;
DROP POLICY IF EXISTS "participants_update_own_only" ON conversation_participants;

CREATE POLICY "participants_authenticated_insert" 
ON conversation_participants 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "participants_participant_select" 
ON conversation_participants 
FOR SELECT 
TO authenticated
USING (is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "participants_own_update" 
ON conversation_participants 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "participants_own_delete" 
ON conversation_participants 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Fix conversation_messages policies
DROP POLICY IF EXISTS "messages_insert_participants_only" ON conversation_messages;
DROP POLICY IF EXISTS "messages_participants_only" ON conversation_messages;

CREATE POLICY "messages_participant_select" 
ON conversation_messages 
FOR SELECT 
TO authenticated
USING (is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "messages_participant_insert" 
ON conversation_messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND 
  is_conversation_participant(conversation_id, auth.uid())
);

CREATE POLICY "messages_sender_update" 
ON conversation_messages 
FOR UPDATE 
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_sender_delete" 
ON conversation_messages 
FOR DELETE 
TO authenticated
USING (sender_id = auth.uid());