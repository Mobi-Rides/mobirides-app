-- Check if test user was registered
SELECT 
  email,
  full_name,
  phone_number,
  created_at,
  expires_at
FROM pending_confirmations 
WHERE email = 'test@example.com'
ORDER BY created_at DESC;

-- Also check Supabase Auth users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'test@example.com'
ORDER BY created_at DESC;