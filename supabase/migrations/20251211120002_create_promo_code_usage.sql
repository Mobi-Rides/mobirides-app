-- Create promo_code_usage table
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id) -- One use per user per code
);

-- Enable RLS
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own promo usage
CREATE POLICY "Users can view their own promo usage"
  ON public.promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own promo usage
CREATE POLICY "Users can insert their own promo usage"
  ON public.promo_code_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all promo usage
CREATE POLICY "Admins can view all promo usage"
  ON public.promo_code_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
    )
  );