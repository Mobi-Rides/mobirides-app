-- MOBI-502-3: Secure admin activity logs RLS with explicit admin check

-- Replace analytics/admin read policy to use public.is_admin()
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'audit_logs' 
      AND policyname = 'Admins can view audit logs'
  ) THEN
    DROP POLICY "Admins can view audit logs" ON public.audit_logs;
  END IF;

  CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());
END $$;

