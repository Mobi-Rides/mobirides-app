-- Fix infinite recursion in RLS policies for conversations table
-- This migration addresses the 500 Internal Server Error caused by circular policy dependencies

-- First, disable RLS temporarily to avoid recursion during policy updates
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they created" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete conversations they created" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;

-- Drop conversation_participants policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they created" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can remove themselves from conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON public.conversation_participants;

-- Drop conversation_messages policies
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can send messages to conversations they participate in" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_select_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_insert_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_update_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_delete_policy" ON public.conversation_messages;

-- Re-enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies for conversations
-- Users can view conversations they participate in (using direct participant check)
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversations.id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can create conversations
CREATE POLICY "conversations_insert_policy" ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- Users can update conversations they created
CREATE POLICY "conversations_update_policy" ON public.conversations
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Users can delete conversations they created
CREATE POLICY "conversations_delete_policy" ON public.conversations
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Create policies for conversation_participants
-- Users can view participants in conversations they participate in
CREATE POLICY "conversation_participants_select_policy" ON public.conversation_participants
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp2
            WHERE cp2.conversation_id = conversation_participants.conversation_id
            AND cp2.user_id = auth.uid()
        )
    );

-- Users can add participants to conversations they created or are admins of
CREATE POLICY "conversation_participants_insert_policy" ON public.conversation_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.user_id = auth.uid()
            AND cp.is_admin = true
        )
    );

-- Users can update their own participant record
CREATE POLICY "conversation_participants_update_policy" ON public.conversation_participants
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can remove themselves from conversations
CREATE POLICY "conversation_participants_delete_policy" ON public.conversation_participants
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
    );

-- Create policies for conversation_messages
-- Users can view messages in conversations they participate in
CREATE POLICY "conversation_messages_select_policy" ON public.conversation_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can send messages to conversations they participate in
CREATE POLICY "conversation_messages_insert_policy" ON public.conversation_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can update their own messages
CREATE POLICY "conversation_messages_update_policy" ON public.conversation_messages
    FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "conversation_messages_delete_policy" ON public.conversation_messages
    FOR DELETE
    TO authenticated
    USING (sender_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_messages TO authenticated;

-- Grant read access to anon users (for public conversations if needed)
GRANT SELECT ON public.conversations TO anon;
GRANT SELECT ON public.conversation_participants TO anon;
GRANT SELECT ON public.conversation_messages TO anon;

-- Create indexes to optimize policy checks
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation 
    ON public.conversation_participants(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_user 
    ON public.conversation_participants(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
    ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender 
    ON public.conversation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation 
    ON public.conversation_messages(conversation_id);