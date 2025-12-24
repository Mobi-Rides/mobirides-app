-- ============================================
-- INSURANCE POLICY EXPIRATION JOB
-- ============================================

-- Function to expire policies that have passed their end date
CREATE OR REPLACE FUNCTION expire_insurance_policies()
RETURNS void AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update policies where end_date < now() AND status is 'active'
  WITH updated AS (
    UPDATE public.insurance_policies
    SET 
      status = 'expired',
      updated_at = now()
    WHERE 
      status = 'active' 
      AND end_date < now()
    RETURNING id
  )
  SELECT count(*) INTO expired_count FROM updated;

  IF expired_count > 0 THEN
    RAISE NOTICE 'Expired % insurance policies', expired_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attempt to schedule with pg_cron if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule to run every hour
    PERFORM cron.schedule(
      'expire-policies-hourly',
      '0 * * * *', -- Every hour at minute 0
      'SELECT expire_insurance_policies()'
    );
    RAISE NOTICE 'Scheduled expire_insurance_policies with pg_cron';
  ELSE
    RAISE NOTICE 'pg_cron extension not found. Policy expiration must be triggered manually or via Edge Function.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Failed to schedule cron job: %', SQLERRM;
END;
$$;
