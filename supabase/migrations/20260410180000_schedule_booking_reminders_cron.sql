-- S10-014/15: Schedule booking reminders cron job
-- Calls the booking-reminders edge function every 15 minutes to catch 2h, 30m, and 4h reminders,
-- and the edge function itself restricts the 24h reminders to the 06:00 UTC (08:00 SAST) hour block.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('booking-reminders-job');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'booking-reminders-job',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/booking-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
