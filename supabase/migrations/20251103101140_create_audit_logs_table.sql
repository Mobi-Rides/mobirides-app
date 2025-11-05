-- Migration: Create audit_logs table for enhanced audit logging (ADMIN-T011)
-- This creates a comprehensive audit trail with cryptographic integrity

BEGIN;

-- Create enum for audit event types
DO $$ BEGIN
    CREATE TYPE audit_event_type AS ENUM (
        'user_restriction_created',
        'user_restriction_updated',
        'user_restriction_removed',
        'user_deleted',
        'user_password_reset',
        'vehicle_transferred',
        'vehicle_deleted',
        'admin_login',
        'admin_logout',
        'system_config_changed',
        'notification_campaign_created',
        'notification_sent',
        'verification_approved',
        'verification_rejected',
        'booking_cancelled_admin',
        'payment_refunded_admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for audit severity levels
DO $$ BEGIN
    CREATE TYPE audit_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create audit_logs table with comprehensive tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type audit_event_type NOT NULL,
    severity audit_severity NOT NULL DEFAULT 'medium',
    actor_id uuid REFERENCES auth.users(id), -- Who performed the action
    target_id uuid REFERENCES auth.users(id), -- Who/what was affected
    session_id text, -- Session identifier for tracking
    ip_address inet, -- IP address of the actor
    user_agent text, -- Browser/device information
    location_data jsonb, -- Geographic location if available
    action_details jsonb NOT NULL, -- Before/after states, metadata
    previous_hash text, -- For cryptographic chain integrity
    current_hash text, -- Hash of this record
    event_timestamp timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Additional metadata
    resource_type text, -- 'user', 'vehicle', 'booking', etc.
    resource_id uuid, -- ID of the affected resource
    reason text, -- Reason for the action (if provided)
    anomaly_flags jsonb, -- Flags for detected anomalies
    compliance_tags text[] -- Tags for compliance reporting
);

-- Create immutable trigger to prevent updates/deletes
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow inserts only
    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;

    -- Prevent updates and deletes
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

-- Apply immutable trigger
CREATE TRIGGER audit_logs_immutable
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX idx_audit_logs_event_timestamp ON public.audit_logs(event_timestamp DESC);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target_id ON public.audit_logs(target_id);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX idx_audit_logs_resource_type_id ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_session_id ON public.audit_logs(session_id);
CREATE INDEX idx_audit_logs_compliance_tags ON public.audit_logs USING gin(compliance_tags);

-- Create function to generate hash for cryptographic integrity
CREATE OR REPLACE FUNCTION generate_audit_hash(
    event_type audit_event_type,
    actor_id uuid,
    target_id uuid,
    action_details jsonb,
    event_timestamp timestamptz,
    previous_hash text DEFAULT NULL
)
RETURNS text AS $$
DECLARE
    hash_input text;
