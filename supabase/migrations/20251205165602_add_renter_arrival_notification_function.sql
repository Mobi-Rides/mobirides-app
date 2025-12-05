-- Migration: Add renter arrival notification function
-- This function sends a notification to the host when a renter arrives at the pickup location
-- Fixed: Uses correct column names (brand instead of make, description instead of message, related_booking_id instead of booking_id)

-- Drop existing function if it exists with wrong signature
DROP FUNCTION IF EXISTS create_renter_arrival_notification(UUID, UUID);

-- Create function to notify host when renter arrives
CREATE OR REPLACE FUNCTION public.create_renter_arrival_notification(
  p_booking_id UUID,
  p_renter_id UUID
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id UUID;
  v_car_brand TEXT;
  v_car_model TEXT;
  v_notification_id BIGINT;
  v_car_location TEXT;
BEGIN
  -- Get host ID and car details from booking
  SELECT 
    c.owner_id,
    c.brand,
    c.model,
    c.location
  INTO 
    v_host_id,
    v_car_brand,
    v_car_model,
    v_car_location
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  WHERE b.id = p_booking_id;

  -- Check if host exists
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Host not found for booking %', p_booking_id;
  END IF;

  -- Create notification for host
  INSERT INTO notifications (
    user_id,
    type,
    title,
    description,
    related_booking_id,
    is_read,
    created_at,
    expires_at
  )
  VALUES (
    v_host_id,
    'arrival_notification'::notification_type,
    'Renter has arrived',
    format('The renter has arrived at %s for your %s %s. Please proceed to complete the handover process.', 
           COALESCE(v_car_location, 'the pickup location'), v_car_brand, v_car_model),
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
GRANT EXECUTE ON FUNCTION public.create_renter_arrival_notification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_renter_arrival_notification(UUID, UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION public.create_renter_arrival_notification(UUID, UUID) IS 'Creates a notification for the host when a renter arrives at the pickup location';