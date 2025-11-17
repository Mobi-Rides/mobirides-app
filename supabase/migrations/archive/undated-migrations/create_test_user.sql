-- Create a test user for sign-in testing
-- This user will have email confirmation enabled

-- Insert into auth.users table
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'test@mobirides.com',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Test User"}',
  'authenticated',
  'authenticated'
);

-- Insert corresponding profile
INSERT INTO public.profiles (
  id,
  role,
  full_name,
  email_confirmed,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@mobirides.com'),
  'renter',
  'Test User',
  true,
  now(),
  now(),
  now()
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;