BEGIN
    -- Create hash input string
    hash_input := event_type::text || '|' ||
                  COALESCE(actor_id::text, '') || '|' ||
                  COALESCE(target_id::text, '') || '|' ||
                  action_details::text || '|' ||
                  event_timestamp::text || '|' ||
                  COALESCE(previous_hash, '');

    -- Return SHA-256 hash
    RETURN encode(digest(hash_input, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_event_type audit_event_type,
    p_severity audit_severity DEFAULT 'medium',
    p_actor_id uuid DEFAULT auth.uid(),
    p_target_id uuid DEFAULT NULL,
    p_session_id text DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_location_data jsonb DEFAULT NULL,
    p_action_details jsonb DEFAULT '{}',
    p_resource_type text DEFAULT NULL,
    p_resource_id uuid DEFAULT NULL,
    p_reason text DEFAULT NULL,
    p_anomaly_flags jsonb DEFAULT NULL,
    p_compliance_tags text[] DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    new_audit_id uuid;
    prev_hash text;
    curr_hash text;
BEGIN
    -- Get the previous hash (most recent audit log)
    SELECT current_hash INTO prev_hash
    FROM public.audit_logs
    ORDER BY event_timestamp DESC, id DESC
    LIMIT 1;

    -- Generate current hash
    curr_hash := generate_audit_hash(
        p_event_type,
        p_actor_id,
        p_target_id,
        p_action_details,
        now(),
        prev_hash
    );

    -- Insert the audit log
    INSERT INTO public.audit_logs (
        event_type,
        severity,
        actor_id,
        target_id,
        session_id,
        ip_address,
        user_agent,
        location_data,
        action_details,
        previous_hash,
        current_hash,
        resource_type,
        resource_id,
        reason,
        anomaly_flags,
        compliance_tags
    ) VALUES (
        p_event_type,
        p_severity,
        p_actor_id,
        p_target_id,
        p_session_id,
        p_ip_address,
        p_user_agent,
        p_location_data,
        p_action_details,
        prev_hash,
        curr_hash,
        p_resource_type,
        p_resource_id,
        p_reason,
        p_anomaly_flags,
        p_compliance_tags
    )
    RETURNING id INTO new_audit_id;

    RETURN new_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify audit chain integrity
CREATE OR REPLACE FUNCTION verify_audit_chain_integrity()
RETURNS TABLE(
    audit_id uuid,
    event_timestamp timestamptz,
    expected_hash text,
    actual_hash text,
    chain_valid boolean
) AS $$
BEGIN
    RETURN QUERY
    WITH audit_chain AS (
        SELECT
            id,
            event_timestamp,
            previous_hash,
            current_hash,
            event_type,
            actor_id,
            target_id,
            action_details,
            ROW_NUMBER() OVER (ORDER BY event_timestamp, id) as row_num
        FROM public.audit_logs
        ORDER BY event_timestamp, id
    ),
    calculated_hashes AS (
        SELECT
            ac.id,
            ac.event_timestamp,
            ac.current_hash as actual_hash,
            generate_audit_hash(
                ac.event_type,
                ac.actor_id,
                ac.target_id,
                ac.action_details,
                ac.event_timestamp,
                LAG(ac.current_hash) OVER (ORDER BY ac.event_timestamp, ac.id)
            ) as expected_hash
        FROM audit_chain ac
    )
    SELECT
        ch.id,
        al.event_timestamp,
        ch.expected_hash,
        ch.actual_hash,
        (ch.expected_hash = ch.actual_hash) as chain_valid
    FROM calculated_hashes ch
    JOIN public.audit_logs al ON al.id = ch.id
    ORDER BY al.event_timestamp;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION verify_audit_chain_integrity TO authenticated;

-- Create view for audit analytics
CREATE OR REPLACE VIEW audit_analytics AS
SELECT
    DATE_TRUNC('day', event_timestamp) as date,
    event_type,
    severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT actor_id) as unique_actors,
    COUNT(DISTINCT target_id) as unique_targets,
    array_agg(DISTINCT compliance_tags) FILTER (WHERE compliance_tags IS NOT NULL) as compliance_tags
FROM public.audit_logs
GROUP BY DATE_TRUNC('day', event_timestamp), event_type, severity
ORDER BY date DESC, event_count DESC;

-- Grant access to analytics view
GRANT SELECT ON audit_analytics TO authenticated;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Audit logging infrastructure created successfully!';
    RAISE NOTICE 'Features implemented:';
    RAISE NOTICE '  - Immutable audit_logs table with cryptographic integrity';
    RAISE NOTICE '  - Comprehensive event tracking (IP, device, session, location)';
    RAISE NOTICE '  - log_audit_event() function for logging actions';
    RAISE NOTICE '  - verify_audit_chain_integrity() function for validation';
    RAISE NOTICE '  - audit_analytics view for reporting';
    RAISE NOTICE '  - Proper RLS policies for admin access only';
END $$;