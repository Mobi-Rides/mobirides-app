-- Migration to fix existing user profiles with incorrect data
-- This script updates profiles with correct data from auth.users metadata

-- First, let's see what we're working with
-- SELECT 
--   u.id,
--   u.email,
--   u.raw_user_meta_data->>'full_name' as metadata_full_name,
--   u.raw_user_meta_data->>'phone_number' as metadata_phone_number,
--   p.full_name as profile_full_name,
--   p.phone_number as profile_phone_number
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- WHERE u.raw_user_meta_data IS NOT NULL;

-- Update profiles with correct data from user metadata
UPDATE public.profiles 
SET 
  full_name = COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = profiles.id),
    profiles.full_name,
    (SELECT email FROM auth.users WHERE id = profiles.id)
  ),
  phone_number = COALESCE(
    (SELECT raw_user_meta_data->>'phone_number' FROM auth.users WHERE id = profiles.id),
    profiles.phone_number
  ),
  updated_at = NOW()
WHERE 
  -- Only update profiles where we have metadata to work with
  id IN (
    SELECT u.id 
    FROM auth.users u 
    WHERE u.raw_user_meta_data IS NOT NULL
      AND (
        u.raw_user_meta_data->>'full_name' IS NOT NULL 
        OR u.raw_user_meta_data->>'phone_number' IS NOT NULL
      )
  )
  AND (
    -- Update if full_name is null or doesn't match metadata
    full_name IS NULL 
    OR full_name != (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = profiles.id)
    -- Update if phone_number is null or doesn't match metadata (and metadata exists)
    OR (
      phone_number IS NULL 
      AND (SELECT raw_user_meta_data->>'phone_number' FROM auth.users WHERE id = profiles.id) IS NOT NULL
    )
    OR (
      phone_number != (SELECT raw_user_meta_data->>'phone_number' FROM auth.users WHERE id = profiles.id)
      AND (SELECT raw_user_meta_data->>'phone_number' FROM auth.users WHERE id = profiles.id) IS NOT NULL
    )
  );

-- Log the results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % user profiles with correct metadata', updated_count;
END $$;

-- Verify the results (uncomment to see the updated data)
-- SELECT 
--   u.id,
--   u.email,
--   u.raw_user_meta_data->>'full_name' as metadata_full_name,
--   u.raw_user_meta_data->>'phone_number' as metadata_phone_number,
--   p.full_name as profile_full_name,
--   p.phone_number as profile_phone_number,
--   CASE 
--     WHEN p.full_name = u.raw_user_meta_data->>'full_name' THEN '✓'
--     ELSE '✗'
--   END as full_name_match,
--   CASE 
--     WHEN p.phone_number = u.raw_user_meta_data->>'phone_number' THEN '✓'
--     WHEN u.raw_user_meta_data->>'phone_number' IS NULL THEN 'N/A'
--     ELSE '✗'
--   END as phone_match
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- WHERE u.raw_user_meta_data IS NOT NULL
-- ORDER BY u.created_at DESC;