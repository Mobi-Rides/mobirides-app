-- Preservation Migration: Restore production tables and functions
-- This ensures critical production features aren't dropped during sync
-- To use: Copy this file to supabase/migrations/20251126140000_preserve_production_features.sql

-- ============================================================================
-- TABLES
-- ============================================================================

-- Restore admin_capabilities table
CREATE TABLE IF NOT EXISTS public.admin_capabilities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    capability text NOT NULL,
    granted_by uuid REFERENCES public.admins(id),
    granted_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_capabilities_admin_key_idx ON public.admin_capabilities(admin_id, capability);

-- Restore notification_campaigns table
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_by uuid REFERENCES public.admins(id),
    target_audience jsonb NOT NULL DEFAULT '{}'::jsonb,
    notification_template jsonb NOT NULL,
    schedule_type text CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
    scheduled_at timestamp with time zone,
    recurrence_rule text,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'cancelled')),
    sent_count integer DEFAULT 0,
    total_recipients integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Restore notification_logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
    type text NOT NULL CHECK (type IN ('booking_request', 'booking_confirmed', 'booking_cancelled', 'wallet_topup', 'wallet_deduction', 'payment_received', 'system_notification')),
    status text NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'read')),
    title text,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    sent_at timestamp with time zone,
    read_at timestamp with time zone,
    error_message text,
    retry_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Restore vehicle_transfers table
CREATE TABLE IF NOT EXISTS public.vehicle_transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    from_owner_id uuid NOT NULL REFERENCES public.profiles(id),
    to_owner_id uuid NOT NULL REFERENCES public.profiles(id),
    transferred_by uuid REFERENCES public.admins(id),
    transfer_reason text NOT NULL,
    transfer_notes text,
    transfer_date timestamp with time zone DEFAULT timezone('utc'::text, now()),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
    approval_notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    completed_at timestamp with time zone
);

-- Restore notifications_backup2 table (if not exists)
CREATE TABLE IF NOT EXISTS public.notifications_backup2 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    description text,
    related_booking_id uuid REFERENCES public.bookings(id),
    related_car_id uuid REFERENCES public.cars(id),
    is_read boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Host wallets constraints
