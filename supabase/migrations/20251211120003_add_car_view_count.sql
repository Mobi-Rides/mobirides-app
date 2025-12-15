-- Add view_count to cars table
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create atomic increment function
CREATE OR REPLACE FUNCTION increment_car_view_count(car_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.cars 
  SET view_count = view_count + 1 
  WHERE id = car_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
