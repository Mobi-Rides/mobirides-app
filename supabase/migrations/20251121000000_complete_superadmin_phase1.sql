-- SuperAdmin Phase 1 Completion Migration
-- Creates missing core tables, policies, and helper functions
-- for the SuperAdmin feature set.

-- Ensure required enums and composite types exist
DO $$
BEGIN
  CREATE TYPE notification_campaign_status AS ENUM (
    'draft',
    'scheduled',
    'in_progress',
    'sent',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE vehicle_transfer_validation_result AS (
    valid boolean,
    warnings text[],
    errors text[]
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Admin capabilities table
CREATE TABLE IF NOT EXISTS public.admin_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability_key text NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_capabilities_admin_key_idx
  ON public.admin_capabilities (admin_id, capability_key);

ALTER TABLE public.admin_capabilities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Admins manage admin_capabilities"
    ON public.admin_capabilities
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DROP TRIGGER IF EXISTS set_admin_capabilities_updated_at ON public.admin_capabilities;
CREATE TRIGGER set_admin_capabilities_updated_at
  BEFORE UPDATE ON public.admin_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vehicle transfers table
CREATE TABLE IF NOT EXISTS public.vehicle_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  from_owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transferred_by uuid NOT NULL REFERENCES auth.users(id),
  transfer_reason text,
  transfer_notes text,
  transferred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS vehicle_transfers_vehicle_id_idx
  ON public.vehicle_transfers (vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_transfers_from_owner_idx
  ON public.vehicle_transfers (from_owner_id);
CREATE INDEX IF NOT EXISTS vehicle_transfers_to_owner_idx
  ON public.vehicle_transfers (to_owner_id);
CREATE INDEX IF NOT EXISTS vehicle_transfers_transferred_at_idx
  ON public.vehicle_transfers (transferred_at DESC);

ALTER TABLE public.vehicle_transfers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Admins can view vehicle_transfers"
    ON public.vehicle_transfers
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Admins can insert vehicle_transfers"
    ON public.vehicle_transfers
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Admins can update vehicle_transfers"
    ON public.vehicle_transfers
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Notification campaigns table
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status notification_campaign_status NOT NULL DEFAULT 'draft',
  target_filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  audience_count integer,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS notification_campaigns_status_idx
  ON public.notification_campaigns (status);
CREATE INDEX IF NOT EXISTS notification_campaigns_schedule_idx
  ON public.notification_campaigns (scheduled_for);
CREATE INDEX IF NOT EXISTS notification_campaigns_created_by_idx
  ON public.notification_campaigns (created_by);

ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Admins manage notification_campaigns"
    ON public.notification_campaigns
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DROP TRIGGER IF EXISTS set_notification_campaigns_updated_at ON public.notification_campaigns;
CREATE TRIGGER set_notification_campaigns_updated_at
  BEFORE UPDATE ON public.notification_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to enforce admin access
CREATE OR REPLACE FUNCTION public.assert_admin(p_require_super_admin boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_is_admin boolean;
  v_is_super_admin boolean := false;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: authentication required' USING ERRCODE = '42501';
  END IF;

  v_is_admin := public.is_admin(v_actor);
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: admin privileges required' USING ERRCODE = '42501';
  END IF;

  IF p_require_super_admin THEN
    BEGIN
      SELECT EXISTS (
        SELECT 1
        FROM public.admins a
        WHERE a.id = v_actor
          AND COALESCE(a.is_super_admin, false) = true
      )
      INTO v_is_super_admin;
    EXCEPTION
      WHEN undefined_table THEN
        -- Fallback: treat admins as super admins if table is unavailable
        v_is_super_admin := true;
    END;

    IF NOT v_is_super_admin THEN
      RAISE EXCEPTION 'Unauthorized: super admin privileges required' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN v_actor;
END;
$$;

-- Suspend user function
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
  v_actor uuid := public.assert_admin(false);
  v_effective_reason text := NULLIF(trim(coalesce(p_reason, '')), '');
  v_ends_at timestamptz;
  v_restriction public.user_restrictions;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'suspend_user: user_id is required';
  END IF;

  PERFORM 1 FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'suspend_user: user not found';
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
      RAISE NOTICE 'suspend_user: failed to update auth.users.banned_until (%).', SQLERRM;
  END;

  -- Log audit event when infrastructure exists
  BEGIN
    PERFORM public.log_audit_event(
      'user_restriction_created',
      'medium',
      v_actor,
      p_user_id,
      NULL,
      NULL,
      NULL,
      NULL,
      jsonb_build_object(
        'restriction_type', 'suspension',
        'reason', COALESCE(v_effective_reason, 'Suspended by administrator'),
        'ends_at', v_ends_at
      ),
      'user',
      p_user_id,
      COALESCE(v_effective_reason, 'Suspended by administrator'),
      NULL,
      ARRAY['user-management', 'suspension']
    );
  EXCEPTION
    WHEN undefined_function THEN
      NULL;
  END;

  RETURN v_restriction;
END;
$$;

-- Ban user function
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
  v_actor uuid := public.assert_admin(false);
  v_effective_reason text := NULLIF(trim(coalesce(p_reason, '')), '');
  v_restriction public.user_restrictions;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'ban_user: user_id is required';
  END IF;

  PERFORM 1 FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ban_user: user not found';
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
      RAISE NOTICE 'ban_user: failed to update auth.users.banned_until (%).', SQLERRM;
  END;

  BEGIN
    PERFORM public.log_audit_event(
      'user_restriction_created',
      'high',
      v_actor,
      p_user_id,
      NULL,
      NULL,
      NULL,
      NULL,
      jsonb_build_object(
        'restriction_type', 'login_block',
        'reason', COALESCE(v_effective_reason, 'Banned by administrator')
      ),
      'user',
      p_user_id,
      COALESCE(v_effective_reason, 'Banned by administrator'),
      NULL,
      ARRAY['user-management', 'ban']
    );
  EXCEPTION
    WHEN undefined_function THEN
      NULL;
  END;

  RETURN v_restriction;
END;
$$;

-- Bulk suspend helper
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
  v_actor uuid := public.assert_admin(false);
  v_target uuid;
  v_restriction public.user_restrictions;
BEGIN
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
        -- Continue with remaining users but surface error via NOTICE
        RAISE NOTICE 'bulk_suspend_users: failed for % (%).', v_target, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Cleanup expired restrictions
CREATE OR REPLACE FUNCTION public.cleanup_expired_restrictions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := public.assert_admin(false);
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
       );
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'cleanup_expired_restrictions: failed to reset auth bans (%).', SQLERRM;
    END;
  END IF;

  RETURN v_rows;
END;
$$;

-- Admin capability fetcher
CREATE OR REPLACE FUNCTION public.get_admin_capabilities(p_admin_id uuid DEFAULT NULL)
RETURNS TABLE (
  capability_key text,
  granted_at timestamptz,
  granted_by uuid,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := public.assert_admin(false);
  v_target uuid := COALESCE(p_admin_id, v_actor);
BEGIN
  RETURN QUERY
  SELECT ac.capability_key,
         ac.granted_at,
         ac.granted_by,
         ac.metadata
    FROM public.admin_capabilities ac
   WHERE ac.admin_id = v_target
   ORDER BY ac.granted_at DESC, ac.capability_key;
END;
$$;

-- Vehicle transfer validation
CREATE OR REPLACE FUNCTION public.validate_vehicle_transfer(
  p_vehicle_id uuid,
  p_from_owner_id uuid,
  p_to_owner_id uuid
)
RETURNS vehicle_transfer_validation_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := public.assert_admin(false);
  v_result vehicle_transfer_validation_result := (true, ARRAY[]::text[], ARRAY[]::text[]);
  v_vehicle_owner uuid;
  v_vehicle_exists boolean;
  v_to_role user_role;
  v_active_bookings integer := 0;
BEGIN
  SELECT owner_id
    INTO v_vehicle_owner
    FROM public.cars
   WHERE id = p_vehicle_id;

  IF NOT FOUND THEN
    v_result.valid := false;
    v_result.errors := array_append(v_result.errors, 'Vehicle does not exist.');
    RETURN v_result;
  END IF;

  IF v_vehicle_owner <> p_from_owner_id THEN
    v_result.valid := false;
    v_result.errors := array_append(v_result.errors, 'Vehicle owner mismatch.');
  END IF;

  IF p_from_owner_id = p_to_owner_id THEN
    v_result.valid := false;
    v_result.errors := array_append(v_result.errors, 'Source and destination owners must differ.');
  END IF;

  SELECT role
    INTO v_to_role
    FROM public.profiles
   WHERE id = p_to_owner_id;

  IF NOT FOUND THEN
    v_result.valid := false;
    v_result.errors := array_append(v_result.errors, 'Target owner profile not found.');
  ELSIF v_to_role <> 'host' THEN
    v_result.warnings := array_append(v_result.warnings, 'Target user is not currently a host.');
  END IF;

  SELECT COUNT(*)
    INTO v_active_bookings
    FROM public.bookings
   WHERE car_id = p_vehicle_id
     AND status IN ('confirmed', 'in_progress');

  IF v_active_bookings > 0 THEN
    v_result.warnings := array_append(
      v_result.warnings,
      format('Vehicle has %s active booking(s). Ensure handover process is coordinated.', v_active_bookings)
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Vehicle transfer execution
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
  v_actor uuid := public.assert_admin(false);
  v_validation vehicle_transfer_validation_result;
  v_transfer public.vehicle_transfers;
  v_reason text := NULLIF(trim(coalesce(p_reason, '')), '');
  v_notes text := NULLIF(trim(coalesce(p_notes, '')), '');
BEGIN
  v_validation := public.validate_vehicle_transfer(p_vehicle_id, p_from_owner_id, p_to_owner_id);

  IF NOT v_validation.valid OR array_length(v_validation.errors, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'transfer_vehicle: validation failed: %', array_to_string(v_validation.errors, '; ');
  END IF;

  UPDATE public.cars
     SET owner_id = p_to_owner_id,
         updated_at = now()
   WHERE id = p_vehicle_id
     AND owner_id = p_from_owner_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer_vehicle: vehicle update failed. Verify ownership before transferring.';
  END IF;

  INSERT INTO public.vehicle_transfers (
    vehicle_id,
    from_owner_id,
    to_owner_id,
    transferred_by,
    transfer_reason,
    transfer_notes,
    metadata
  )
  VALUES (
    p_vehicle_id,
    p_from_owner_id,
    p_to_owner_id,
    v_actor,
    v_reason,
    v_notes,
    jsonb_build_object(
      'warnings', COALESCE(v_validation.warnings, ARRAY[]::text[]),
      'initiated_by', v_actor
    )
  )
  RETURNING * INTO v_transfer;

  -- Optional: invalidate existing restrictions tied to vehicle if any
  BEGIN
    PERFORM public.log_audit_event(
      'vehicle_transfer_completed',
      'medium',
      v_actor,
      p_vehicle_id,
      NULL,
      NULL,
      NULL,
      NULL,
      jsonb_build_object(
        'from_owner_id', p_from_owner_id,
        'to_owner_id', p_to_owner_id,
        'reason', v_reason,
        'notes', v_notes,
        'warnings', COALESCE(v_validation.warnings, ARRAY[]::text[])
      ),
      'vehicle',
      p_vehicle_id,
      COALESCE(v_reason, 'Vehicle transfer initiated by admin'),
      NULL,
      ARRAY['vehicle-management', 'transfer']
    );
  EXCEPTION
    WHEN undefined_function THEN
      NULL;
  END;

  RETURN v_transfer;
END;
$$;

-- Notification campaign validation helper
CREATE OR REPLACE FUNCTION public.validate_notification_campaign(
  p_campaign_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := public.assert_admin(false);
  v_errors text[] := ARRAY[]::text[];
  v_warnings text[] := ARRAY[]::text[];
  v_user_roles text[];
  v_registration_start timestamptz;
  v_registration_end timestamptz;
  v_last_login_days integer;
  v_booking_min integer;
  v_estimated integer := 0;
  v_send_immediately boolean := true;
  v_scheduled_for timestamptz;
BEGIN
  IF p_campaign_data IS NULL OR jsonb_typeof(p_campaign_data) <> 'object' THEN
    v_errors := array_append(v_errors, 'Campaign payload is required.');
    RETURN jsonb_build_object(
      'valid', false,
      'warnings', COALESCE(v_warnings, ARRAY[]::text[]),
      'errors', v_errors,
      'estimated_recipients', 0
    );
  END IF;

  IF NULLIF(trim(coalesce(p_campaign_data->>'name', '')), '') IS NULL THEN
    v_errors := array_append(v_errors, 'Campaign name is required.');
  END IF;

  IF NULLIF(trim(coalesce(p_campaign_data#>>'{content,title}', '')), '') IS NULL THEN
    v_errors := array_append(v_errors, 'Notification title is required.');
  END IF;

  IF NULLIF(trim(coalesce(p_campaign_data#>>'{content,message}', '')), '') IS NULL THEN
    v_errors := array_append(v_errors, 'Notification message is required.');
  END IF;

  v_user_roles := (
    SELECT COALESCE(array_agg(value::text), ARRAY[]::text[])
    FROM jsonb_array_elements_text(
      COALESCE(p_campaign_data#>'{target_audience,user_roles}', '[]'::jsonb)
    ) AS value
  );

  IF array_length(v_user_roles, 1) IS NULL THEN
    v_warnings := array_append(v_warnings, 'No user roles selected. Campaign will include all users.');
  END IF;

  BEGIN
    v_registration_start := NULLIF(p_campaign_data#>>'{target_audience,registration_date_range,start}', '')::timestamptz;
  EXCEPTION
    WHEN others THEN
      v_warnings := array_append(v_warnings, 'Invalid registration start date provided. It will be ignored.');
      v_registration_start := NULL;
  END;

  BEGIN
    v_registration_end := NULLIF(p_campaign_data#>>'{target_audience,registration_date_range,end}', '')::timestamptz;
  EXCEPTION
    WHEN others THEN
      v_warnings := array_append(v_warnings, 'Invalid registration end date provided. It will be ignored.');
      v_registration_end := NULL;
  END;

  BEGIN
    v_last_login_days := NULLIF(p_campaign_data#>>'{target_audience,activity_filters,last_login_days}', '')::integer;
  EXCEPTION
    WHEN others THEN
      v_warnings := array_append(v_warnings, 'Invalid last login filter provided. It will be ignored.');
      v_last_login_days := NULL;
  END;

  BEGIN
    v_booking_min := NULLIF(p_campaign_data#>>'{target_audience,activity_filters,booking_count_min}', '')::integer;
  EXCEPTION
    WHEN others THEN
      v_warnings := array_append(v_warnings, 'Invalid booking count filter provided. It will be ignored.');
      v_booking_min := NULL;
  END;

  BEGIN
    v_send_immediately := COALESCE((p_campaign_data#>>'{schedule,send_immediately}')::boolean, true);
  EXCEPTION
    WHEN others THEN
      v_warnings := array_append(v_warnings, 'Invalid schedule flag provided. Campaign will send immediately.');
      v_send_immediately := true;
  END;

  BEGIN
    v_scheduled_for := NULLIF(p_campaign_data#>>'{schedule,scheduled_date}', '')::timestamptz;
  EXCEPTION
    WHEN others THEN
      v_warnings := array_append(v_warnings, 'Invalid scheduled date provided. It will be ignored.');
      v_scheduled_for := NULL;
  END;

  IF NOT v_send_immediately THEN
    IF v_scheduled_for IS NULL THEN
      v_errors := array_append(v_errors, 'Scheduled campaigns require a scheduled date.');
    ELSIF v_scheduled_for <= now() THEN
      v_warnings := array_append(v_warnings, 'Scheduled time is in the past; campaign will send immediately.');
    END IF;
  END IF;

  WITH base_profiles AS (
    SELECT p.id, p.role, p.created_at
      FROM public.profiles p
  ),
  filtered_profiles AS (
    SELECT bp.id
      FROM base_profiles bp
      LEFT JOIN auth.users u ON u.id = bp.id
      LEFT JOIN (
        SELECT renter_id AS user_id, COUNT(*) AS booking_count
          FROM public.bookings
         GROUP BY renter_id
      ) b ON b.user_id = bp.id
     WHERE (array_length(v_user_roles, 1) IS NULL OR bp.role::text = ANY(v_user_roles))
       AND (v_registration_start IS NULL OR bp.created_at >= v_registration_start)
       AND (v_registration_end IS NULL OR bp.created_at <= v_registration_end)
       AND (v_last_login_days IS NULL OR (u.last_sign_in_at IS NOT NULL AND u.last_sign_in_at >= now() - (v_last_login_days || ' days')::interval))
       AND (v_booking_min IS NULL OR COALESCE(b.booking_count, 0) >= v_booking_min)
  )
  SELECT COUNT(*) INTO v_estimated FROM filtered_profiles;

  RETURN jsonb_build_object(
    'valid', array_length(v_errors, 1) IS NULL,
    'warnings', COALESCE(v_warnings, ARRAY[]::text[]),
    'errors', COALESCE(v_errors, ARRAY[]::text[]),
    'estimated_recipients', v_estimated
  );
END;
$$;

-- Notification campaign creation helper
-- Drop existing function to allow return type change (postgres doesn't allow CREATE OR REPLACE to change return type)
DROP FUNCTION IF EXISTS public.create_notification_campaign(jsonb);

CREATE OR REPLACE FUNCTION public.create_notification_campaign(
  p_campaign_data jsonb
)
RETURNS public.notification_campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := public.assert_admin(false);
  v_record public.notification_campaigns;
  v_validation jsonb;
  v_is_valid boolean;
  v_name text := NULLIF(trim(coalesce(p_campaign_data->>'name', '')), '');
  v_description text := NULLIF(trim(coalesce(p_campaign_data->>'description', '')), '');
  v_target jsonb := COALESCE(p_campaign_data->'target_audience', '{}'::jsonb);
  v_content jsonb := COALESCE(p_campaign_data->'content', '{}'::jsonb);
  v_schedule jsonb := COALESCE(p_campaign_data->'schedule', '{}'::jsonb);
  v_settings jsonb := COALESCE(p_campaign_data->'settings', '{}'::jsonb);
  v_send_immediately boolean := COALESCE((v_schedule->>'send_immediately')::boolean, true);
  v_scheduled_for timestamptz;
  v_status notification_campaign_status := 'draft';
  v_audience_count integer := 0;
BEGIN
  v_validation := public.validate_notification_campaign(p_campaign_data);
  v_is_valid := COALESCE((v_validation->>'valid')::boolean, false);

  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'create_notification_campaign: validation failed %', v_validation->'errors';
  END IF;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'create_notification_campaign: name is required';
  END IF;

  BEGIN
    v_scheduled_for := NULLIF(v_schedule->>'scheduled_date', '')::timestamptz;
  EXCEPTION
    WHEN others THEN
      v_scheduled_for := NULL;
  END;

  IF v_send_immediately THEN
    v_status := 'scheduled';
  ELSIF v_scheduled_for IS NOT NULL THEN
    v_status := 'scheduled';
  ELSE
    v_status := 'draft';
  END IF;

  v_audience_count := COALESCE((v_validation->>'estimated_recipients')::integer, 0);

  INSERT INTO public.notification_campaigns (
    name,
    description,
    status,
    target_filters,
    content,
    scheduled_for,
    created_by,
    audience_count,
    metrics
  )
  VALUES (
    v_name,
    v_description,
    v_status,
    v_target,
    v_content,
    v_scheduled_for,
    v_actor,
    v_audience_count,
    jsonb_build_object(
      'settings', v_settings,
      'schedule', v_schedule,
      'validation', v_validation
    )
  )
  RETURNING * INTO v_record;

  RETURN v_record;
END;
$$;

-- Export user data snapshot
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_is_admin boolean := public.is_admin(v_actor);
  v_profile jsonb;
  v_data jsonb;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'export_user_data: user_id is required';
  END IF;

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'export_user_data: authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT v_is_admin AND v_actor <> p_user_id THEN
    RAISE EXCEPTION 'export_user_data: insufficient permissions' USING ERRCODE = '42501';
  END IF;

  SELECT to_jsonb(p) INTO v_profile
    FROM public.profiles p
   WHERE p.id = p_user_id;

  v_data := jsonb_build_object(
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'cars', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(c))
          FROM public.cars c
         WHERE c.owner_id = p_user_id
      ),
      '[]'::jsonb
    ),
    'bookingsAsRenter', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(b))
          FROM public.bookings b
         WHERE b.renter_id = p_user_id
      ),
      '[]'::jsonb
    ),
    'bookingsForOwnedCars', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(b))
          FROM public.bookings b
         WHERE b.car_id IN (SELECT id FROM public.cars WHERE owner_id = p_user_id)
      ),
      '[]'::jsonb
    ),
    'restrictions', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(r))
          FROM public.user_restrictions r
         WHERE r.user_id = p_user_id
      ),
      '[]'::jsonb
    ),
    'notifications', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(n))
          FROM public.notifications n
         WHERE n.user_id = p_user_id
      ),
      '[]'::jsonb
    )
  );

  RETURN v_data;
END;
$$;


