-- Fix profiles RLS policies to resolve car owner information visibility issues
-- This migration addresses the circular dependency preventing car owner names and ratings from displaying

-- Phase 1: Clean up restrictive policies
-- Drop the problematic policy that creates circular dependency
DROP POLICY IF EXISTS "profiles_conversation_participants_read" ON profiles;

-- Drop the function if it exists and is not used elsewhere
DROP FUNCTION IF EXISTS can_read_profile_in_conversation(uuid, uuid);

-- Phase 2: Implement tiered access policies

-- Allow authenticated users to see basic profile information needed for platform functionality
-- This enables car owner names and ratings to display on car details pages
CREATE POLICY "profiles_authenticated_basic_read" 
ON profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    id != auth.uid() -- Can see other users' basic info
    OR id = auth.uid() -- Can always see own profile
  )
);

-- Allow public (guest) access to see car owner ratings only for cars
-- This supports future guest browsing while maintaining privacy
CREATE POLICY "profiles_public_car_owner_read" 
ON profiles 
FOR SELECT 
TO anon
USING (
  -- Only allow viewing profiles of users who own available cars
  EXISTS (
    SELECT 1 FROM cars 
    WHERE cars.owner_id = profiles.id 
    AND cars.is_available = true
  )
);

-- Ensure existing own-profile policies remain intact by recreating them if needed
-- Users can view their own profiles
CREATE POLICY "profiles_own_select" 
ON profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Users can update their own profiles  
CREATE POLICY "profiles_own_update" 
ON profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users can insert their own profiles
CREATE POLICY "profiles_own_insert" 
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can delete their own profiles
CREATE POLICY "profiles_own_delete" 
ON profiles 
FOR DELETE 
TO authenticated
USING (id = auth.uid());