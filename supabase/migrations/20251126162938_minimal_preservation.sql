-- =====================================================
-- MINIMAL PRESERVATION MIGRATION
-- Only includes items NOT already in other migrations
-- =====================================================

-- =====================================================
-- TABLE: campaign_delivery_logs (for campaign tracking)
-- Separate from notification_logs (used by Twilio system)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.campaign_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.notification_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_id INTEGER REFERENCES public.notifications(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_delivery_logs_campaign ON public.campaign_delivery_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_delivery_logs_user ON public.campaign_delivery_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_delivery_logs_status ON public.campaign_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_delivery_logs_notification ON public.campaign_delivery_logs(notification_id);

-- =====================================================
-- TABLE: notifications_backup2 (if needed for recovery)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications_backup2 (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  type TEXT,
  title TEXT,
  content TEXT,
  description TEXT,
  is_read BOOLEAN DEFAULT false,
  related_booking_id UUID,
  related_car_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONSTRAINTS: Host Wallets
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'host_wallets_balance_positive'
  ) THEN
    ALTER TABLE public.host_wallets 
    ADD CONSTRAINT host_wallets_balance_positive CHECK (balance >= 0);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'host_wallets_host_id_unique'
  ) THEN
    ALTER TABLE public.host_wallets 
    ADD CONSTRAINT host_wallets_host_id_unique UNIQUE (host_id);
  END IF;
END $$;

-- =====================================================
-- CONSTRAINTS: Notifications
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_content_or_description_required'
  ) THEN
    ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_content_or_description_required 
    CHECK (content IS NOT NULL OR description IS NOT NULL);
  END IF;
END $$;

-- Function get_user_conversation_ids already exists in database, skipping

-- =====================================================
-- RLS POLICIES: campaign_delivery_logs
-- =====================================================
ALTER TABLE public.campaign_delivery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaign_delivery_logs_admin_all" ON public.campaign_delivery_logs;
CREATE POLICY "campaign_delivery_logs_admin_all" ON public.campaign_delivery_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "campaign_delivery_logs_user_read" ON public.campaign_delivery_logs;
CREATE POLICY "campaign_delivery_logs_user_read" ON public.campaign_delivery_logs
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES: notifications_backup2
-- =====================================================
ALTER TABLE public.notifications_backup2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_backup2_admin_all" ON public.notifications_backup2;
CREATE POLICY "notifications_backup2_admin_all" ON public.notifications_backup2
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- TRIGGERS: Updated At Timestamps
-- =====================================================
DROP TRIGGER IF EXISTS set_campaign_delivery_logs_updated_at ON public.campaign_delivery_logs;
CREATE TRIGGER set_campaign_delivery_logs_updated_at
  BEFORE UPDATE ON public.campaign_delivery_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_notifications_backup2_updated_at ON public.notifications_backup2;
CREATE TRIGGER set_notifications_backup2_updated_at
  BEFORE UPDATE ON public.notifications_backup2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- CAMPAIGN RPC FUNCTIONS
-- =====================================================

