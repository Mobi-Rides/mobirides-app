-- Create comprehensive RLS policies for all tables causing ERR_ABORTED errors

-- Drop existing policies if they exist and recreate them
-- This ensures we have clean, non-recursive policies

-- CONVERSATIONS TABLE
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can delete conversations they created" ON conversations;

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

-- CONVERSATION_PARTICIPANTS TABLE
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;
DROP POLICY IF EXISTS "Users can remove themselves from conversations" ON conversation_participants;

CREATE POLICY "conversation_participants_select_policy" ON conversation_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM conversation_participants cp2 
            WHERE cp2.conversation_id = conversation_participants.conversation_id 
            AND cp2.user_id = auth.uid()
        )
    );

CREATE POLICY "conversation_participants_insert_policy" ON conversation_participants
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM conversations c 
                WHERE c.id = conversation_participants.conversation_id 
                AND c.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "conversation_participants_update_policy" ON conversation_participants
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "conversation_participants_delete_policy" ON conversation_participants
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_participants.conversation_id 
            AND c.created_by = auth.uid()
        )
    );

-- CONVERSATION_MESSAGES TABLE
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON conversation_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON conversation_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON conversation_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON conversation_messages;

CREATE POLICY "conversation_messages_select_policy" ON conversation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp 
            WHERE cp.conversation_id = conversation_messages.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "conversation_messages_insert_policy" ON conversation_messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversation_participants cp 
            WHERE cp.conversation_id = conversation_messages.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "conversation_messages_update_policy" ON conversation_messages
    FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "conversation_messages_delete_policy" ON conversation_messages
    FOR DELETE USING (sender_id = auth.uid());

-- MESSAGES TABLE (legacy)
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT USING (
        sender_id = auth.uid() OR receiver_id = auth.uid()
    );

CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND sender_id = auth.uid()
    );

CREATE POLICY "messages_update_policy" ON messages
    FOR UPDATE USING (
        sender_id = auth.uid() OR receiver_id = auth.uid()
    );

CREATE POLICY "messages_delete_policy" ON messages
    FOR DELETE USING (sender_id = auth.uid());

-- NOTIFICATIONS TABLE
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation 
    ON conversation_participants(user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation 
    ON conversation_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation 
    ON conversation_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
    ON messages(sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
    ON notifications(user_id);