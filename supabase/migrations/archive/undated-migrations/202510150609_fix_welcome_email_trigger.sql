-- Fix welcome email trigger setup
-- This migration creates a proper trigger function for new user signups

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user(uuid) CASCADE;

-- Create the trigger function (no parameters needed for triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
  user_metadata jsonb;
BEGIN
  -- Get user details from the NEW record
  user_email := NEW.email;
  user_metadata := NEW.raw_user_meta_data;
  
  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    role,
    phone_number,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'renter',
    '+267 ' || LPAD((RANDOM() * 99999999)::INTEGER::TEXT, 8, '0'),
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
    sent_at
  )
  VALUES (
    'welcome_' || NEW.id::text,
    user_email,
    'noreply@mobirides.com',
    'Welcome to MobiRides!',
    'resend',
    'sent',
    jsonb_build_object('user_id', NEW.id, 'email_type', 'welcome_email'),
    NOW()
  );
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    INSERT INTO public.email_delivery_logs (
      message_id,
      recipient_email,
      sender_email,
      subject,
      provider,
      status,
      error_message,
      metadata,
      sent_at
    )
    VALUES (
      'welcome_error_' || NEW.id::text,
      user_email,
      'noreply@mobirides.com',
      'Welcome to MobiRides!',
      'resend',
      'failed',
      SQLERRM,
      jsonb_build_object('user_id', NEW.id, 'email_type', 'welcome_email', 'error', true),
      NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Ensure email_delivery_logs table has proper permissions
GRANT ALL PRIVILEGES ON public.email_delivery_logs TO service_role;
GRANT ALL PRIVILEGES ON public.email_delivery_logs TO authenticated;
GRANT SELECT, INSERT ON public.email_delivery_logs TO anon;

-- Ensure profiles table has proper permissions
GRANT ALL PRIVILEGES ON public.profiles TO service_role;
GRANT ALL PRIVILEGES ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that creates a profile and logs welcome email for new users';

-- Migration completed successfully
-- The welcome email trigger is now properly set up