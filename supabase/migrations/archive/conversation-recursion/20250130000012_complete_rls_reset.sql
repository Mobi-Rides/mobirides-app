-- Complete reset of RLS policies to fix infinite recursion
-- This migration removes all existing policies and creates simple, non-recursive ones

-- Disable RLS on all tables to avoid conflicts
ALTER TABLE "public"."conversations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_messages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "conversations_participant_select_policy" ON "public"."conversations";
DROP POLICY IF EXISTS "conversation_participants_conversation_select_policy" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "conversation_participants_simple_select_policy" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "conversation_messages_participant_select_policy" ON "public"."conversation_messages";
DROP POLICY IF EXISTS "profiles_select_policy" ON "public"."profiles";

-- Create simple, non-recursive policies

-- Profiles: Allow all authenticated users to read all profiles
CREATE POLICY "profiles_read_all" ON "public"."profiles"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (true);

-- Conversations: Allow users to read conversations they created
CREATE POLICY "conversations_creator_read" ON "public"."conversations"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

-- Conversation participants: Allow users to read their own participation records
-- and records where they are the conversation creator
CREATE POLICY "conversation_participants_read" ON "public"."conversation_participants"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM "public"."conversations" c
            WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
    );

-- Conversation messages: Allow users to read messages they sent
-- or messages in conversations they created
CREATE POLICY "conversation_messages_read" ON "public"."conversation_messages"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (
        sender_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM "public"."conversations" c
            WHERE c.id = conversation_messages.conversation_id
            AND c.created_by = auth.uid()
        )
    );

-- Add INSERT policies for testing
CREATE POLICY "conversations_insert" ON "public"."conversations"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversation_participants_insert" ON "public"."conversation_participants"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."conversations" c
            WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
    );

CREATE POLICY "conversation_messages_insert" ON "public"."conversation_messages"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

-- Re-enable RLS
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_messages" ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT ON "public"."conversations" TO authenticated;
GRANT SELECT, INSERT ON "public"."conversation_participants" TO authenticated;
GRANT SELECT, INSERT ON "public"."conversation_messages" TO authenticated;
GRANT SELECT ON "public"."profiles" TO authenticated;

-- Add comments
COMMENT ON POLICY "profiles_read_all" ON "public"."profiles" IS 
'Allows all authenticated users to read profile information';

COMMENT ON POLICY "conversations_creator_read" ON "public"."conversations" IS 
'Allows users to read conversations they created';

COMMENT ON POLICY "conversation_participants_read" ON "public"."conversation_participants" IS 
'Allows users to read their own participation records and participants in conversations they created';

COMMENT ON POLICY "conversation_messages_read" ON "public"."conversation_messages" IS 
'Allows users to read messages they sent or messages in conversations they created';