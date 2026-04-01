-- S9-002: Create platform_settings table
-- Replaces hardcoded business logic values with DB-configurable settings.

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read
CREATE POLICY "Admins can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Super admins can write
CREATE POLICY "Super admins can manage platform settings"
  ON public.platform_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true));

-- Seed defaults
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
  ('commission_rate_default', '0.15', 'Default platform commission rate (15%)'),
  ('insurance_admin_fee', '150', 'Admin fee applied to insurance claims (BWP)'),
  ('dynamic_pricing_enabled', 'true', 'Whether dynamic pricing rules are active')
ON CONFLICT (setting_key) DO NOTHING;

-- RPC: get all settings
CREATE OR REPLACE FUNCTION public.get_platform_settings()
RETURNS TABLE(setting_key text, setting_value text, description text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT setting_key, setting_value, description FROM public.platform_settings ORDER BY setting_key;
$$;

-- RPC: update a setting
CREATE OR REPLACE FUNCTION public.update_platform_setting(p_key text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_settings
  SET setting_value = p_value, updated_by = auth.uid(), updated_at = now()
  WHERE setting_key = p_key;
END;
$$;
