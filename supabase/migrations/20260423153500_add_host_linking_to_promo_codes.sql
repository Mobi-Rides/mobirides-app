-- Migration: Add host linking and car scoping to promo codes
-- Issue: MOB-38

-- 1. Add host_id column to promo_codes
ALTER TABLE public.promo_codes 
ADD COLUMN host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.promo_codes.host_id IS 'If set, this promo code is only valid for cars owned by this host.';

-- 2. Create promo_code_cars junction table
CREATE TABLE IF NOT EXISTS public.promo_code_cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(promo_code_id, car_id)
);

COMMENT ON TABLE public.promo_code_cars IS 'Junction table to restrict promo codes to specific cars.';

-- 3. Enable RLS and add policies
ALTER TABLE public.promo_code_cars ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can see which cars a promo code applies to (needed for validation)
CREATE POLICY "promo_code_cars_select_policy" 
ON public.promo_code_cars 
FOR SELECT 
TO authenticated 
USING (true);

-- INSERT/UPDATE/DELETE: Only admins can manage scoping
CREATE POLICY "promo_code_cars_admin_policy" 
ON public.promo_code_cars 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE admins.id = auth.uid() 
        AND admins.status = 'active'
    )
);

-- 4. Create index for faster validation lookups
CREATE INDEX IF NOT EXISTS idx_promo_code_cars_promo_id ON public.promo_code_cars(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_cars_car_id ON public.promo_code_cars(car_id);
