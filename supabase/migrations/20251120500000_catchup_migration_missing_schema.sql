-- =====================================================
-- CATCH-UP MIGRATION: Add Missing Schema to Production
-- Safe to run - uses IF NOT EXISTS checks
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- Create notification_campaign_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.notification_campaign_status AS ENUM (
    'draft',
    'scheduled',
    'sending',
    'completed',
    'cancelled',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLES
-- =====================================================

-- Create notification_campaigns table
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status public.notification_campaign_status DEFAULT 'draft'::notification_campaign_status NOT NULL,
  target_user_roles TEXT[] DEFAULT '{}'::TEXT[],
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_text TEXT,
  priority TEXT DEFAULT 'medium'::TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  last_login_days INTEGER,
  booking_count_min INTEGER,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create campaign_delivery_logs table
CREATE TABLE IF NOT EXISTS public.campaign_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.notification_campaigns(id) ON DELETE CASCADE,
  user_id UUID,
  notification_id BIGINT REFERENCES public.notifications(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending'::TEXT NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT campaign_delivery_logs_status_check CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'opened', 'clicked'))
);

-- Create admin_capabilities table
CREATE TABLE IF NOT EXISTS public.admin_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE NOT NULL,
  capability_key TEXT NOT NULL,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT true,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(admin_id, capability_key)
);

