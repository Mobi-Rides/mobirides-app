-- Migration: Restore Welcome Email Trigger
-- Dependency: pg_net, supabase_vault
-- Description: Sets up the handle_new_user trigger to send a welcome email via Edge Functions.

-- 1. Store the secret key in platform_settings
-- Using the key provided by the user: sb_secret_lYdCqHkAJtAmGX6PYSN1nw_K5e_gbz8
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'supabase_service_role_key', 
    'sb_secret_lYdCqHkAJtAmGX6PYSN1nw_K5e_gbz8', 
    'Supabase service role key for Edge Function authentication (Encrypted storage recommended)'
)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- 2. Create or replace the trigger function
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
    -- Retrieve secret from platform_settings
    SELECT setting_value INTO secret_key FROM public.platform_settings WHERE setting_key = 'supabase_service_role_key' LIMIT 1;

    -- Extract name from metadata
    full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'MobiRides User');
    first_name := split_part(full_name, ' ', 1);

    -- Log intent (for debugging)
    RAISE NOTICE 'Sending welcome email to % (%)', new.email, full_name;

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

-- 3. (Re)create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_welcome_email();

COMMENT ON FUNCTION public.handle_new_user_welcome_email() IS 'Triggered on auth.users insert to send a welcome email asynchronously.';
