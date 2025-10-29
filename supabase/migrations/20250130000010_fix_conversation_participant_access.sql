-- Fix conversation RLS policies to allow participants to access conversations they are part of
-- This resolves the 'full_name does not exist' error by allowing proper access to conversation data

-- Disable RLS temporarily to avoid conflicts during policy updates
ALTER TABLE "public"."conversations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_messages" DISABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "conversations_select_policy" ON "public"."conversations";
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON "public"."conversation_participants";
DROP POLICY IF EXISTS "conversation_messages_select_policy" ON "public"."conversation_messages";

-- Create improved SELECT policies for conversations
-- Allow users to read conversations where they are participants
DROP POLICY IF EXISTS "conversations_participant_select_policy" ON "public"."conversations";
CREATE POLICY "conversations_participant_select_policy" ON "public"."conversations"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (
        -- User is the creator of the conversation
        created_by = auth.uid()
        OR
        -- User is a participant in the conversation
        EXISTS (
            SELECT 1 FROM "public"."conversation_participants" cp
            WHERE cp.conversation_id = conversations.id
            AND cp.user_id = auth.uid()
        )
    );

-- Create improved SELECT policies for conversation_participants
-- Allow users to read participant data for conversations they are part of
DROP POLICY IF EXISTS "conversation_participants_conversation_select_policy" ON "public"."conversation_participants";
CREATE POLICY "conversation_participants_conversation_select_policy" ON "public"."conversation_participants"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (
        -- User can see their own participation records
        user_id = auth.uid()
        OR
        -- User can see other participants in conversations they are part of
        EXISTS (
            SELECT 1 FROM "public"."conversation_participants" cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Create improved SELECT policies for conversation_messages
-- Allow users to read messages from conversations they participate in
DROP POLICY IF EXISTS "conversation_messages_participant_select_policy" ON "public"."conversation_messages";
CREATE POLICY "conversation_messages_participant_select_policy" ON "public"."conversation_messages"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (
        -- User sent the message
        sender_id = auth.uid()
        OR
        -- User is a participant in the conversation containing this message
        EXISTS (
            SELECT 1 FROM "public"."conversation_participants" cp
            WHERE cp.conversation_id = conversation_messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Re-enable RLS with the new policies
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_messages" ENABLE ROW LEVEL SECURITY;

-- Ensure proper permissions are granted
GRANT SELECT ON "public"."conversations" TO authenticated;
GRANT SELECT ON "public"."conversation_participants" TO authenticated;
GRANT SELECT ON "public"."conversation_messages" TO authenticated;
GRANT SELECT ON "public"."profiles" TO authenticated;

-- Grant basic read access to anon role for potential guest features
GRANT SELECT ON "public"."conversations" TO anon;
GRANT SELECT ON "public"."conversation_participants" TO anon;
GRANT SELECT ON "public"."conversation_messages" TO anon;
GRANT SELECT ON "public"."profiles" TO anon;

-- Add comment explaining the fix
COMMENT ON POLICY "conversations_participant_select_policy" ON "public"."conversations" IS 
'Allows authenticated users to read conversations where they are either the creator or a participant';

COMMENT ON POLICY "conversation_participants_conversation_select_policy" ON "public"."conversation_participants" IS 
'Allows authenticated users to read participant data for conversations they are part of, enabling access to other participants full_name';

COMMENT ON POLICY "conversation_messages_participant_select_policy" ON "public"."conversation_messages" IS 
'Allows authenticated users to read messages from conversations they participate in, enabling proper message display with sender full_name';