DO $$ BEGIN
    ALTER TABLE public.host_wallets ADD CONSTRAINT positive_balance CHECK (balance >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.host_wallets ADD CONSTRAINT unique_host_wallet UNIQUE (host_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notifications constraints
DO $$ BEGIN
    ALTER TABLE public.notifications ADD CONSTRAINT content_or_description_required 
        CHECK ((content IS NOT NULL) OR (description IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_priority_check 
        CHECK (metadata->>'priority' IN ('low', 'normal', 'high', 'urgent'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TYPES
-- ============================================================================

CREATE TYPE IF NOT EXISTS public.vehicle_transfer_validation_result AS (
    is_valid boolean,
    error_message text,
    validation_details jsonb
);

-- ============================================================================
-- FUNCTIONS (Page 1 of 2)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assert_admin(p_require_super_admin boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: User is not an admin';
    END IF;
    
    IF p_require_super_admin AND NOT EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_capabilities(p_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    capabilities jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'capability', capability,
            'granted_at', granted_at,
            'expires_at', expires_at,
            'is_active', is_active
        )
    ) INTO capabilities
    FROM public.admin_capabilities
    WHERE admin_id = p_admin_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now());
    
    RETURN COALESCE(capabilities, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_conversation_ids(user_uuid uuid)
RETURNS TABLE(conversation_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT DISTINCT cp.conversation_id
    FROM public.conversation_participants cp
    WHERE cp.user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversation_uuid
          AND cp.user_id = user_uuid
    );
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id bigint, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true,
        updated_at = now()
    WHERE id = p_notification_id
      AND user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id uuid,
    p_type public.notification_type,
    p_title text,
    p_description text DEFAULT NULL,
    p_content text DEFAULT NULL,
    p_role_target public.notification_role DEFAULT 'system_wide',
    p_related_booking_id uuid DEFAULT NULL,
    p_related_car_id uuid DEFAULT NULL,
    p_related_user_id uuid DEFAULT NULL,
    p_priority integer DEFAULT 0,
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    notification_id bigint;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        description,
        content,
        role_target,
        related_booking_id,
        related_car_id,
        metadata,
        expires_at,
        is_read
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_description,
        p_content,
        p_role_target,
        p_related_booking_id,
        p_related_car_id,
        p_metadata || jsonb_build_object('priority', p_priority, 'related_user_id', p_related_user_id),
        p_expires_at,
        false
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.suspend_user(
    p_user_id uuid,
    p_reason text,
    p_duration interval DEFAULT '7 days'::interval
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM assert_admin(false);
    
    UPDATE public.profiles
    SET account_locked_until = now() + p_duration,
        updated_at = now()
    WHERE id = p_user_id;
    
    PERFORM log_admin_activity(
        auth.uid(),
        'suspend_user',
        'profiles',
        p_user_id::text,
        jsonb_build_object('reason', p_reason, 'duration', p_duration::text)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.ban_user(p_user_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM assert_admin(true);
    
    UPDATE public.profiles
    SET account_locked_until = 'infinity'::timestamp,
        updated_at = now()
    WHERE id = p_user_id;
    
    PERFORM log_admin_activity(
        auth.uid(),
        'ban_user',
        'profiles',
        p_user_id::text,
        jsonb_build_object('reason', p_reason)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_suspend_users(
    p_user_ids uuid[],
    p_reason text,
    p_duration interval
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    affected_count integer;
BEGIN
    PERFORM assert_admin(false);
    
    UPDATE public.profiles
    SET account_locked_until = now() + p_duration,
        updated_at = now()
    WHERE id = ANY(p_user_ids);
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    PERFORM log_admin_activity(
        auth.uid(),
        'bulk_suspend_users',
        'profiles',
        NULL,
        jsonb_build_object(
            'user_count', affected_count,
            'reason', p_reason,
            'duration', p_duration::text
        )
    );
    
    RETURN affected_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_restrictions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cleaned_count integer;
BEGIN
    UPDATE public.profiles
    SET account_locked_until = NULL,
        updated_at = now()
    WHERE account_locked_until IS NOT NULL
      AND account_locked_until != 'infinity'::timestamp
      AND account_locked_until < now();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$;

-- ============================================================================
-- FUNCTIONS (Page 2 of 2)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_data jsonb;
BEGIN
    IF auth.uid() != p_user_id AND NOT EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    SELECT jsonb_build_object(
        'profile', (SELECT row_to_json(p.*) FROM public.profiles p WHERE id = p_user_id),
        'bookings', (SELECT jsonb_agg(b.*) FROM public.bookings b WHERE renter_id = p_user_id),
        'cars', (SELECT jsonb_agg(c.*) FROM public.cars c WHERE owner_id = p_user_id),
        'reviews', (SELECT jsonb_agg(r.*) FROM public.reviews r WHERE reviewer_id = p_user_id OR reviewee_id = p_user_id),
        'wallet', (SELECT row_to_json(w.*) FROM public.host_wallets w WHERE host_id = p_user_id),
        'transactions', (SELECT jsonb_agg(t.*) FROM public.wallet_transactions t WHERE host_id = p_user_id)
    ) INTO user_data;
    
    RETURN user_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_vehicle_transfer(
    p_vehicle_id uuid,
    p_from_owner_id uuid,
    p_to_owner_id uuid
)
RETURNS public.vehicle_transfer_validation_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result public.vehicle_transfer_validation_result;
    active_bookings integer;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.cars 
        WHERE id = p_vehicle_id AND owner_id = p_from_owner_id
    ) THEN
        result.is_valid := false;
        result.error_message := 'Vehicle does not belong to the specified owner';
        RETURN result;
    END IF;
    
    SELECT COUNT(*) INTO active_bookings
    FROM public.bookings
    WHERE car_id = p_vehicle_id
      AND status IN ('pending', 'confirmed')
      AND end_date >= CURRENT_DATE;
    
    IF active_bookings > 0 THEN
        result.is_valid := false;
        result.error_message := 'Vehicle has active bookings';
        result.validation_details := jsonb_build_object('active_bookings', active_bookings);
        RETURN result;
    END IF;
    
    result.is_valid := true;
    result.validation_details := '{}'::jsonb;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_vehicle(
    p_vehicle_id uuid,
    p_from_owner_id uuid,
    p_to_owner_id uuid,
    p_reason text,
    p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    transfer_id uuid;
    validation_result public.vehicle_transfer_validation_result;
BEGIN
    PERFORM assert_admin(false);
    
    validation_result := validate_vehicle_transfer(p_vehicle_id, p_from_owner_id, p_to_owner_id);
    IF NOT validation_result.is_valid THEN
        RAISE EXCEPTION '%', validation_result.error_message;
    END IF;
    
    INSERT INTO public.vehicle_transfers (
        vehicle_id,
        from_owner_id,
        to_owner_id,
        transferred_by,
        transfer_reason,
        transfer_notes,
        status
    ) VALUES (
        p_vehicle_id,
        p_from_owner_id,
        p_to_owner_id,
        auth.uid(),
        p_reason,
        p_notes,
        'approved'
    )
    RETURNING id INTO transfer_id;
    
    UPDATE public.cars
    SET owner_id = p_to_owner_id,
        updated_at = now()
    WHERE id = p_vehicle_id;
    
    UPDATE public.vehicle_transfers
    SET status = 'completed',
        completed_at = now()
    WHERE id = transfer_id;
    
    RETURN transfer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_notification_campaign(p_campaign_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    campaign_id uuid;
BEGIN
    PERFORM assert_admin(false);
    
    INSERT INTO public.notification_campaigns (
        name,
        description,
        created_by,
        target_audience,
        notification_template,
        schedule_type,
        scheduled_at,
        status
    ) VALUES (
        p_campaign_data->>'name',
        p_campaign_data->>'description',
        auth.uid(),
        p_campaign_data->'target_audience',
        p_campaign_data->'notification_template',
        COALESCE(p_campaign_data->>'schedule_type', 'immediate'),
        (p_campaign_data->>'scheduled_at')::timestamp with time zone,
        'draft'
    )
    RETURNING id INTO campaign_id;
    
    RETURN campaign_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_notification_campaign(p_campaign_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    errors jsonb := '[]'::jsonb;
BEGIN
    IF p_campaign_data->>'name' IS NULL THEN
        errors := errors || '["Campaign name is required"]'::jsonb;
    END IF;
    
    IF p_campaign_data->'target_audience' IS NULL THEN
        errors := errors || '["Target audience is required"]'::jsonb;
    END IF;
    
    IF p_campaign_data->'notification_template' IS NULL THEN
        errors := errors || '["Notification template is required"]'::jsonb;
    END IF;
    
    RETURN jsonb_build_object(
        'is_valid', jsonb_array_length(errors) = 0,
        'errors', errors
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_notification_preferences(
    p_whatsapp_enabled boolean,
    p_email_enabled boolean,
    p_marketing_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.notification_preferences (
        user_id,
        push_notifications,
        email_notifications,
        sms_notifications,
        marketing_notifications
    ) VALUES (
        auth.uid(),
        p_whatsapp_enabled,
        p_email_enabled,
        p_whatsapp_enabled,
        p_marketing_enabled
    )
    ON CONFLICT (user_id) DO UPDATE
    SET push_notifications = p_whatsapp_enabled,
        email_notifications = p_email_enabled,
        sms_notifications = p_whatsapp_enabled,
        marketing_notifications = p_marketing_enabled,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.migrate_existing_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    migrated_count integer := 0;
BEGIN
    RETURN migrated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.migrate_notifications_from_backup()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    migrated_count integer := 0;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        description,
        content,
        related_booking_id,
        related_car_id,
        is_read,
        created_at
    )
    SELECT
        user_id,
        type,
        title,
        description,
        content,
        related_booking_id,
        related_car_id,
        is_read,
        created_at
    FROM public.notifications_backup2
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RETURN migrated_count;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS set_admin_capabilities_updated_at ON public.admin_capabilities;
CREATE TRIGGER set_admin_capabilities_updated_at
    BEFORE UPDATE ON public.admin_capabilities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_host_wallets_updated_at ON public.host_wallets;
CREATE TRIGGER update_host_wallets_updated_at
    BEFORE UPDATE ON public.host_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_notification_campaigns_updated_at ON public.notification_campaigns;
CREATE TRIGGER set_notification_campaigns_updated_at
    BEFORE UPDATE ON public.notification_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications_backup2;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications_backup2
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON public.wallet_transactions;
CREATE TRIGGER update_wallet_transactions_updated_at
    BEFORE UPDATE ON public.wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.admin_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_backup2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage admin_capabilities" ON public.admin_capabilities;
CREATE POLICY "Admins manage admin_capabilities"
    ON public.admin_capabilities
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage notification_campaigns" ON public.notification_campaigns;
CREATE POLICY "Admins manage notification_campaigns"
    ON public.notification_campaigns
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all notification logs" ON public.notification_logs;
CREATE POLICY "Admins can view all notification logs"
    ON public.notification_logs
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view their own notification logs" ON public.notification_logs;
CREATE POLICY "Users can view their own notification logs"
    ON public.notification_logs
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view vehicle_transfers" ON public.vehicle_transfers;
CREATE POLICY "Admins can view vehicle_transfers"
    ON public.vehicle_transfers
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can insert vehicle_transfers" ON public.vehicle_transfers;
CREATE POLICY "Admins can insert vehicle_transfers"
    ON public.vehicle_transfers
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update vehicle_transfers" ON public.vehicle_transfers;
CREATE POLICY "Admins can update vehicle_transfers"
    ON public.vehicle_transfers
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications_backup2;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications_backup2
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications_backup2;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications_backup2
    FOR UPDATE
    USING (auth.uid() = user_id);
