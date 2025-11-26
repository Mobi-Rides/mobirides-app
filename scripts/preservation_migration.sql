-- =====================================================
-- MINIMAL PRESERVATION MIGRATION
-- Only includes items NOT already in other migrations
-- =====================================================

-- =====================================================
-- TABLE: notification_logs (if missing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.notification_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_campaign ON public.notification_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);

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

-- =====================================================
-- FUNCTION: get_user_conversation_ids
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_conversation_ids(p_user_id UUID)
RETURNS TABLE(conversation_id UUID) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cp.conversation_id
  FROM public.conversation_participants cp
  WHERE cp.user_id = p_user_id;
$$;

-- =====================================================
-- RLS POLICIES: notification_logs
-- =====================================================
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_logs_admin_all" ON public.notification_logs;
CREATE POLICY "notification_logs_admin_all" ON public.notification_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "notification_logs_user_read" ON public.notification_logs;
CREATE POLICY "notification_logs_user_read" ON public.notification_logs
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
DROP TRIGGER IF EXISTS set_notification_logs_updated_at ON public.notification_logs;
CREATE TRIGGER set_notification_logs_updated_at
  BEFORE UPDATE ON public.notification_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_notifications_backup2_updated_at ON public.notifications_backup2;
CREATE TRIGGER set_notifications_backup2_updated_at
  BEFORE UPDATE ON public.notifications_backup2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- COMPLETION NOTICE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Minimal preservation migration completed successfully';
  RAISE NOTICE 'Tables created: notification_logs, notifications_backup2';
  RAISE NOTICE 'Constraints added: host_wallets, notifications';
  RAISE NOTICE 'Functions created: get_user_conversation_ids';
END $$;
