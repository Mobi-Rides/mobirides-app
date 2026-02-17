-- Fix generate_audit_hash function to include extensions schema for pgcrypto digest()
-- This resolves "function digest(text, unknown) does not exist" errors in audit logging

ALTER FUNCTION public.generate_audit_hash(
    event_type audit_event_type,
    actor_id uuid,
    target_id uuid,
    action_details jsonb,
    event_timestamp timestamptz,
    previous_hash text
) SET search_path = public, extensions;