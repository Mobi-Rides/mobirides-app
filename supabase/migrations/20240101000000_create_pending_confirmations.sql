-- Create pending_confirmations table for email confirmation tokens
CREATE TABLE IF NOT EXISTS public.pending_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    password TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on pending_confirmations
ALTER TABLE public.pending_confirmations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pending_confirmations
-- Only allow service role to access this table (backend operations)
DROP POLICY IF EXISTS "Service role can manage pending confirmations" ON public.pending_confirmations;
CREATE POLICY "Service role can manage pending confirmations"
ON public.pending_confirmations
FOR ALL
USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pending_confirmations_token ON public.pending_confirmations(token);
CREATE INDEX IF NOT EXISTS idx_pending_confirmations_expires_at ON public.pending_confirmations(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_confirmations_email ON public.pending_confirmations(email);

-- Create function to automatically clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_confirmations()
RETURNS void AS $$
BEGIN
    DELETE FROM public.pending_confirmations 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_confirmations() TO service_role;

-- Create a scheduled job to run cleanup every hour (using pg_cron if available)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-expired-confirmations', '0 * * * *', 'SELECT cleanup_expired_confirmations();');

-- Alternative: Create a trigger-based cleanup on insert
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_confirmations()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up expired tokens on every insert (with some probability to avoid overhead)
    IF random() < 0.1 THEN -- 10% chance to run cleanup
        PERFORM cleanup_expired_confirmations();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_expired_confirmations_trigger ON public.pending_confirmations;
CREATE TRIGGER cleanup_expired_confirmations_trigger
    AFTER INSERT ON public.pending_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_expired_confirmations();

-- Grant necessary permissions to service role
GRANT ALL PRIVILEGES ON public.pending_confirmations TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;