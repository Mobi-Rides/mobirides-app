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

-- 2. Backfill existing blank/null details in profiles from auth.users
UPDATE public.profiles p
SET 
  full_name = COALESCE(p.full_name, u.raw_user_meta_data ->> 'full_name'),
  phone_number = COALESCE(p.phone_number, u.raw_user_meta_data ->> 'phone_number'),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND (p.full_name IS NULL OR p.phone_number IS NULL)
  AND (u.raw_user_meta_data ->> 'full_name' IS NOT NULL OR u.raw_user_meta_data ->> 'phone_number' IS NOT NULL);
