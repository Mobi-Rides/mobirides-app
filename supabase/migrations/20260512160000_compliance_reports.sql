-- supabase/migrations/20260512160000_compliance_reports.sql
-- T4.3: Automated Compliance Reporting
-- Creates compliance_reports tracking table, get_audit_logs_for_month RPC,
-- and a monthly pg_cron job to auto-generate reports.

BEGIN;

-- ── compliance_reports: tracks every generated compliance report ──────────────
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month           date        NOT NULL,
  storage_path           text,
  public_key_fingerprint text        NOT NULL,
  signature_b64          text,
  generated_by           uuid        REFERENCES auth.users(id),
  generated_at           timestamptz NOT NULL DEFAULT now(),
  record_count           int         NOT NULL DEFAULT 0,
  status                 text        NOT NULL DEFAULT 'completed',
  error_details          text,
  CONSTRAINT compliance_reports_status_check CHECK (status IN ('completed', 'failed')),
  UNIQUE (report_month)
);

ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

-- SuperAdmins can read reports
CREATE POLICY "superadmins_read_compliance_reports"
  ON public.compliance_reports FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Only service_role can insert/update (cron + edge function)
CREATE POLICY "service_role_manage_compliance_reports"
  ON public.compliance_reports FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── get_audit_logs_for_month: query admin actions for a calendar month ────────
CREATE OR REPLACE FUNCTION public.get_audit_logs_for_month(month date)
RETURNS SETOF public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT al.*
  FROM public.audit_logs al
  JOIN public.profiles p ON p.id = al.actor_id
  WHERE al.event_timestamp >= date_trunc('month', month::timestamptz)
    AND al.event_timestamp <  date_trunc('month', month::timestamptz) + INTERVAL '1 month'
    AND p.role IN ('admin', 'superadmin')
  ORDER BY al.event_timestamp ASC;
END;
$$;

-- Only callable by service_role (edge function uses service key)
REVOKE ALL ON FUNCTION public.get_audit_logs_for_month(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_audit_logs_for_month(date) TO service_role;

-- ── pg_cron: monthly schedule (requires pg_cron + pg_net extensions) ──────────
-- Run on the 1st of each month at 09:00 UTC.
-- SETUP REQUIRED: Before enabling, set your project's Edge Function URL and
-- service role key below. The pg_net extension must be enabled in Supabase.
-- To enable this schedule, run the DO block manually after deployment.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'monthly-compliance-report',
      '0 9 1 * *',
      $cron$
      SELECT net.http_post(
        url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/compliance-report',
        headers := jsonb_build_object(
          'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
          'Content-Type',  'application/json'
        ),
        body    := '{}'::jsonb
      ) AS request_id;
      $cron$
    );
    RAISE NOTICE 'pg_cron job scheduled: monthly-compliance-report';
  ELSE
    RAISE NOTICE 'pg_cron not available — schedule monthly-compliance-report manually';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END;
$$;

COMMIT;
