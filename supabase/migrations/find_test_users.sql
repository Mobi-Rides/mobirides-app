-- Find test users and sample emails
SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email ILIKE '%test%' 
   OR email ILIKE '%example%'
   OR email ILIKE '%demo%'
ORDER BY created_at DESC;

-- Also get a few sample users to see what's in the database
SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users 
WHERE email IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;