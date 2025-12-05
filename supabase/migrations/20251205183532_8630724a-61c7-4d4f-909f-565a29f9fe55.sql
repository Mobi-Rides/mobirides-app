-- Insert default provider records with correct constraint values
INSERT INTO public.provider_health_metrics (provider, circuit_breaker_state, health_check_status)
VALUES 
    ('resend', 'CLOSED', true)
ON CONFLICT (provider) DO NOTHING;