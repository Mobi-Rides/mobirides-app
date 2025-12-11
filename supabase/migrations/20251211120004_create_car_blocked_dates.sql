-- Create car_blocked_dates table
CREATE TABLE IF NOT EXISTS public.car_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(car_id, blocked_date)
);

-- Enable RLS
ALTER TABLE public.car_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Car owners can manage their blocked dates
CREATE POLICY "Owners can manage blocked dates"
  ON public.car_blocked_dates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.id = car_blocked_dates.car_id 
      AND cars.owner_id = auth.uid()
    )
  );

-- Anyone can view blocked dates (for booking availability)
CREATE POLICY "Anyone can view blocked dates"
  ON public.car_blocked_dates FOR SELECT
  USING (true);
