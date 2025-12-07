DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_health_metrics' AND table_schema = 'public') THEN
    INSERT INTO public.provider_health_metrics (provider, circuit_breaker_state, health_check_status)
    VALUES ('resend', 'CLOSED', true)
    ON CONFLICT (provider) DO NOTHING;
  END IF;
END $$;