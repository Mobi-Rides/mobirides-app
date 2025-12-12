-- Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'fixed', -- 'fixed' or 'percentage'
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  terms_conditions TEXT,
  min_booking_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  applicable_vehicle_types TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active promo codes
CREATE POLICY "Anyone can view active promo codes"
  ON public.promo_codes FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Admins can manage promo codes
CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
    )
  );
