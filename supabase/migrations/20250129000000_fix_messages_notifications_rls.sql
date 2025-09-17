-- Fix RLS policies for messages and notifications tables
-- This migration addresses ERR_ABORTED errors caused by missing or incorrect RLS policies

-- First, disable RLS temporarily to avoid issues during policy updates
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be problematic
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

-- Drop notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

-- Re-enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies for messages table
-- Users can view messages they sent or received
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        sender_id = auth.uid() 
        OR receiver_id = auth.uid()
    );

-- Users can send messages
CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

-- Users can update their own sent messages
CREATE POLICY "messages_update_policy" ON public.messages
    FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

-- Users can delete their own sent messages
CREATE POLICY "messages_delete_policy" ON public.messages
    FOR DELETE
    TO authenticated
    USING (sender_id = auth.uid());

-- Create policies for notifications table
-- Users can view their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- System can create notifications for users
CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Allow system to create notifications

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_policy" ON public.notifications
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Grant read access to anon users for public messages if needed
GRANT SELECT ON public.messages TO anon;
GRANT SELECT ON public.notifications TO anon;

-- Create indexes to optimize policy checks
CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
    ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id 
    ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
    ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON public.notifications(user_id, is_read);