-- Fix infinite recursion in conversation_participants RLS policy
-- The previous policy was checking the same table it was applying to, causing infinite recursion

-- Disable RLS temporarily to avoid conflicts during policy updates
ALTER TABLE "public"."conversation_participants" DISABLE ROW LEVEL SECURITY;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "conversation_participants_conversation_select_policy" ON "public"."conversation_participants";

-- Create a simpler, non-recursive policy for conversation_participants
-- Allow users to read participant data for conversations they created or are directly participating in
CREATE POLICY "conversation_participants_simple_select_policy" ON "public"."conversation_participants"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (
        -- User can see their own participation records
        user_id = auth.uid()
        OR
        -- User can see participants in conversations they created
        EXISTS (
            SELECT 1 FROM "public"."conversations" c
            WHERE c.id = conversation_participants.conversation_id
            AND c.created_by = auth.uid()
        )
    );

-- Re-enable RLS with the fixed policy
ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;

-- Add comment explaining the fix
COMMENT ON POLICY "conversation_participants_simple_select_policy" ON "public"."conversation_participants" IS 
'Fixed policy that avoids infinite recursion by checking conversations table instead of self-referencing conversation_participants'