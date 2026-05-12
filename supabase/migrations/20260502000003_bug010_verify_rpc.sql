-- BUG-010: Verification RPC for automated testing.
-- Checks triggers and orphan count inside the DB (no email or service role needed).
-- Restricted to admin/super_admin callers.

CREATE OR REPLACE FUNCTION public.verify_bug010_fix()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_trigger boolean;
  v_email_trigger   boolean;
  v_orphan_count    bigint;
  v_profile_count   bigint;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  -- Check both triggers exist on auth.users
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger t
    JOIN pg_class  c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
      AND t.tgname = 'on_auth_user_created_profile'
  ) INTO v_profile_trigger;

  SELECT EXISTS(
    SELECT 1 FROM pg_trigger t
    JOIN pg_class  c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
      AND t.tgname = 'on_auth_user_created'
  ) INTO v_email_trigger;

  -- Count orphaned auth.users (no profile row)
  SELECT COUNT(*) INTO v_orphan_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL;

  -- Total profiles
  SELECT COUNT(*) INTO v_profile_count FROM public.profiles;

  RETURN jsonb_build_object(
    'profile_trigger_exists', v_profile_trigger,
    'email_trigger_exists',   v_email_trigger,
    'orphaned_user_count',    v_orphan_count,
    'total_profiles',         v_profile_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_bug010_fix() TO authenticated;
