-- Check if test user exists and their status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  confirmed_at
FROM auth.users 
WHERE email = 'test@mobirides.com';

-- Also check the corresponding profile
SELECT 
  p.id,
  p.role,
  p.full_name,
  p.email_confirmed,
  p.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'test@mobirides.com';