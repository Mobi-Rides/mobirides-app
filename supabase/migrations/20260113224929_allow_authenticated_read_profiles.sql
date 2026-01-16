-- Allow authenticated users to read all profiles
-- This is necessary for chat features where users need to see the names/avatars of message senders

-- Drop the restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new permissive policy for SELECT
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles
FOR SELECT 
TO authenticated 
USING (true);
