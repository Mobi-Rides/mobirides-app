-- BUG-011: Complete SuperAdmin RPCs
-- Fix log_admin_action signature to match spec and grant EXECUTE to service_role / authenticated.

-- Drop the previous log_admin_action overload that used (text, text, text, jsonb) so only
-- the spec-correct version (uuid, text, uuid, jsonb) remains.
DROP FUNCTION IF EXISTS public.log_admin_action(text, text, text, jsonb);

-- Spec-correct log_admin_action: log_admin_action(admin_id, action, target_id, metadata)
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id  uuid,
  p_action    text,
  p_target_id uuid    DEFAULT NULL,
  p_metadata  jsonb   DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  PERFORM public.log_admin_activity(
    p_admin_id,
    p_action,
    NULL,        -- resource_type (not in spec signature — pass NULL)
    p_target_id, -- resource_id uuid
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

-- -------------------------------------------------------------------------
-- Grant EXECUTE to authenticated (RPCs called directly from the admin panel)
-- -------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.suspend_user(uuid, text, interval)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.ban_user(uuid, text)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_suspend_users(uuid[], text, interval) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_restriction(uuid, text)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_vehicle(uuid, uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(uuid, text, uuid, jsonb)      TO authenticated;

-- -------------------------------------------------------------------------
-- Grant EXECUTE to service_role (backend / cron / edge-function callers)
-- -------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.suspend_user(uuid, text, interval)        TO service_role;
GRANT EXECUTE ON FUNCTION public.ban_user(uuid, text)                       TO service_role;
GRANT EXECUTE ON FUNCTION public.bulk_suspend_users(uuid[], text, interval) TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_restriction(uuid, text)             TO service_role;
GRANT EXECUTE ON FUNCTION public.transfer_vehicle(uuid, uuid, uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_admin_action(uuid, text, uuid, jsonb)      TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_restrictions()                 TO service_role;
