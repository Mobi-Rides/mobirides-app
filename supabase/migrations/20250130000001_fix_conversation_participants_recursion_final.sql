-- Fix infinite recursion in conversation_participants RLS policy
-- This migration replaces the recursive policy with a simple non-recursive one

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON "public"."conversation_participants";

-- Create a simple non-recursive policy that allows users to see only their own participant records
CREATE POLICY "conversation_participants_select_policy" ON "public"."conversation_participants"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Ensure the policy is enabled
ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON "public"."conversation_participants" TO authenticated;
GRANT SELECT ON "public"."conversation_participants" TO anon;