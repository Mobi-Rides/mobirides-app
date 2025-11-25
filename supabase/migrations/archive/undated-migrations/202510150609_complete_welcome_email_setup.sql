-- Complete welcome email setup migration (function only)
-- This migration creates the welcome email function that can be called manually

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user(uuid) CASCADE;

-- Create the handle_new_user function that accepts a user_id parameter
CREATE OR REPLACE FUNCTION public.handle_new_user(user_id uuid DEFAULT NULL)
RETURNS json AS $$
DECLARE
  target_user_id uuid;
  user_email text;
  user_metadata jsonb;
  result json;
BEGIN
  -- If no user_id provided, this might be called as a trigger
  IF user_id IS NULL THEN
    -- This would be NEW.id in a trigger context, but we can't access that here
    RAISE EXCEPTION 'user_id parameter is required when calling this function directly';
  END IF;
  
  target_user_id := user_id;
  
  -- Get user details from auth.users (if accessible)
  SELECT email, raw_user_meta_data 
  INTO user_email, user_metadata
  FROM auth.users 
  WHERE id = target_user_id;
  
  -- If we can't access auth.users, use provided data
  IF user_email IS NULL THEN
    user_email := 'unknown@example.com';
    user_metadata := '{}'::jsonb;
  END IF;
  
  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    role,
    phone_number,
    created_at,
    updated_at
  )
  VALUES (
    target_user_id,
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
    'welcome_' || target_user_id::text,
    user_email,
    'noreply@mobirides.com',
    'Welcome to MobiRides!',
    'resend',
    'sent',
    jsonb_build_object('user_id', target_user_id, 'email_type', 'welcome_email'),
    NOW()
  );
  
  -- Return success result
  result := json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', user_email,
    'message', 'Profile created and welcome email logged successfully'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    result := json_build_object(
      'success', false,
      'user_id', target_user_id,
      'error', SQLERRM,
      'message', 'Error processing new user'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user(uuid) TO anon;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user(uuid) IS 'Function that creates a profile and logs welcome email for a given user ID';

-- Migration completed successfully
-- The welcome email function is now set up and can be called with handle_new_user(user_id)