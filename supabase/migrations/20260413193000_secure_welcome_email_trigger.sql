-- Migration: Restore Welcome Email Trigger (Secure Version)
-- Description: Sets up the handle_new_user trigger to send a welcome email via Edge Functions.
-- Dependencies: pg_net, supabase_vault
-- Note: This migration assumes 'supabase_service_role_key' is already present in vault.secrets.

-- 1. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    secret_key TEXT;
    project_url TEXT := 'https://putjowciegpzdheideaf.supabase.co';
    full_name TEXT;
    first_name TEXT;
BEGIN
    -- Retrieve secret from Supabase Vault (Securely)
    SELECT decrypted_secret INTO secret_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'supabase_service_role_key' 
    LIMIT 1;

    IF secret_key IS NULL THEN
        RAISE WARNING 'supabase_service_role_key not found in vault.secrets. Skipping welcome email.';
        RETURN new;
    END IF;

    -- Extract name from metadata
    full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'MobiRides User');
    first_name := split_part(full_name, ' ', 1);

    -- Enqueue asynchronous HTTP request via pg_net
    PERFORM net.http_post(
        url := project_url || '/functions/v1/resend-service',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || secret_key
        ),
        body := jsonb_build_object(
            'to', new.email,
            'templateId', 'welcome-renter',
            'templateData', jsonb_build_object(
                'user_name', full_name,
                'first_name', first_name,
                'email', new.email
            ),
            'subject', 'Welcome to MobiRides! 🚗'
        )
    );

    RETURN new;
END;
$$;

-- 2. (Re)create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_welcome_email();

COMMENT ON FUNCTION public.handle_new_user_welcome_email() IS 'Securely sends a welcome email via Edge Functions using Vault secrets.';
