-- 1. Fix Profile Editing for SuperAdmins
-- Create an UPDATE policy allowing super admins to modify profile records
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- 2. Fix Platform Settings Saving (UPSERT)
-- Redefine the update_platform_setting function to handle new keys gracefully via UPSERT
CREATE OR REPLACE FUNCTION public.update_platform_setting(p_key text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.platform_settings (setting_key, setting_value, updated_by, updated_at)
  VALUES (p_key, p_value, auth.uid(), now())
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_by = EXCLUDED.updated_by,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- 3. Seed Default Contact & Platform Settings
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES 
  ('app_name', 'MobiRides', 'Name of the application/platform'),
  ('support_email', 'hello@mobirides.africa', 'Support contact email address'),
  ('support_phone', '+267 XX XXX XXX', 'Support contact phone number'),
  ('email_notifications_enabled', 'true', 'Enable email notification channel'),
  ('sms_notifications_enabled', 'false', 'Enable SMS notification channel'),
  ('push_notifications_enabled', 'true', 'Enable push notification channel'),
  ('two_factor_enabled', 'false', 'Enforce 2FA for administrative users'),
  ('session_timeout_minutes', '60', 'Automatic session timeout limit in minutes'),
  ('theme_mode', 'system', 'Global user interface theme preference'),
  ('primary_color', '#3B82F6', 'Primary brand color hex code'),
  ('font_size', 'medium', 'Default UI body text font size')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Fix Dynamic Pricing Rules RLS Issue for Renters/Regular Users
-- Create a SELECT policy allowing all users to view active dynamic pricing rules
CREATE POLICY "Allow public read access to dynamic pricing rules"
ON public.dynamic_pricing_rules
FOR SELECT
TO public
USING (is_active = true);

-- 5. Seed Duration Rules to keep DB and Fallback Rules fully in sync
INSERT INTO public.dynamic_pricing_rules (rule_name, multiplier, condition_type, condition_value, is_active, priority)
SELECT 'Weekly Discount', 0.900, 'DURATION', '{"min_duration_days": 7, "max_duration_days": 13}'::jsonb, true, 60
WHERE NOT EXISTS (SELECT 1 FROM public.dynamic_pricing_rules WHERE rule_name = 'Weekly Discount');

INSERT INTO public.dynamic_pricing_rules (rule_name, multiplier, condition_type, condition_value, is_active, priority)
SELECT 'Monthly Discount', 0.800, 'DURATION', '{"min_duration_days": 14}'::jsonb, true, 65
WHERE NOT EXISTS (SELECT 1 FROM public.dynamic_pricing_rules WHERE rule_name = 'Monthly Discount');
