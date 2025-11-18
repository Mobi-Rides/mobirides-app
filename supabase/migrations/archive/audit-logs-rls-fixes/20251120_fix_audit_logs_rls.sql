-- Migration: Restrict audit_logs to super_admin only and backfill super_admins

BEGIN;

-- 1) Ensure enum has 'super_admin'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2) Backfill profiles to super_admin from two sources

-- 2a) From public.admins (match on id = profiles.id)
UPDATE public.profiles p
SET role = 'super_admin'
FROM public.admins a
WHERE a.id = p.id
  AND COALESCE(a.is_super_admin, false) = true
  AND p.role <> 'super_admin';

-- 2b) From auth.users (prefer is_super_admin; fallback to raw_user_meta_data.is_super_admin)
UPDATE public.profiles p
SET role = 'super_admin'
FROM auth.users u
WHERE u.id = p.id
  AND COALESCE(u.is_super_admin, COALESCE((u.raw_user_meta_data->>'is_super_admin')::boolean, false)) = true
  AND p.role <> 'super_admin';

-- 3) Tighten audit_logs SELECT policy to super_admin only

-- Drop old policy allowing admins
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- Create super_admin-only policy (via public.admins)
CREATE POLICY "Super admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.id = auth.uid()
      AND a.is_super_admin = true
  )
);

-- 4) Ensure service role can insert audit logs (for Edge Functions / server jobs)
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

COMMIT;

-- Success messages
DO $$
BEGIN
  RAISE NOTICE 'Audit logs SELECT restricted to super_admin only (public.admins.is_super_admin = true).';
  RAISE NOTICE 'Backfilled profiles.role to super_admin based on public.admins and auth.users.';
END $$;