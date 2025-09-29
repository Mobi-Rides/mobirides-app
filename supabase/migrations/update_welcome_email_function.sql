-- Update welcome email function to log directly to email_delivery_logs table
-- This version doesn't rely on external HTTP calls and edge functions

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_created BOOLEAN := FALSE;
BEGIN
  -- Insert a new profile record for the new user with phone_number
  BEGIN
    INSERT INTO public.profiles (id, role, full_name, phone_number, created_at, updated_at)
    VALUES (
      NEW.id,
      'renter'::user_role,  -- Default role
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),  -- Use full_name from metadata or email as fallback
      NEW.raw_user_meta_data->>'phone_number',  -- Get phone_number from signup metadata
      NOW(),
      NOW()
    );
    
    profile_created := TRUE;
    RAISE LOG 'Profile created successfully for user %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, ignore the error
      RAISE LOG 'Profile already exists for user %', NEW.id;
      RETURN NEW;
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
      RETURN NEW;
  END;
  
  -- Log welcome email to email_delivery_logs table if profile was created successfully
  IF profile_created THEN
    BEGIN
      INSERT INTO public.email_delivery_logs (
        recipient_email,
        email_type,
        subject,
        provider,
        status,
        sent_at,
        created_at,
        updated_at
      ) VALUES (
        NEW.email,
        'welcome_email',
        'Welcome to MobiRides!',
        'resend',
        'pending',  -- Mark as pending since we're not actually sending yet
        NOW(),
        NOW(),
        NOW()
      );
      
      RAISE LOG 'Welcome email logged for user % with email %', NEW.id, NEW.email;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log email error but don't fail the profile creation
        RAISE WARNING 'Error logging welcome email for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and logs welcome email to email_delivery_logs table after successful signup';