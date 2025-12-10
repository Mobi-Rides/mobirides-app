-- Fix Critical RLS Policy Bugs - Correct Self-Referential Conditions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "messages_select_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.conversation_messages;

DROP POLICY IF EXISTS "participants_select_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_insert_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_update_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_delete_policy" ON public.conversation_participants;

DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;

-- Create corrected non-recursive RLS policies

-- Conversations policies
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversations.id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "conversations_insert_policy" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations_update_policy" ON public.conversations
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Conversation participants policies
CREATE POLICY "participants_select_policy" ON public.conversation_participants
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp2
            WHERE cp2.conversation_id = conversation_participants.conversation_id
            AND cp2.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
    );

CREATE POLICY "participants_insert_policy" ON public.conversation_participants
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
    );

CREATE POLICY "participants_update_policy" ON public.conversation_participants
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "participants_delete_policy" ON public.conversation_participants
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Conversation messages policies
CREATE POLICY "messages_select_policy" ON public.conversation_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_messages.conversation_id
            AND cp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_messages.conversation_id
            AND c.created_by = auth.uid()
        )
    );

CREATE POLICY "messages_insert_policy" ON public.conversation_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "messages_update_policy" ON public.conversation_messages
    FOR UPDATE TO authenticated
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_delete_policy" ON public.conversation_messages
    FOR DELETE TO authenticated
    USING (sender_id = auth.uid());

-- Add performance indexes for optimized policy checks
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_user 
ON public.conversation_participants (conversation_id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_sender 
ON public.conversation_messages (conversation_id, sender_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
ON public.conversations (created_by);

-- Log successful fix
SELECT 'RLS policy bugs fixed successfully' as status;