-- Create vehicle_transfers table
CREATE TABLE IF NOT EXISTS public.vehicle_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  from_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  to_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  transfer_reason TEXT NOT NULL,
  transfer_notes TEXT,
  transferred_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  transferred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create notifications_backup2 table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications_backup2 (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_booking_id TEXT,
  related_car_id TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Indexes for notification_campaigns
CREATE INDEX IF NOT EXISTS notification_campaigns_status_idx ON public.notification_campaigns(status);
CREATE INDEX IF NOT EXISTS notification_campaigns_created_by_idx ON public.notification_campaigns(created_by);
CREATE INDEX IF NOT EXISTS notification_campaigns_schedule_idx ON public.notification_campaigns(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Indexes for campaign_delivery_logs
CREATE INDEX IF NOT EXISTS idx_campaign_delivery_logs_campaign ON public.campaign_delivery_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_delivery_logs_user ON public.campaign_delivery_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_delivery_logs_status ON public.campaign_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_delivery_logs_notification ON public.campaign_delivery_logs(notification_id);

-- Indexes for admin_capabilities
CREATE INDEX IF NOT EXISTS admin_capabilities_admin_key_idx ON public.admin_capabilities(admin_id, capability_key);

-- Indexes for vehicle_transfers
CREATE INDEX IF NOT EXISTS vehicle_transfers_vehicle_id_idx ON public.vehicle_transfers(vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_transfers_from_owner_idx ON public.vehicle_transfers(from_owner_id);
CREATE INDEX IF NOT EXISTS vehicle_transfers_to_owner_idx ON public.vehicle_transfers(to_owner_id);
CREATE INDEX IF NOT EXISTS vehicle_transfers_transferred_at_idx ON public.vehicle_transfers(transferred_at);

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Add constraint to notifications table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_content_or_description_required'
  ) THEN
    ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_content_or_description_required 
    CHECK (content IS NOT NULL OR description IS NOT NULL);
  END IF;
END $$;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: validate_campaign_audience
CREATE OR REPLACE FUNCTION public.validate_campaign_audience(
  p_user_roles TEXT[] DEFAULT NULL,
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
  v_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Count matching users
  SELECT COUNT(DISTINCT p.id) INTO v_count
  FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN bookings b ON p.id = b.renter_id
  WHERE 
    (p_user_roles IS NULL OR p.role::TEXT = ANY(p_user_roles))
    AND (p_registration_start IS NULL OR p.created_at >= p_registration_start)
    AND (p_registration_end IS NULL OR p.created_at <= p_registration_end)
    AND (p_last_login_days IS NULL OR u.last_sign_in_at >= NOW() - (p_last_login_days || ' days')::INTERVAL)
    AND (p_booking_count_min IS NULL OR (
      SELECT COUNT(*) FROM bookings WHERE renter_id = p.id
    ) >= p_booking_count_min);
  
  v_result := jsonb_build_object(
    'is_valid', v_count > 0,
    'estimated_recipients', v_count,
    'warnings', CASE WHEN v_count = 0 THEN ARRAY['No users match the criteria']::TEXT[] ELSE ARRAY[]::TEXT[] END
  );
  
  RETURN v_result;
END;
$$;

-- Drop function first to allow return type change (PostgreSQL doesn't allow changing return types with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS public.create_notification_campaign(jsonb);

-- Function: create_notification_campaign
CREATE OR REPLACE FUNCTION public.create_notification_campaign(p_campaign_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id UUID;
  v_user_record RECORD;
  v_notification_id BIGINT;
  v_created_count INTEGER := 0;
  v_total_recipients INTEGER := 0;
  v_send_immediately BOOLEAN;
BEGIN
  v_send_immediately := COALESCE((p_campaign_data->>'send_immediately')::BOOLEAN, false);
  
  -- Create campaign
  INSERT INTO notification_campaigns (
    name, description, status, target_user_roles,
    title, message, action_url, action_text, priority,
    scheduled_for, registration_start, registration_end,
    last_login_days, booking_count_min, metadata, created_by
  ) VALUES (
    p_campaign_data->>'name',
    p_campaign_data->>'description',
    CASE WHEN v_send_immediately THEN 'sending'::notification_campaign_status ELSE 'scheduled'::notification_campaign_status END,
    ARRAY(SELECT jsonb_array_elements_text(p_campaign_data->'user_roles')),
    p_campaign_data->>'title',
    p_campaign_data->>'message',
    p_campaign_data->>'action_url',
    p_campaign_data->>'action_text',
    COALESCE(p_campaign_data->>'priority', 'medium'),
    (p_campaign_data->>'scheduled_date')::TIMESTAMPTZ,
    (p_campaign_data->>'registration_start')::TIMESTAMPTZ,
    (p_campaign_data->>'registration_end')::TIMESTAMPTZ,
    (p_campaign_data->>'last_login_days')::INTEGER,
    (p_campaign_data->>'booking_count_min')::INTEGER,
    COALESCE(p_campaign_data->'metadata', '{}'::JSONB),
    auth.uid()
  ) RETURNING id INTO v_campaign_id;
  
  -- If sending immediately, create notifications
  IF v_send_immediately THEN
    FOR v_user_record IN
      SELECT DISTINCT p.id
      FROM profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      WHERE 
        (p_campaign_data->'user_roles' IS NULL OR p.role::TEXT = ANY(ARRAY(SELECT jsonb_array_elements_text(p_campaign_data->'user_roles'))))
    LOOP
      v_total_recipients := v_total_recipients + 1;
      
      BEGIN
        INSERT INTO notifications (user_id, type, title, description, metadata)
        VALUES (
          v_user_record.id,
          'system_notification'::notification_type,
          p_campaign_data->>'title',
          p_campaign_data->>'message',
          jsonb_build_object('campaign_id', v_campaign_id)
        ) RETURNING id INTO v_notification_id;
        
        INSERT INTO campaign_delivery_logs (campaign_id, user_id, notification_id, status)
        VALUES (v_campaign_id, v_user_record.id, v_notification_id, 'sent');
        
        v_created_count := v_created_count + 1;
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO campaign_delivery_logs (campaign_id, user_id, status, error_message)
        VALUES (v_campaign_id, v_user_record.id, 'failed', SQLERRM);
      END;
    END LOOP;
    
    UPDATE notification_campaigns
    SET status = 'completed'::notification_campaign_status,
        sent_at = NOW(),
        total_recipients = v_total_recipients,
        successful_sends = v_created_count,
        failed_sends = v_total_recipients - v_created_count
    WHERE id = v_campaign_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', v_campaign_id,
    'notifications_created', v_created_count,
    'total_recipients', v_total_recipients
  );
END;
$$;

-- Function: get_campaign_analytics
CREATE OR REPLACE FUNCTION public.get_campaign_analytics(p_campaign_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats RECORD;
  v_result JSONB;
BEGIN
  SELECT 
    COUNT(*) as total_recipients,
    COUNT(*) FILTER (WHERE status = 'sent') as sent,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
    COUNT(*) FILTER (WHERE status = 'opened') as opened,
    COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    COUNT(*) FILTER (WHERE status = 'pending') as pending
  INTO v_stats
  FROM campaign_delivery_logs
  WHERE campaign_id = p_campaign_id;
  
  v_result := jsonb_build_object(
    'total_recipients', COALESCE(v_stats.total_recipients, 0),
    'sent', COALESCE(v_stats.sent, 0),
    'delivered', COALESCE(v_stats.delivered, 0),
    'opened', COALESCE(v_stats.opened, 0),
    'clicked', COALESCE(v_stats.clicked, 0),
    'failed', COALESCE(v_stats.failed, 0),
    'pending', COALESCE(v_stats.pending, 0),
    'delivery_rate', CASE WHEN v_stats.total_recipients > 0 THEN ROUND((v_stats.delivered::NUMERIC / v_stats.total_recipients) * 100, 2) ELSE 0 END,
    'open_rate', CASE WHEN v_stats.delivered > 0 THEN ROUND((v_stats.opened::NUMERIC / v_stats.delivered) * 100, 2) ELSE 0 END,
    'click_rate', CASE WHEN v_stats.opened > 0 THEN ROUND((v_stats.clicked::NUMERIC / v_stats.opened) * 100, 2) ELSE 0 END
  );
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_backup2 ENABLE ROW LEVEL SECURITY;

-- Policies for notification_campaigns
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.notification_campaigns;
CREATE POLICY "Admins can manage campaigns" ON public.notification_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND (is_super_admin = true OR id = notification_campaigns.created_by))
  );

-- Policies for campaign_delivery_logs
DROP POLICY IF EXISTS "campaign_delivery_logs_admin_all" ON public.campaign_delivery_logs;
CREATE POLICY "campaign_delivery_logs_admin_all" ON public.campaign_delivery_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "campaign_delivery_logs_user_read" ON public.campaign_delivery_logs;
CREATE POLICY "campaign_delivery_logs_user_read" ON public.campaign_delivery_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policies for admin_capabilities
DROP POLICY IF EXISTS "Admins can view their own capabilities" ON public.admin_capabilities;
CREATE POLICY "Admins can view their own capabilities" ON public.admin_capabilities
  FOR SELECT USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Super admins can manage all capabilities" ON public.admin_capabilities;
CREATE POLICY "Super admins can manage all capabilities" ON public.admin_capabilities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_super_admin = true)
  );

-- Policies for vehicle_transfers
DROP POLICY IF EXISTS "Admins can view vehicle transfers" ON public.vehicle_transfers;
CREATE POLICY "Admins can view vehicle transfers" ON public.vehicle_transfers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Admins can insert vehicle transfers" ON public.vehicle_transfers;
CREATE POLICY "Admins can insert vehicle transfers" ON public.vehicle_transfers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Policies for notifications_backup2
DROP POLICY IF EXISTS "notifications_backup2_admin_all" ON public.notifications_backup2;
CREATE POLICY "notifications_backup2_admin_all" ON public.notifications_backup2
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for updated_at on campaign_delivery_logs
CREATE OR REPLACE FUNCTION update_campaign_delivery_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_campaign_delivery_logs_updated_at ON public.campaign_delivery_logs;
CREATE TRIGGER set_campaign_delivery_logs_updated_at
  BEFORE UPDATE ON public.campaign_delivery_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_delivery_logs_updated_at();

-- Trigger for updated_at on notifications_backup2
DROP TRIGGER IF EXISTS set_notifications_backup2_updated_at ON public.notifications_backup2;
CREATE TRIGGER set_notifications_backup2_updated_at
  BEFORE UPDATE ON public.notifications_backup2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();