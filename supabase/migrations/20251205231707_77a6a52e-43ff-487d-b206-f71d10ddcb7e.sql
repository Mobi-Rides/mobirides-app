-- Fix 1: Admins table - restrict visibility to admins only
DROP POLICY IF EXISTS "Anyone can view admin list" ON admins;

CREATE POLICY "Only admins can view admin list"
ON admins FOR SELECT
USING (auth.uid() IN (SELECT id FROM admins));

-- Fix 2: Real-time locations - restrict to booking participants
DROP POLICY IF EXISTS "Anyone can read real-time locations" ON real_time_locations;

CREATE POLICY "Booking participants can view locations"
ON real_time_locations FOR SELECT
USING (
  -- User can see their own location
  host_id = auth.uid()
  OR
  -- Active booking participants can see each other's location
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.status = 'confirmed'
    AND (
      (b.renter_id = auth.uid() AND c.owner_id = real_time_locations.host_id)
      OR
      (c.owner_id = auth.uid() AND real_time_locations.host_id = auth.uid())
    )
  )
);