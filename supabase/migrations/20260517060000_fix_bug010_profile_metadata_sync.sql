-- Migration: fix_bug010_profile_metadata_sync
-- Description: Corrects the trigger handle_new_user_profile to extract full_name and phone_number from auth.users metadata, 
-- and backfills missing metadata for existing profiles from auth.users.

-- 1. Correct the handle_new_user_profile function
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone_number, created_at, updated_at)
  VALUES (
    NEW.id,
    'renter',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone_number',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    phone_number = COALESCE(profiles.phone_number, EXCLUDED.phone_number),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Backfill existing blank/null details in profiles from auth.users (Stage 1: Safe update of full_name)
UPDATE public.profiles p
SET 
  full_name = COALESCE(p.full_name, u.raw_user_meta_data ->> 'full_name'),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND p.full_name IS NULL
  AND u.raw_user_meta_data ->> 'full_name' IS NOT NULL;

-- 3. Backfill existing blank/null details in profiles from auth.users (Stage 2: Safe, deduplicated update of phone_number)
WITH unique_phone_users AS (
  -- For each phone number, pick exactly one user (the oldest one by created_at)
  SELECT DISTINCT ON (u.raw_user_meta_data ->> 'phone_number')
    u.id,
    u.raw_user_meta_data ->> 'phone_number' AS phone_number
  FROM auth.users u
  WHERE u.raw_user_meta_data ->> 'phone_number' IS NOT NULL
  ORDER BY u.raw_user_meta_data ->> 'phone_number', u.created_at ASC
)
UPDATE public.profiles p
SET 
  phone_number = upu.phone_number,
  updated_at = NOW()
FROM unique_phone_users upu
WHERE p.id = upu.id
  AND p.phone_number IS NULL
  AND NOT EXISTS (
    -- Ensure this phone number does not already exist in profiles
    SELECT 1 FROM public.profiles p2 
    WHERE p2.phone_number = upu.phone_number
  );
