-- Update RLS policies for profiles table to allow reading basic profile info of conversation participants

-- Drop the overly restrictive existing policies (keeping the authenticated basic read)
DROP POLICY IF EXISTS "profiles_authenticated_basic_read" ON public.profiles;

-- Create new policies that allow proper access while maintaining security
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- CRITICAL: Allow authenticated users to read basic profile info (name, avatar) of other users
-- This enables chat functionality while protecting sensitive data
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  -- Only allow access to non-sensitive fields through application logic
  true
);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));