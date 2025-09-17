-- Fix infinite recursion in RLS policies by removing circular dependencies
-- The previous migration created a security definer function that queries the same table it protects
-- This causes infinite recursion. We need to use direct auth.uid() checks instead.

-- 1. Drop the problematic security definer function and all dependent policies
DROP FUNCTION IF EXISTS public.get_user_conversation_ids(uuid) CASCADE;

-- 2. Drop all existing RLS policies that cause recursion
DROP POLICY IF EXISTS "Users can view participants of conversations they're in" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can send messages to conversations they participate in" ON public.conversation_messages;

-- Drop any existing policies with new names
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversation_messages_select_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_insert_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_update_policy" ON public.conversation_messages;

-- 3. Create new non-recursive RLS policies for conversation_participants
-- Users can view participants in conversations where they are also participants
CREATE POLICY "conversation_participants_select_policy" 
ON public.conversation_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp2 
    WHERE cp2.conversation_id = conversation_participants.conversation_id 
    AND cp2.user_id = auth.uid()
  )
);

-- Users can insert themselves as participants
CREATE POLICY "conversation_participants_insert_policy" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can update their own participant records
CREATE POLICY "conversation_participants_update_policy" 
ON public.conversation_participants 
FOR UPDATE 
USING (user_id = auth.uid());

-- 4. Create new non-recursive RLS policies for conversations
-- Users can view conversations where they are participants
CREATE POLICY "conversations_select_policy" 
ON public.conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid()
  )
);

-- Users can create new conversations
CREATE POLICY "conversations_insert_policy" 
ON public.conversations 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Users can update conversations they created or participate in
CREATE POLICY "conversations_update_policy" 
ON public.conversations 
FOR UPDATE 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid()
  )
);

-- 5. Create new non-recursive RLS policies for conversation_messages
-- Users can view messages in conversations they participate in
CREATE POLICY "conversation_messages_select_policy" 
ON public.conversation_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_messages.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

-- Users can send messages to conversations they participate in
CREATE POLICY "conversation_messages_insert_policy" 
ON public.conversation_messages 
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_messages.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

-- Users can update their own messages
CREATE POLICY "conversation_messages_update_policy" 
ON public.conversation_messages 
FOR UPDATE 
USING (sender_id = auth.uid());

-- 6. Grant necessary permissions to anon and authenticated roles
GRANT SELECT ON public.conversations TO anon, authenticated;
GRANT INSERT, UPDATE ON public.conversations TO authenticated;

GRANT SELECT ON public.conversation_participants TO anon, authenticated;
GRANT INSERT, UPDATE ON public.conversation_participants TO authenticated;

GRANT SELECT ON public.conversation_messages TO anon, authenticated;
GRANT INSERT, UPDATE ON public.conversation_messages TO authenticated;

-- 7. Ensure RLS is enabled on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_id ON public.conversation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);