
-- Enable pg_cron (might require dashboard action if this fails)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 1. Function to expire unpaid bookings
CREATE OR REPLACE FUNCTION expire_unpaid_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Log start
  RAISE NOTICE 'Running expire_unpaid_bookings...';
  
  FOR r IN 
    SELECT id FROM bookings 
    WHERE status = 'awaiting_payment' 
    AND payment_deadline < NOW()
  LOOP
    RAISE NOTICE 'Expiring booking %', r.id;
    
    UPDATE bookings 
    SET 
      status = 'cancelled', -- or 'expired' if enum supports it
      payment_status = 'expired',
      updated_at = NOW()
    WHERE id = r.id;
    
    -- Optional: Insert notification logic here
  END LOOP;
END;
$$;

-- 2. Function to release earnings (Batch)
CREATE OR REPLACE FUNCTION process_due_earnings_releases()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Running process_due_earnings_releases...';
  
  FOR r IN
    SELECT b.id 
    FROM bookings b
    WHERE b.status = 'completed'
    AND b.actual_end_date < (NOW() - INTERVAL '24 hours') -- 24h buffer
    AND NOT EXISTS (
      SELECT 1 FROM wallet_transactions wt 
      WHERE wt.booking_id = b.id AND wt.transaction_type = 'earnings_released'
    )
  LOOP
    BEGIN
      RAISE NOTICE 'Releasing earnings for booking %', r.id;
      PERFORM release_pending_earnings(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to release earnings for booking %: %', r.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- 3. Schedule the jobs (Idempotent)
-- Safely unschedule if exists
DO $$
BEGIN
  PERFORM cron.unschedule('expire-bookings-hourly');
EXCEPTION WHEN OTHERS THEN
  -- Ignore error if job doesn't exist
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('release-earnings-hourly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule Expire Bookings (Every Hour)
SELECT cron.schedule(
  'expire-bookings-hourly',
  '0 * * * *', 
  $$SELECT expire_unpaid_bookings()$$
);

-- Schedule Release Earnings (Every Hour)
SELECT cron.schedule(
  'release-earnings-hourly',
  '0 * * * *', 
  $$SELECT process_due_earnings_releases()$$
);
