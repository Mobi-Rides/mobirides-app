-- Fix Infinite Recursion in conversation_participants
-- We use a SECURITY DEFINER function to break the RLS loop.

-- 1. Create helper function
CREATE OR REPLACE FUNCTION public.is_participant(p_conversation_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Direct check on the table.
  -- Since this is SECURITY DEFINER, it bypasses RLS on conversation_participants.
  -- This prevents the recursion loop when called from an RLS policy.
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = p_conversation_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_participant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_participant(UUID) TO service_role;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "view_conversation_peers" ON public.conversation_participants;

-- 3. Recreate policy using the function
CREATE POLICY "view_conversation_peers"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  public.is_participant(conversation_id)
);

-- Note: "view_own_participation" (auth.uid() = user_id) is still valid and non-recursive, 
-- but "view_conversation_peers" covers it (if I am a participant, I can see all rows for that conversation, including my own).
-- So strictly speaking, we only need "view_conversation_peers".
-- But keeping "view_own_participation" is fine as an OR condition (or separate policy). 
-- Postgres combines policies with OR.

-- Let's keep both for clarity, or just rely on the function.
-- Function is safer.
