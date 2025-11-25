-- Fix Profile Data Transfer Issue
-- Update handle_new_user function to properly extract data from raw_user_meta_data
-- Remove random phone number generation and use actual signup data

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the corrected trigger function that properly uses user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_metadata jsonb;
  extracted_full_name text;
  extracted_phone_number text;
BEGIN
  -- Get user details from the NEW record (trigger context)
  user_email := NEW.email;
  user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  
  -- Extract data from user metadata with proper fallbacks
  extracted_full_name := COALESCE(
    user_metadata->>'full_name',
    split_part(user_email, '@', 1) -- Use email username as fallback
  );
  
  extracted_phone_number := user_metadata->>'phone_number';
  
  -- Create or update profile with actual signup data
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
    extracted_full_name,
    extracted_phone_number, -- Use actual phone number or NULL if not provided
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
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
      'template', 'welcome',
      'full_name', extracted_full_name,
      'phone_number', extracted_phone_number
    ),
    NOW(),
    NOW(),
    NOW()
  );
  
  -- Log success with extracted data
  RAISE NOTICE 'Profile created for user: % (email: %, full_name: %, phone: %)', 
    NEW.id, user_email, extracted_full_name, extracted_phone_number;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Handle unique constraint violations gracefully
    RAISE WARNING 'Unique violation in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
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
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that creates a profile with actual signup data and logs welcome email for new users';

-- Recreate the trigger to ensure it's properly connected
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment to trigger
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger that creates profile and sends welcome email when new user is created';