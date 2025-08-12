-- Add notification logging for Twilio integration
-- This allows us to track WhatsApp and Email notification delivery

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'delivered', 'read')),
  template_id TEXT,
  external_message_id TEXT, -- Twilio/SendGrid message ID
  recipient TEXT NOT NULL, -- Phone or email
  error_message TEXT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user notification preferences
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS notification_logs_user_id_idx ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS notification_logs_booking_id_idx ON notification_logs(booking_id);
CREATE INDEX IF NOT EXISTS notification_logs_type_status_idx ON notification_logs(type, status);
CREATE INDEX IF NOT EXISTS notification_logs_created_at_idx ON notification_logs(created_at);

-- Enable RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_logs
CREATE POLICY "Users can view their own notification logs" 
  ON notification_logs FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notification logs" 
  ON notification_logs FOR ALL 
  USING (public.is_admin(auth.uid()));

-- Function to update notification preferences
CREATE OR REPLACE FUNCTION update_notification_preferences(
  p_whatsapp_enabled BOOLEAN DEFAULT NULL,
  p_email_enabled BOOLEAN DEFAULT NULL,
  p_marketing_enabled BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET 
    whatsapp_notifications = COALESCE(p_whatsapp_enabled, whatsapp_notifications),
    email_notifications = COALESCE(p_email_enabled, email_notifications),
    marketing_emails = COALESCE(p_marketing_enabled, marketing_emails),
    updated_at = NOW()
  WHERE id = auth.uid();
END;
$$;
