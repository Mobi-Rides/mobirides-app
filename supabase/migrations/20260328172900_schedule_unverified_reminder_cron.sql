-- S9-015 / MOB-806: Schedule daily unverified-user reminder cron job
-- Calls the unverified-reminder edge function every day at 08:00 UTC

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('unverified-reminder-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'unverified-reminder-daily',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/unverified-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
