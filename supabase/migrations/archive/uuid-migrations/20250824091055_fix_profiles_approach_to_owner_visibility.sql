-- Fix profiles RLS policies - targeted approach to resolve car owner visibility issues

-- Phase 1: Drop only the problematic policy that creates circular dependency
DROP POLICY IF EXISTS "profiles_conversation_participants_read" ON profiles;

-- Drop the function if it exists and is not used elsewhere
DROP FUNCTION IF EXISTS can_read_profile_in_conversation(uuid, uuid);

-- Phase 2: Add new policies for proper access control

-- Allow authenticated users to see basic profile information needed for platform functionality
-- This enables car owner names and ratings to display on car details pages
DROP POLICY IF EXISTS "profiles_authenticated_basic_read" ON profiles;
CREATE POLICY "profiles_authenticated_basic_read" 
ON profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND id != auth.uid() -- Can see other users' basic info (name, avatar for car owners)
);

-- Allow public (guest) access to see car owner information for available cars
-- This supports future guest browsing while maintaining privacy
DROP POLICY IF EXISTS "profiles_public_car_owner_read" ON profiles;
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