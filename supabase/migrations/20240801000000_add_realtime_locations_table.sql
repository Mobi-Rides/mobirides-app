
-- Create a real-time locations table for tracking user locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  heading NUMERIC,
  speed NUMERIC,
  accuracy NUMERIC,
  altitude NUMERIC,
  altitude_accuracy NUMERIC,
  sharing_scope TEXT NOT NULL DEFAULT 'none'::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day')
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON public.locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_car_id ON public.locations(car_id);
CREATE INDEX IF NOT EXISTS idx_locations_created_at ON public.locations(created_at);
CREATE INDEX IF NOT EXISTS idx_locations_updated_at ON public.locations(updated_at);
CREATE INDEX IF NOT EXISTS idx_locations_expires_at ON public.locations(expires_at);

-- Add columns to cars table for location sharing settings
ALTER TABLE IF NOT EXISTS public.cars 
ADD COLUMN IF NOT EXISTS is_sharing_location BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_sharing_scope TEXT DEFAULT 'none'::text,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;

-- Add RLS policies
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Everyone can read locations with appropriate sharing scope
CREATE POLICY "Read locations with appropriate sharing scope"
ON public.locations
FOR SELECT
USING (
  sharing_scope = 'all' 
  OR sharing_scope = 'trip_only' AND EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE (bookings.car_id = locations.car_id) 
    AND bookings.status = 'confirmed'
    AND bookings.renter_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- Only location owners can insert their own locations
CREATE POLICY "Insert own locations"
ON public.locations
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Only location owners can update their own locations
CREATE POLICY "Update own locations"
ON public.locations
FOR UPDATE
USING (user_id = auth.uid());

-- Only location owners can delete their own locations
CREATE POLICY "Delete own locations"
ON public.locations
FOR DELETE
USING (user_id = auth.uid());

-- Function to automatically set updated_at on location updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS set_updated_at_trigger ON public.locations;
CREATE TRIGGER set_updated_at_trigger
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Cleanup function for expired locations
CREATE OR REPLACE FUNCTION clean_expired_locations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.locations
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to clean up expired locations periodically
DROP TRIGGER IF EXISTS trigger_clean_expired_locations ON public.locations;
CREATE TRIGGER trigger_clean_expired_locations
AFTER INSERT ON public.locations
EXECUTE FUNCTION clean_expired_locations();

-- Enable real-time for the locations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
