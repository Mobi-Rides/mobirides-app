-- Comprehensive fix for infinite recursion in RLS policies
-- This migration drops all potentially problematic policies and recreates them with simple logic

-- Disable RLS temporarily to avoid conflicts
ALTER TABLE "public"."conversations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_messages" DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on these tables
DROP POLICY IF EXISTS "conversations_select_policy" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_insert_policy" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_update_policy" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_delete_policy" ON "public"."conversations";

DROP POLICY IF EXISTS "conversation_participants_select_policy" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "conversation_participants_update_policy" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "conversation_participants_delete_policy" ON "public"."conversation_participants";

DROP POLICY IF EXISTS "conversation_messages_select_policy" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "conversation_messages_insert_policy" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "conversation_messages_update_policy" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "conversation_messages_delete_policy" ON "public"."conversation_messages";

-- Create simple, non-recursive policies for conversation_participants
CREATE POLICY "conversation_participants_select_policy" ON "public"."conversation_participants"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "conversation_participants_insert_policy" ON "public"."conversation_participants"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "conversation_participants_delete_policy" ON "public"."conversation_participants"
    AS PERMISSIVE FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Create simple policies for conversations (only allow access to conversations where user is creator)
CREATE POLICY "conversations_select_policy" ON "public"."conversations"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "conversations_insert_policy" ON "public"."conversations"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations_update_policy" ON "public"."conversations"
    AS PERMISSIVE FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations_delete_policy" ON "public"."conversations"
    AS PERMISSIVE FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Create simple policies for conversation_messages (only allow access to messages user sent)
CREATE POLICY "conversation_messages_select_policy" ON "public"."conversation_messages"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (sender_id = auth.uid());

CREATE POLICY "conversation_messages_insert_policy" ON "public"."conversation_messages"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "conversation_messages_update_policy" ON "public"."conversation_messages"
    AS PERMISSIVE FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "conversation_messages_delete_policy" ON "public"."conversation_messages"
    AS PERMISSIVE FOR DELETE
    TO authenticated
    USING (sender_id = auth.uid());

-- Re-enable RLS
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_messages" ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON "public"."conversations" TO authenticated;
GRANT ALL ON "public"."conversation_participants" TO authenticated;
GRANT ALL ON "public"."conversation_messages" TO authenticated;

GRANT SELECT ON "public"."conversations" TO anon;
GRANT SELECT ON "public"."conversation_participants" TO anon;
GRANT SELECT ON "public"."conversation_messages" TO anon;