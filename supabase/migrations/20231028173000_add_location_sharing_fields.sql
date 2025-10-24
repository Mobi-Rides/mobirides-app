
-- Add location sharing fields to cars table
ALTER TABLE IF EXISTS public.cars 
ADD COLUMN IF NOT EXISTS is_sharing_location BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_sharing_scope TEXT DEFAULT 'none'::text,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;

-- Create a new table for real-time location tracking
CREATE TABLE IF NOT EXISTS public.real_time_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    heading NUMERIC,
    speed NUMERIC,
    accuracy NUMERIC,
    sharing_scope TEXT NOT NULL DEFAULT 'none'::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day')
);

-- Add RLS policies
ALTER TABLE public.real_time_locations ENABLE ROW LEVEL SECURITY;

-- Everyone can read locations
CREATE POLICY "Anyone can read real-time locations"
ON public.real_time_locations
FOR SELECT
USING (true);

-- Only hosts can insert their own locations
CREATE POLICY "Hosts can insert their own locations"
ON public.real_time_locations
FOR INSERT
WITH CHECK (host_id = auth.uid());

-- Only hosts can update their own locations
CREATE POLICY "Hosts can update their own locations"
ON public.real_time_locations
FOR UPDATE
USING (host_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_real_time_locations_car_id ON public.real_time_locations(car_id);
CREATE INDEX IF NOT EXISTS idx_real_time_locations_host_id ON public.real_time_locations(host_id);
CREATE INDEX IF NOT EXISTS idx_real_time_locations_trip_id ON public.real_time_locations(trip_id);
CREATE INDEX IF NOT EXISTS idx_real_time_locations_created_at ON public.real_time_locations(created_at);

-- Add function to clean up old location data
CREATE OR REPLACE FUNCTION clean_expired_locations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.real_time_locations
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup function periodically
DROP TRIGGER IF EXISTS trigger_clean_expired_locations ON public.real_time_locations;
CREATE TRIGGER trigger_clean_expired_locations
AFTER INSERT ON public.real_time_locations
EXECUTE PROCEDURE clean_expired_locations();
