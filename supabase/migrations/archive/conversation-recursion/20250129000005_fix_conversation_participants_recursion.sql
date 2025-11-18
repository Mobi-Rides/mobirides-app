-- Fix infinite recursion in conversation_participants RLS policy
-- The current policy queries conversation_participants table within its own SELECT policy
-- This creates infinite recursion. Replace with simple policy: user_id = auth.uid()

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "conversation_participants_select_policy" ON conversation_participants;

-- Create a simple, non-recursive policy that only allows users to see their own participant records
CREATE POLICY "conversation_participants_select_policy" ON conversation_participants
    FOR SELECT USING (user_id = auth.uid());

-- The other policies for conversation_participants are fine as they don't create recursion
-- Keep insert policy as is (allows conversation creators to add participants)
-- Keep update/delete policies as is (users can only modify their own records)

-- Add comment explaining the fix
COMMENT ON POLICY "conversation_participants_select_policy" ON conversation_participants IS 
'Simple non-recursive policy: users can only see their own participant records. This eliminates infinite recursion while maintaining security.';