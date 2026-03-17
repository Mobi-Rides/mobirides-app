-- Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clear existing test users to avoid conflicts
DELETE FROM auth.users WHERE email = 'duma@mobirides.africa';

-- Create a test user with a confirmed email and valid password hash
-- We include empty strings for string columns to avoid GoTrue NULL conversion errors
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    role,
    is_super_admin,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    phone_change_token,
    reauthentication_token,
    email_change_token_current,
    phone
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'duma@mobirides.africa',
    crypt('mushr00m', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Duma Mtungwa"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    false,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    NULL
);

-- Ensure the user has a profile
INSERT INTO public.profiles (
    id, 
    full_name, 
    role,
    created_at,
    updated_at,
    verification_status
)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'Duma Mtungwa', 
    'renter',
    now(),
    now(),
    'not_started'
)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    role = EXCLUDED.role,
    updated_at = now();
