-- Fix handle_new_user function to use correct enum value
-- The user_role enum has values: host, renter, admin
-- But the function was trying to use 'customer' which doesn't exist

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_full_name text;
    user_phone text;
BEGIN
    -- Extract full_name and phone_number from raw_user_meta_data
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    user_phone := NEW.raw_user_meta_data->>'phone_number';
    
    -- Insert or update profile with correct enum value 'renter'
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        phone_number,
        email_confirmed,
        email_confirmed_at
    )
    VALUES (
        NEW.id,
        'renter'::user_role,  -- Use 'renter' instead of 'customer'
        user_full_name,
        user_phone,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        NEW.email_confirmed_at
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        email_confirmed = EXCLUDED.email_confirmed,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        updated_at = timezone('utc'::text, now());
    
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
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle unique constraint violations gracefully
        RAISE LOG 'Profile already exists for user %', NEW.id;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log other errors but don't fail the user creation
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;