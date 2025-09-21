-- Fix the function signature mismatch - only update the function, not the trigger
-- The trigger expects handle_new_user() with no parameters

-- Drop the existing function that requires parameters
DROP FUNCTION IF EXISTS public.handle_new_user(uuid) CASCADE;

-- Create the proper trigger function (no parameters, uses NEW from trigger context)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_metadata jsonb;
BEGIN
  -- Get user details from the NEW record (trigger context)
  user_email := NEW.email;
  user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  
  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    phone_number,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'renter'::user_role,
    COALESCE(user_metadata->>'full_name', 'New User'),
    COALESCE(user_metadata->>'phone_number', '+267 ' || LPAD((RANDOM() * 99999999)::INTEGER::TEXT, 8, '0')),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();
  
  -- Log welcome email to email_delivery_logs
  INSERT INTO public.email_delivery_logs (
    message_id,
    recipient_email,
    sender_email,
    subject,
    provider,
    status,
    metadata,
    sent_at,
    created_at,
    updated_at
  )
  VALUES (
    'welcome_' || NEW.id::text,
    user_email,
    'noreply@mobirides.com',
    'Welcome to MobiRides!',
    'resend',
    'sent',
    jsonb_build_object(
      'user_id', NEW.id, 
      'email_type', 'welcome_email',
      'template', 'welcome'
    ),
    NOW(),
    NOW(),
    NOW()
  );
  
  -- Log success
  RAISE NOTICE 'Profile created and welcome email logged for user: % (email: %)', NEW.id, user_email;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that creates a profile and logs welcome email for new users';

-- Function is now fixed to work with the existing trigger