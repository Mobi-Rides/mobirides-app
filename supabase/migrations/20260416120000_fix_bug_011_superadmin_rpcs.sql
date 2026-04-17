-- BUG-011: Restore missing SuperAdmin Core Logic Functions (RPCs)
-- Reference: docs/testing & bugs/BUG_REPORT.md
-- Priority: Medium

-- 1. Restore suspend_user
CREATE OR REPLACE FUNCTION public.suspend_user(
  p_user_id uuid,
  p_reason text,
  p_duration interval DEFAULT interval '7 days'
)
RETURNS public.user_restrictions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_effective_reason text := NULLIF(trim(coalesce(p_reason, '')), '');
  v_ends_at timestamptz;
  v_restriction public.user_restrictions;
BEGIN
  -- Basic security check (must be admin)
  IF NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'suspend_user: user_id is required';
  END IF;

  -- Deactivate existing active restrictions
  UPDATE public.user_restrictions
     SET active = false,
         updated_at = now()
   WHERE user_id = p_user_id
     AND active = true;

  IF p_duration IS NULL OR p_duration <= interval '0' THEN
    v_ends_at := NULL;
  ELSE
    v_ends_at := now() + p_duration;
  END IF;

  INSERT INTO public.user_restrictions (
    user_id,
    restriction_type,
    reason,
    active,
    starts_at,
    ends_at,
    created_by
  )
  VALUES (
    p_user_id,
    'suspension',
    COALESCE(v_effective_reason, 'Suspended by administrator'),
    true,
    now(),
    v_ends_at,
    v_actor
  )
  RETURNING * INTO v_restriction;

  -- Attempt to set Supabase Auth ban window for consistency
  BEGIN
    UPDATE auth.users
       SET banned_until = v_ends_at
     WHERE id = p_user_id;
  EXCEPTION
    WHEN others THEN
      NULL; -- Ignore if auth schema access is limited
  END;

  -- Log admin activity
  PERFORM public.log_admin_activity(
    v_actor,
    'user_suspended',
    'user',
    p_user_id,
    jsonb_build_object('reason', v_effective_reason, 'ends_at', v_ends_at)
  );

  RETURN v_restriction;
END;
$$;

-- 2. Restore ban_user
CREATE OR REPLACE FUNCTION public.ban_user(
  p_user_id uuid,
  p_reason text
)
RETURNS public.user_restrictions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_effective_reason text := NULLIF(trim(coalesce(p_reason, '')), '');
  v_restriction public.user_restrictions;
BEGIN
  -- Basic security check (must be admin)
  IF NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'ban_user: user_id is required';
  END IF;

  UPDATE public.user_restrictions
     SET active = false,
         updated_at = now()
   WHERE user_id = p_user_id
     AND active = true;

  INSERT INTO public.user_restrictions (
    user_id,
    restriction_type,
    reason,
    active,
    starts_at,
    ends_at,
    created_by
  )
  VALUES (
    p_user_id,
    'login_block',
    COALESCE(v_effective_reason, 'Banned by administrator'),
    true,
    now(),
    NULL,
    v_actor
  )
  RETURNING * INTO v_restriction;

  BEGIN
    UPDATE auth.users
       SET banned_until = 'infinity'
     WHERE id = p_user_id;
  EXCEPTION
    WHEN others THEN
      NULL;
  END;

  PERFORM public.log_admin_activity(
    v_actor,
    'user_banned',
    'user',
    p_user_id,
    jsonb_build_object('reason', v_effective_reason)
  );

  RETURN v_restriction;
END;
$$;

-- 3. Restore bulk_suspend_users
CREATE OR REPLACE FUNCTION public.bulk_suspend_users(
  p_user_ids uuid[],
  p_reason text,
  p_duration interval DEFAULT interval '7 days'
)
RETURNS TABLE (
  user_id uuid,
  restriction_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_target uuid;
  v_restriction public.user_restrictions;
BEGIN
  IF NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'bulk_suspend_users: user_ids array required';
  END IF;

  FOREACH v_target IN ARRAY p_user_ids LOOP
    BEGIN
      v_restriction := public.suspend_user(v_target, p_reason, p_duration);
      user_id := v_target;
      restriction_id := v_restriction.id;
      RETURN NEXT;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'bulk_suspend_users: failed for % (%).', v_target, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- 4. Implement remove_restriction
CREATE OR REPLACE FUNCTION public.remove_restriction(
  p_restriction_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_user_id uuid;
BEGIN
  IF NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.user_restrictions
     SET active = false,
         updated_at = now()
   WHERE id = p_restriction_id
  RETURNING user_id INTO v_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if there are other active restrictions for this user
  IF NOT EXISTS (SELECT 1 FROM public.user_restrictions WHERE user_id = v_user_id AND active = true) THEN
    BEGIN
      UPDATE auth.users
         SET banned_until = NULL
       WHERE id = v_user_id;
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
  END IF;

  PERFORM public.log_admin_activity(
    v_actor,
    'restriction_removed',
    'user',
    v_user_id,
    jsonb_build_object('restriction_id', p_restriction_id, 'reason', p_reason)
  );

  RETURN true;
END;
$$;

-- 5. Restore transfer_vehicle
CREATE OR REPLACE FUNCTION public.transfer_vehicle(
  p_vehicle_id uuid,
  p_from_owner_id uuid,
  p_to_owner_id uuid,
  p_reason text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.vehicle_transfers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_transfer public.vehicle_transfers;
BEGIN
  IF NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  -- Perform transfer
  UPDATE public.cars
     SET owner_id = p_to_owner_id,
         updated_at = now()
   WHERE id = p_vehicle_id
     AND owner_id = p_from_owner_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer_vehicle: vehicle update failed. Verify ownership before transferring.';
  END IF;

  -- Record transfer
  INSERT INTO public.vehicle_transfers (
    vehicle_id,
    from_owner_id,
    to_owner_id,
    transferred_by,
    transfer_reason,
    transfer_notes
  )
  VALUES (
    p_vehicle_id,
    p_from_owner_id,
    p_to_owner_id,
    v_actor,
    p_reason,
    p_notes
  )
  RETURNING * INTO v_transfer;

  PERFORM public.log_admin_activity(
    v_actor,
    'vehicle_transferred',
    'vehicle',
    p_vehicle_id,
    jsonb_build_object(
      'from_owner_id', p_from_owner_id,
      'to_owner_id', p_to_owner_id,
      'reason', p_reason
    )
  );

  RETURN v_transfer;
END;
$$;

-- 6. Implement log_admin_action (alias to log_admin_activity)
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  PERFORM public.log_admin_activity(
    v_actor,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$$;

-- 7. Restore cleanup_expired_restrictions
CREATE OR REPLACE FUNCTION public.cleanup_expired_restrictions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.user_restrictions
     SET active = false,
         updated_at = now()
   WHERE active = true
     AND ends_at IS NOT NULL
     AND ends_at <= now();

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows > 0 THEN
    BEGIN
      UPDATE auth.users
         SET banned_until = NULL
       WHERE id IN (
         SELECT DISTINCT user_id
         FROM public.user_restrictions
         WHERE active = false
           AND ends_at IS NOT NULL
           AND ends_at <= now()
           AND user_id NOT IN (SELECT user_id FROM public.user_restrictions WHERE active = true)
       );
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
  END IF;

  RETURN v_rows;
END;
$$;
