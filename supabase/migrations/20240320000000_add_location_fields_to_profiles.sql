
-- Add location sharing fields to profiles table
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS is_sharing_location BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_sharing_scope TEXT DEFAULT 'all'::text,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add functions to update user location
CREATE OR REPLACE FUNCTION update_user_location(
  user_id UUID,
  lat NUMERIC,
  lng NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    latitude = lat,
    longitude = lng,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_location_sharing ON profiles(is_sharing_location);
CREATE INDEX IF NOT EXISTS idx_profiles_coordinates ON profiles(latitude, longitude);

