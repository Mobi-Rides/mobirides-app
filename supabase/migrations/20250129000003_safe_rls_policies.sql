-- Safely create RLS policies for all tables causing ERR_ABORTED errors
-- This migration checks for existing policies before creating new ones

-- Function to safely drop policy if exists
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name text, policy_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
EXCEPTION
    WHEN undefined_object THEN
        -- Policy doesn't exist, continue
        NULL;
END;
$$ LANGUAGE plpgsql;

-- NOTIFICATIONS TABLE - Focus on the main issue
-- Drop all existing policies for notifications
SELECT drop_policy_if_exists('notifications', 'Users can view their own notifications');
SELECT drop_policy_if_exists('notifications', 'System can create notifications');
SELECT drop_policy_if_exists('notifications', 'Users can update their own notifications');
SELECT drop_policy_if_exists('notifications', 'Users can delete their own notifications');
SELECT drop_policy_if_exists('notifications', 'notifications_select_policy');
SELECT drop_policy_if_exists('notifications', 'notifications_insert_policy');
SELECT drop_policy_if_exists('notifications', 'notifications_update_policy');
SELECT drop_policy_if_exists('notifications', 'notifications_delete_policy');

-- Create new policies for notifications
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR auth.role() = 'service_role'
    );

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- CONVERSATIONS TABLE - Drop and recreate policies
SELECT drop_policy_if_exists('conversations', 'Users can view conversations they participate in');
SELECT drop_policy_if_exists('conversations', 'Users can create conversations');
SELECT drop_policy_if_exists('conversations', 'Users can update conversations they participate in');
SELECT drop_policy_if_exists('conversations', 'Users can delete conversations they created');
SELECT drop_policy_if_exists('conversations', 'conversations_select_policy');
SELECT drop_policy_if_exists('conversations', 'conversations_insert_policy');
SELECT drop_policy_if_exists('conversations', 'conversations_update_policy');
SELECT drop_policy_if_exists('conversations', 'conversations_delete_policy');

-- Create new non-recursive policies for conversations
CREATE POLICY "conversations_select_policy" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp 
            WHERE cp.conversation_id = conversations.id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "conversations_insert_policy" ON conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "conversations_update_policy" ON conversations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp 
            WHERE cp.conversation_id = conversations.id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "conversations_delete_policy" ON conversations
    FOR DELETE USING (created_by = auth.uid());

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation 
    ON conversation_participants(user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
    ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON notifications(user_id, is_read);

-- Clean up the helper function
DROP FUNCTION IF EXISTS drop_policy_if_exists(text, text);