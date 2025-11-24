-- Fix RLS policies for admin functionality
-- Add missing DELETE policy for profiles and update other admin policies

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;

-- Allow all authenticated users to read all profiles (for user management)
CREATE POLICY "profiles_read_all" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to update their own profiles
CREATE POLICY "users_update_own_profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "admins_update_all_profiles" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Allow admins to delete users (for user management)
CREATE POLICY "admins_delete_users" ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Service role can manage all profiles (for system operations)
CREATE POLICY "service_role_manage_profiles" ON public.profiles
    FOR ALL
    TO service_role
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- USER_RESTRICTIONS TABLE POLICIES
-- =====================================================

-- Ensure user_restrictions has proper admin policies
DROP POLICY IF EXISTS "Admins can view all user restrictions" ON user_restrictions;
DROP POLICY IF EXISTS "Admins can insert user restrictions" ON user_restrictions;
DROP POLICY IF EXISTS "Admins can update user restrictions" ON user_restrictions;

-- Admins can view all restrictions
CREATE POLICY "admins_view_restrictions" ON user_restrictions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admins can create restrictions
CREATE POLICY "admins_create_restrictions" ON user_restrictions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admins can update restrictions
CREATE POLICY "admins_update_restrictions" ON user_restrictions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- =====================================================
-- CONVERSATIONS POLICIES
-- =====================================================

-- Ensure conversations have proper admin policies
DROP POLICY IF EXISTS "conversations_creator_read" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;

-- Users can read conversations they participate in or created
CREATE POLICY "conversations_read" ON conversations
    FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversations.id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can create conversations
CREATE POLICY "conversations_insert" ON conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- Admins can manage all conversations
CREATE POLICY "admins_manage_conversations" ON conversations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- =====================================================
-- CONVERSATION_PARTICIPANTS POLICIES
-- =====================================================

-- Ensure conversation_participants have proper policies
DROP POLICY IF EXISTS "conversation_participants_read" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON conversation_participants;

-- Users can read their own participation and participants in their conversations
CREATE POLICY "conversation_participants_read" ON conversation_participants
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
    );

-- Users can be added to conversations
CREATE POLICY "conversation_participants_insert" ON conversation_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
    );

-- Admins can manage all participants
CREATE POLICY "admins_manage_participants" ON conversation_participants
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- =====================================================
-- CONVERSATION_MESSAGES POLICIES
-- =====================================================

-- Ensure conversation_messages have proper policies
DROP POLICY IF EXISTS "conversation_messages_read" ON conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_insert" ON conversation_messages;

-- Users can read messages in conversations they participate in
CREATE POLICY "conversation_messages_read" ON conversation_messages
    FOR SELECT
    TO authenticated
    USING (
        sender_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can send messages in conversations they participate in
CREATE POLICY "conversation_messages_insert" ON conversation_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Admins can manage all messages
CREATE POLICY "admins_manage_messages" ON conversation_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_restrictions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversation_messages TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "admins_delete_users" ON public.profiles IS
'Allows admin users to delete any user profile for account management';

COMMENT ON POLICY "admins_view_restrictions" ON user_restrictions IS
'Allows admin users to view all user restrictions';

COMMENT ON POLICY "admins_create_restrictions" ON user_restrictions IS
'Allows admin users to create user restrictions';

COMMENT ON POLICY "admins_update_restrictions" ON user_restrictions IS
'Allows admin users to update user restrictions';

COMMENT ON POLICY "admins_manage_conversations" ON conversations IS
'Allows admin users to manage all conversations for moderation';

COMMENT ON POLICY "admins_manage_participants" ON conversation_participants IS
'Allows admin users to manage conversation participants';

COMMENT ON POLICY "admins_manage_messages" ON conversation_messages IS
'Allows admin users to manage conversation messages for moderation';
