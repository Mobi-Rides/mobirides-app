-- Migration: Fix audit logs RLS policy - version 2
-- Properly restrict INSERT to service role only

BEGIN;

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;

-- Create a more restrictive INSERT policy that only allows the service role
-- The service role is used by edge functions and the log_audit_event RPC function
CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Audit logs RLS policy updated!';
    RAISE NOTICE 'Changes:';
    RAISE NOTICE '  - Restricted INSERT policy to service_role only';
END $$;
