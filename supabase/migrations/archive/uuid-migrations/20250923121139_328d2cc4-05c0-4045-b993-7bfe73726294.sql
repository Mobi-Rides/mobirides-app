-- Fix handle_new_user function to properly extract metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_full_name text;
    user_phone_number text;
    user_email text;
BEGIN
    -- Extract user data
    user_email := NEW.email;
    user_full_name := NEW.raw_user_meta_data ->> 'full_name';
    user_phone_number := NEW.raw_user_meta_data ->> 'phone_number';
    
    -- Log the extracted data for debugging
    RAISE LOG 'handle_new_user: Processing user % with email %, full_name %, phone %', 
        NEW.id, user_email, user_full_name, user_phone_number;
    
    -- Insert into profiles with extracted data
    INSERT INTO public.profiles (
        id, 
        full_name, 
        phone_number, 
        email_confirmed,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_full_name,
        user_phone_number,
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        NOW(),
        NOW()
    );
    
    -- Log successful profile creation
    RAISE LOG 'handle_new_user: Successfully created profile for user %', NEW.id;
    
    -- Call edge function to send welcome email (if email exists)
    IF user_email IS NOT NULL THEN
        BEGIN
            -- This will be handled by the resend-service edge function
            RAISE LOG 'handle_new_user: Email service call would be made for %', user_email;
        EXCEPTION WHEN OTHERS THEN
            -- Don't fail the user creation if email fails
            RAISE LOG 'handle_new_user: Email service failed for user %, error: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't prevent user creation
        RAISE LOG 'handle_new_user: Error processing user %, error: %', NEW.id, SQLERRM;
        -- Still return NEW to allow user creation to succeed
        RETURN NEW;
END;
$$;