-- Check for existing users in auth.users without profiles and create them
-- This will fix any users who signed up before the trigger was working
-- Skip phone numbers entirely to avoid unique constraint conflicts

-- Insert profiles for users who don't have them yet (without phone numbers)
INSERT INTO public.profiles (id, role, full_name, created_at, updated_at)
SELECT 
  au.id,
  'renter'::user_role as role,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL -- Only for confirmed users
ON CONFLICT (id) DO NOTHING; -- Skip if profile already exists

-- Show results
SELECT 
  'Profiles created for missing users' as description,
  COUNT(*) as count
FROM auth.users au
INNER JOIN public.profiles p ON au.id = p.id
WHERE au.email_confirmed_at IS NOT NULL;

SELECT 
  'Users still without profiles' as description,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL;