-- Add welcome email functionality to handle_new_user function
-- This sends a welcome email after successful profile creation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_created BOOLEAN := FALSE;
  email_result JSONB;
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
  
  -- Send welcome email if profile was created successfully
  IF profile_created THEN
    BEGIN
      -- Call the resend-service edge function to send welcome email with rich dynamic data
      SELECT content::jsonb INTO email_result
      FROM http((
        'POST',
        current_setting('app.supabase_url') || '/functions/v1/resend-service',
        ARRAY[
          http_header('Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')),
          http_header('Content-Type', 'application/json')
        ],
        'application/json',
        json_build_object(
          'to', NEW.email,
          'templateId', 'welcome-renter',
          'type', 'welcome_email',
          'dynamicData', json_build_object(
            'user_name', COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            'first_name', NEW.raw_user_meta_data->>'full_name',
            'email', NEW.email,
            'browse_cars_url', 'https://mobirides.com/cars',
            'profile_url', 'https://mobirides.com/profile',
            'community_url', 'https://mobirides.com/community',
            'app_url', 'https://mobirides.com',
            'support_email', 'support@mobirides.com',
            'help_center_url', 'https://mobirides.com/help'
          )
        )::text
      ));
      
      -- Log email sending result
      IF email_result->>'success' = 'true' THEN
        RAISE LOG 'Welcome email sent successfully to % for user %', NEW.email, NEW.id;
      ELSE
        RAISE WARNING 'Failed to send welcome email to % for user %: %', NEW.email, NEW.id, email_result->>'error';
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log email error but don't fail the profile creation
        RAISE WARNING 'Error sending welcome email to % for user %: %', NEW.email, NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists (this should already be created, but just in case)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    RAISE LOG 'Created trigger on_auth_user_created';
  ELSE
    RAISE LOG 'Trigger on_auth_user_created already exists';
  END IF;
END
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and sends welcome email after successful signup';