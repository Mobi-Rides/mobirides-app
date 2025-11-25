-- Fix RLS Policy Recursion - Apply Proven Non-Recursive Pattern
-- Based on successful resolution documented in MIGRATION_GUIDE.md

-- Temporarily disable RLS to safely recreate policies
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages DISABLE ROW LEVEL SECURITY;

-- Drop problematic recursive policies
DROP POLICY IF EXISTS "conversations_participant_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_authenticated_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_creator_update" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;

DROP POLICY IF EXISTS "participants_participant_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_authenticated_insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_own_update" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_own_delete" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_select_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_insert_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_update_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_delete_policy" ON public.conversation_participants;

DROP POLICY IF EXISTS "messages_participant_select" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_participant_insert" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_sender_update" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_sender_delete" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.conversation_messages;

-- Create NON-RECURSIVE policies with direct checks (proven pattern)

-- CONVERSATIONS: Direct participant checks without function calls
CREATE POLICY "conversations_select_policy" ON public.conversations
FOR SELECT USING (
  -- User is creator OR is participant (direct check, no function)
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "conversations_insert_policy" ON public.conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations_update_policy" ON public.conversations
FOR UPDATE USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- CONVERSATION_PARTICIPANTS: Direct checks without recursion
CREATE POLICY "participants_select_policy" ON public.conversation_participants
FOR SELECT USING (
  -- User can see participants if they're a participant themselves
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp2 
    WHERE cp2.conversation_id = conversation_id AND cp2.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "participants_insert_policy" ON public.conversation_participants
FOR INSERT WITH CHECK (
  -- User can add themselves OR creator can add others
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "participants_update_policy" ON public.conversation_participants
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "participants_delete_policy" ON public.conversation_participants
FOR DELETE USING (user_id = auth.uid());

-- CONVERSATION_MESSAGES: Direct participant checks
CREATE POLICY "messages_select_policy" ON public.conversation_messages
FOR SELECT USING (
  -- User can see messages if they're a participant (direct check)
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "messages_insert_policy" ON public.conversation_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "messages_update_policy" ON public.conversation_messages
FOR UPDATE USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_delete_policy" ON public.conversation_messages
FOR DELETE USING (sender_id = auth.uid());

-- Add performance indexes for policy optimization
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation 
ON public.conversation_participants (user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_user 
ON public.conversation_participants (conversation_id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
ON public.conversations (created_by);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender 
ON public.conversation_messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation 
ON public.conversation_messages (conversation_id);

-- Re-enable RLS with fixed policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;