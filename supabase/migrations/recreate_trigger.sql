-- Recreate the trigger to ensure it's properly configured
-- First, drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Ensure the function exists with correct implementation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_full_name text;
    user_phone text;
BEGIN
    -- Log that the trigger is firing
    RAISE LOG 'handle_new_user trigger fired for user: %', NEW.id;
    
    -- Extract full_name and phone_number from raw_user_meta_data
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    user_phone := NEW.raw_user_meta_data->>'phone_number';
    
    -- Log extracted data
    RAISE LOG 'Extracted data - name: %, phone: %', user_full_name, user_phone;
    
    -- Insert profile with correct enum value 'renter'
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        phone_number,
        email_confirmed,
        email_confirmed_at,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        'renter'::user_role,
        user_full_name,
        user_phone,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        NEW.email_confirmed_at,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        email_confirmed = EXCLUDED.email_confirmed,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        updated_at = timezone('utc'::text, now());
    
    RAISE LOG 'Profile created/updated for user: %', NEW.id;
    
    -- Log welcome email
    INSERT INTO public.email_delivery_logs (
        user_id,
        email_type,
        recipient_email,
        status,
        created_at
    )
    VALUES (
        NEW.id,
        'welcome',
        NEW.email,
        'pending',
        timezone('utc'::text, now())
    );
    
    RAISE LOG 'Email log created for user: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle unique constraint violations gracefully
        RAISE LOG 'Profile already exists for user %, updating...', NEW.id;
        
        UPDATE public.profiles SET
            full_name = user_full_name,
            phone_number = user_phone,
            email_confirmed = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
            email_confirmed_at = NEW.email_confirmed_at,
            updated_at = timezone('utc'::text, now())
        WHERE id = NEW.id;
        
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log other errors but don't fail the user creation
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- Ensure the function can access the tables
GRANT INSERT, UPDATE ON public.profiles TO service_role;
GRANT INSERT ON public.email_delivery_logs TO service_role;

-- Also grant to the function's security definer context
GRANT INSERT, UPDATE ON public.profiles TO postgres;
GRANT INSERT ON public.email_delivery_logs TO postgres;