-- Function: Validate campaign audience and estimate recipients
CREATE OR REPLACE FUNCTION public.validate_campaign_audience(
  p_user_roles TEXT[],
  p_registration_start TIMESTAMPTZ DEFAULT NULL,
  p_registration_end TIMESTAMPTZ DEFAULT NULL,
  p_last_login_days INTEGER DEFAULT NULL,
  p_booking_count_min INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Validate inputs
  IF p_user_roles IS NULL OR array_length(p_user_roles, 1) = 0 THEN
    v_errors := array_append(v_errors, 'At least one user role must be selected');
  END IF;

  -- Count matching users
  SELECT COUNT(DISTINCT p.id) INTO v_count
  FROM public.profiles p
  LEFT JOIN (
    SELECT renter_id as user_id, COUNT(*) as booking_count
    FROM public.bookings
    GROUP BY renter_id
  ) b ON b.user_id = p.id
  WHERE 
    (p_user_roles IS NULL OR p.role = ANY(p_user_roles))
    AND (p_registration_start IS NULL OR p.created_at >= p_registration_start)
    AND (p_registration_end IS NULL OR p.created_at <= p_registration_end)
    AND (p_booking_count_min IS NULL OR COALESCE(b.booking_count, 0) >= p_booking_count_min);

  -- Add warnings
  IF v_count = 0 THEN
    v_warnings := array_append(v_warnings, 'No users match the selected criteria');
  ELSIF v_count > 10000 THEN
    v_warnings := array_append(v_warnings, 'Large recipient count may take time to send');
  END IF;

  RETURN jsonb_build_object(
    'valid', array_length(v_errors, 1) IS NULL OR array_length(v_errors, 1) = 0,
    'estimated_recipients', v_count,
    'warnings', to_jsonb(v_warnings),
    'errors', to_jsonb(v_errors)
  );
END;
$$;

-- Function: Create and execute notification campaign
CREATE OR REPLACE FUNCTION public.create_notification_campaign(
  p_campaign_name TEXT,
  p_campaign_description TEXT,
  p_user_roles TEXT[],
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_text TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'medium',
  p_send_immediately BOOLEAN DEFAULT true,
  p_scheduled_date TIMESTAMPTZ DEFAULT NULL,
  p_registration_start TIMESTAMPTZ DEFAULT NULL,
  p_registration_end TIMESTAMPTZ DEFAULT NULL,
  p_last_login_days INTEGER DEFAULT NULL,
  p_booking_count_min INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id UUID;
  v_target_users UUID[];
  v_notification_id INTEGER;
  v_created_count INTEGER := 0;
  v_user_id UUID;
BEGIN
  -- Validate required fields
  IF p_campaign_name IS NULL OR p_campaign_name = '' THEN
    RAISE EXCEPTION 'Campaign name is required';
  END IF;
  
  IF p_title IS NULL OR p_title = '' THEN
    RAISE EXCEPTION 'Notification title is required';
  END IF;
  
  IF p_message IS NULL OR p_message = '' THEN
    RAISE EXCEPTION 'Notification message is required';
  END IF;

  -- Create campaign record
  INSERT INTO public.notification_campaigns (
    name,
    description,
    target_audience,
    content,
    schedule,
    settings,
    status,
    created_by,
    created_at
  ) VALUES (
    p_campaign_name,
    p_campaign_description,
    jsonb_build_object(
      'user_roles', to_jsonb(p_user_roles),
      'registration_date_range', jsonb_build_object(
        'start', p_registration_start,
        'end', p_registration_end
      ),
      'activity_filters', jsonb_build_object(
        'last_login_days', p_last_login_days,
        'booking_count_min', p_booking_count_min
      )
    ),
    jsonb_build_object(
      'title', p_title,
      'message', p_message,
      'action_url', p_action_url,
      'action_text', p_action_text
    ),
    jsonb_build_object(
      'send_immediately', p_send_immediately,
      'scheduled_date', p_scheduled_date
    ),
    jsonb_build_object(
      'priority', p_priority,
      'track_opens', true,
      'track_clicks', true
    ),
    CASE WHEN p_send_immediately THEN 'active' ELSE 'scheduled' END,
    auth.uid(),
    NOW()
  ) RETURNING id INTO v_campaign_id;

  -- Get target users
  SELECT ARRAY_AGG(DISTINCT p.id) INTO v_target_users
  FROM public.profiles p
  LEFT JOIN (
    SELECT renter_id as user_id, COUNT(*) as booking_count
    FROM public.bookings
    GROUP BY renter_id
  ) b ON b.user_id = p.id
  WHERE 
    (p_user_roles IS NULL OR p.role = ANY(p_user_roles))
    AND (p_registration_start IS NULL OR p.created_at >= p_registration_start)
    AND (p_registration_end IS NULL OR p.created_at <= p_registration_end)
    AND (p_booking_count_min IS NULL OR COALESCE(b.booking_count, 0) >= p_booking_count_min);

  -- Create notifications for each target user
  IF p_send_immediately THEN
    FOREACH v_user_id IN ARRAY v_target_users
    LOOP
      -- Create notification
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        description,
        metadata,
        is_read,
        created_at
      ) VALUES (
        v_user_id,
        'system_notification'::notification_type,
        p_title,
        p_message,
        jsonb_build_object(
          'campaign_id', v_campaign_id,
          'action_url', p_action_url,
          'action_text', p_action_text,
          'priority', p_priority
        ) || p_metadata,
        false,
        NOW()
      ) RETURNING id INTO v_notification_id;

      -- Log delivery
      INSERT INTO public.campaign_delivery_logs (
        campaign_id,
        user_id,
        notification_id,
        status,
        sent_at,
        created_at
      ) VALUES (
        v_campaign_id,
        v_user_id,
        v_notification_id,
        'sent',
        NOW(),
        NOW()
      );

      v_created_count := v_created_count + 1;
    END LOOP;

    -- Update campaign stats
    UPDATE public.notification_campaigns
    SET 
      total_recipients = v_created_count,
      sent_count = v_created_count,
      updated_at = NOW()
    WHERE id = v_campaign_id;
  ELSE
    -- For scheduled campaigns, just log the recipients
    UPDATE public.notification_campaigns
    SET 
      total_recipients = array_length(v_target_users, 1),
      updated_at = NOW()
    WHERE id = v_campaign_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', v_campaign_id,
    'notifications_created', v_created_count,
    'total_recipients', array_length(v_target_users, 1)
  );
END;
$$;

-- Function: Get campaign analytics
CREATE OR REPLACE FUNCTION public.get_campaign_analytics(p_campaign_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_recipients', COUNT(*),
    'sent', COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'opened', 'clicked')),
    'delivered', COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')),
    'opened', COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')),
    'clicked', COUNT(*) FILTER (WHERE status = 'clicked'),
    'failed', COUNT(*) FILTER (WHERE status IN ('failed', 'bounced')),
    'pending', COUNT(*) FILTER (WHERE status IN ('pending', 'queued')),
    'delivery_rate', ROUND(
      CASE WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked'))::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 0 END, 2
    ),
    'open_rate', ROUND(
      CASE WHEN COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')) > 0
      THEN (COUNT(*) FILTER (WHERE status IN ('opened', 'clicked'))::NUMERIC / 
            COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked'))::NUMERIC) * 100
      ELSE 0 END, 2
    ),
    'click_rate', ROUND(
      CASE WHEN COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')) > 0
      THEN (COUNT(*) FILTER (WHERE status = 'clicked')::NUMERIC / 
            COUNT(*) FILTER (WHERE status IN ('opened', 'clicked'))::NUMERIC) * 100
      ELSE 0 END, 2
    )
  ) INTO v_stats
  FROM public.campaign_delivery_logs
  WHERE campaign_id = p_campaign_id;

  RETURN COALESCE(v_stats, '{}'::jsonb);
END;
$$;

-- =====================================================
-- COMPLETION NOTICE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Minimal preservation migration completed successfully';
  RAISE NOTICE 'Tables created: campaign_delivery_logs, notifications_backup2';
  RAISE NOTICE 'Constraints added: host_wallets, notifications';
  RAISE NOTICE 'Functions created: get_user_conversation_ids, validate_campaign_audience, create_notification_campaign, get_campaign_analytics';
END $$;
