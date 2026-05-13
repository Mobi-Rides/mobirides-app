-- supabase/migrations/20260513000000_session_anomaly_detection.sql
-- T2.1: Session Anomaly Detection
-- Creates user_login_events, session_anomalies tables and pg_cron auto-suspend job.

BEGIN;

-- ── user_login_events ─────────────────────────────────────────────────────────
CREATE TABLE public.user_login_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address    inet,
  country_code  text,
  country       text,
  city          text,
  lat           numeric(9,6),
  lon           numeric(9,6),
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_login_events_user_id_created
  ON public.user_login_events(user_id, created_at DESC);

ALTER TABLE public.user_login_events ENABLE ROW LEVEL SECURITY;

-- Service role only INSERT (edge function uses service role client)
CREATE POLICY "service_role_insert_login_events"
  ON public.user_login_events FOR INSERT TO service_role
  WITH CHECK (true);

-- SuperAdmins can SELECT
CREATE POLICY "superadmins_read_login_events"
  ON public.user_login_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ── session_anomalies ─────────────────────────────────────────────────────────
CREATE TABLE public.session_anomalies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_type           text NOT NULL CHECK (
    risk_type IN ('impossible_travel','concurrent_countries','brute_force')
  ),
  confidence          text NOT NULL CHECK (confidence IN ('low','medium','high')),
  details             jsonb NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','reviewed','auto_suspended','dismissed')
  ),
  reviewed_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at         timestamptz,
  auto_suspend_after  timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_anomalies_status
  ON public.session_anomalies(status, auto_suspend_after);

CREATE INDEX idx_session_anomalies_user_id
  ON public.session_anomalies(user_id, created_at DESC);

ALTER TABLE public.session_anomalies ENABLE ROW LEVEL SECURITY;

-- SuperAdmins SELECT
CREATE POLICY "superadmins_read_session_anomalies"
  ON public.session_anomalies FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- SuperAdmins UPDATE (for review actions via dashboard)
CREATE POLICY "superadmins_update_session_anomalies"
  ON public.session_anomalies FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Service role full access (edge function auto-suspend pipeline)
CREATE POLICY "service_role_manage_session_anomalies"
  ON public.session_anomalies FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── pg_cron auto-suspend job (runs every 15 minutes) ─────────────────────────
-- Calls session-monitor edge function with action=process_auto_suspensions

-- SETUP REQUIRED: Set these PostgreSQL database settings before the cron job fires:
--   ALTER DATABASE postgres SET "app.supabase_url" = 'https://<project>.supabase.co';
--   ALTER DATABASE postgres SET "app.service_role_key" = '<service_role_key>';
-- Without these, the cron job will call the edge function with an empty Authorization header.

DO $cron_block$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('session-anomaly-auto-suspend');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'session-anomaly-auto-suspend',
      '*/15 * * * *',
      $$
        SELECT net.http_post(
          url := current_setting('app.supabase_url') || '/functions/v1/session-monitor',
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
            'Content-Type', 'application/json'
          ),
          body := '{"action":"process_auto_suspensions"}'::jsonb
        );
      $$
    );
  ELSE
    RAISE NOTICE 'pg_cron not available — schedule session-anomaly-auto-suspend manually';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END;
$cron_block$;

COMMIT;
