-- Introspection: Diagnose potential RLS recursion involving public.messages and storage.objects
-- Usage: Run in Supabase SQL editor or psql to inspect current policies/functions

-- 1) List policies on public.messages and storage.objects with full expressions
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE (schemaname = 'public' AND tablename = 'messages')
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, policyname;

-- 2) Detect function calls present in policy expressions (heuristic regex)
SELECT 
  schemaname, tablename, policyname, cmd,
  qual,
  with_check,
  CASE WHEN qual ~ '\\w+\\s*\\(' THEN 'Function call detected in USING' ELSE 'No functions in USING' END AS using_fn_status,
  CASE WHEN with_check ~ '\\w+\\s*\\(' THEN 'Function call detected in WITH CHECK' ELSE 'No functions in WITH CHECK' END AS check_fn_status
FROM pg_policies
WHERE (schemaname = 'public' AND tablename = 'messages')
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, policyname;

-- 3) Show definitions for potentially involved helper functions
-- Adjust function list if your policies reference other functions
SELECT n.nspname AS schema_name, p.proname AS function_name, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public','storage')
  AND p.proname IN (
    'is_admin', 'user_owns_verification', 'foldername'
  )
ORDER BY n.nspname, p.proname;

-- 4) Quick checks: verify simple, self-contained policy forms
-- Messages policies should only reference auth.uid(), sender_id/receiver_id, and public.admins
SELECT policyname, qual FROM pg_policies WHERE schemaname='public' AND tablename='messages';

-- Storage policies should only reference auth.uid(), bucket_id, and storage.foldername(name)
SELECT policyname, qual FROM pg_policies WHERE schemaname='storage' AND tablename='objects';

-- 5) Permissions sanity: ensure authenticated can read public.admins for admin checks
-- (Run if admin policies reference public.admins)
-- GRANT SELECT ON public.admins TO authenticated;