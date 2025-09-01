-- Migration: Add renter arrival notification function
-- This function sends a notification to the host when a renter arrives at the pickup location

-- Create function to notify host when renter arrives
CREATE OR REPLACE FUNCTION create_renter_arrival_notification(
  p_booking_id UUID,
  p_renter_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_host_id UUID;
  v_car_make TEXT;
  v_car_model TEXT;
  v_notification_id UUID;
  v_pickup_location TEXT;
BEGIN
  -- Get host ID and car details from booking
  SELECT 
    c.owner_id,
    c.make,
    c.model,
    b.pickup_location
  INTO 
    v_host_id,
    v_car_make,
    v_car_model,
    v_pickup_location
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  WHERE b.id = p_booking_id;

  -- Check if host exists
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Host not found for booking %', p_booking_id;
  END IF;

  -- Create notification for host
  INSERT INTO notifications (
    id,
    user_id,
    type,
    title,
    message,
    booking_id,
    is_read,
    created_at,
    expires_at
  )
  VALUES (
    gen_random_uuid(),
    v_host_id,
    'arrival_notification'::notification_type,
    'Renter has arrived',
    format('The renter has arrived at the pickup location for your %s %s. Please proceed to complete the handover process.', v_car_make, v_car_model),
    p_booking_id,
    false,
    NOW(),
    NOW() + INTERVAL '24 hours'
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_renter_arrival_notification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_renter_arrival_notification(UUID, UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION create_renter_arrival_notification(UUID, UUID) IS 'Creates a notification for the host when a renter arrives at the pickup location';