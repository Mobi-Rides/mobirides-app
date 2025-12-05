-- Migration: Extend Admin Capabilities with Audit Triggers (MOBI-501-3 & MOBI-501-4)
-- Adds database triggers for audit logging on user_roles table
-- Extends admin capabilities with additional functions and policies

BEGIN;

-- ============================================
-- AUDIT TRIGGERS FOR USER ROLES MANAGEMENT
-- ============================================

-- Function to handle user_roles audit logging
CREATE OR REPLACE FUNCTION audit_user_roles_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type audit_event_type;
    v_action_details jsonb;
    v_target_id uuid;
BEGIN
    -- Determine event type and details based on operation
    CASE TG_OP
        WHEN 'INSERT' THEN
            v_event_type := 'user_restriction_created'; -- Using existing enum, could be extended
            v_action_details := jsonb_build_object(
                'operation', 'role_assigned',
                'role', NEW.role,
                'assigned_by', NEW.assigned_by,
                'user_id', NEW.user_id
            );
            v_target_id := NEW.user_id;
        WHEN 'UPDATE' THEN
            v_event_type := 'user_restriction_updated'; -- Using existing enum
            v_action_details := jsonb_build_object(
                'operation', 'role_updated',
                'old_role', OLD.role,
                'new_role', NEW.role,
                'updated_by', NEW.assigned_by,
                'user_id', NEW.user_id
            );
            v_target_id := NEW.user_id;
        WHEN 'DELETE' THEN
            v_event_type := 'user_restriction_removed'; -- Using existing enum
            v_action_details := jsonb_build_object(
                'operation', 'role_removed',
                'role', OLD.role,
                'removed_by', auth.uid(),
                'user_id', OLD.user_id
            );
            v_target_id := OLD.user_id;
    END CASE;

    -- Log the audit event
    PERFORM public.log_audit_event(
        v_event_type,
        'medium',
        COALESCE(NEW.assigned_by, OLD.assigned_by, auth.uid()),
        v_target_id,
        NULL, -- session_id
        NULL, -- ip_address
        NULL, -- user_agent
        NULL, -- location_data
        v_action_details,
        'user',
        v_target_id,
        CASE TG_OP
            WHEN 'INSERT' THEN 'User role assigned'
            WHEN 'UPDATE' THEN 'User role updated'
            WHEN 'DELETE' THEN 'User role removed'
        END,
        NULL, -- anomaly_flags
        ARRAY['user-management', 'role-management']
    );

    -- Return appropriate value for trigger
    CASE TG_OP
        WHEN 'DELETE' THEN RETURN OLD;
        ELSE RETURN NEW;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers on user_roles table
CREATE TRIGGER user_roles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION audit_user_roles_changes();

-- ============================================
-- EXTENDED ADMIN CAPABILITIES
-- ============================================

-- Function to grant admin capabilities
CREATE OR REPLACE FUNCTION public.grant_admin_capability(
    p_admin_id uuid,
    p_capability_key text,
    p_granted_by uuid DEFAULT auth.uid(),
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.admin_capabilities
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor uuid := public.assert_admin(true); -- Require super admin
    v_capability public.admin_capabilities;
BEGIN
    IF p_admin_id IS NULL OR p_capability_key IS NULL THEN
        RAISE EXCEPTION 'grant_admin_capability: admin_id and capability_key are required';
    END IF;

    -- Check if admin exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'grant_admin_capability: target user must be an admin';
    END IF;

    -- Insert or update capability
    INSERT INTO public.admin_capabilities (
        admin_id,
        capability_key,
        granted_by,
        metadata
    ) VALUES (
        p_admin_id,
        p_capability_key,
        p_granted_by,
        p_metadata
    )
    ON CONFLICT (admin_id, capability_key) DO UPDATE SET
        granted_by = EXCLUDED.granted_by,
        metadata = EXCLUDED.metadata,
        updated_at = now()
    RETURNING * INTO v_capability;

    -- Log audit event
    PERFORM public.log_audit_event(
        'system_config_changed', -- Using existing enum
        'medium',
        v_actor,
        p_admin_id,
        NULL,
        NULL,
        NULL,
        NULL,
        jsonb_build_object(
            'operation', 'capability_granted',
            'capability_key', p_capability_key,
            'metadata', p_metadata
        ),
        'user',
        p_admin_id,
        format('Admin capability "%s" granted', p_capability_key),
        NULL,
        ARRAY['admin-management', 'capability-management']
    );

    RETURN v_capability;
END;
$$;

-- Function to revoke admin capabilities
CREATE OR REPLACE FUNCTION public.revoke_admin_capability(
    p_admin_id uuid,
    p_capability_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor uuid := public.assert_admin(true); -- Require super admin
    v_deleted integer := 0;
BEGIN
    IF p_admin_id IS NULL OR p_capability_key IS NULL THEN
        RAISE EXCEPTION 'revoke_admin_capability: admin_id and capability_key are required';
    END IF;

    -- Delete the capability
    DELETE FROM public.admin_capabilities
    WHERE admin_id = p_admin_id AND capability_key = p_capability_key;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    IF v_deleted > 0 THEN
        -- Log audit event
        PERFORM public.log_audit_event(
            'system_config_changed', -- Using existing enum
            'medium',
            v_actor,
            p_admin_id,
            NULL,
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'operation', 'capability_revoked',
                'capability_key', p_capability_key
            ),
            'user',
            p_admin_id,
            format('Admin capability "%s" revoked', p_capability_key),
            NULL,
            ARRAY['admin-management', 'capability-management']
        );
    END IF;

    RETURN v_deleted > 0;
END;
$$;

-- Function to check if admin has specific capability
CREATE OR REPLACE FUNCTION public.has_admin_capability(
    p_admin_id uuid,
    p_capability_key text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_capabilities
        WHERE admin_id = p_admin_id
        AND capability_key = p_capability_key
    );
$$;

-- ============================================
-- ADDITIONAL RLS POLICIES FOR ADMIN TABLES
-- ============================================

-- Ensure admin_capabilities has proper RLS (should already be enabled)
-- Add policy for super admins to manage all capabilities
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_capabilities'
        AND policyname = 'SuperAdmins manage all capabilities'
    ) THEN
        CREATE POLICY "SuperAdmins manage all capabilities"
            ON public.admin_capabilities
            FOR ALL
            TO authenticated
            USING (public.has_role(auth.uid(), 'super_admin'))
            WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
    END IF;
END $$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.grant_admin_capability(uuid, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_capability(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_capability(uuid, text) TO authenticated;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Admin capabilities extended successfully!';
    RAISE NOTICE 'Features implemented:';
    RAISE NOTICE '  - Audit triggers on user_roles table for role management logging';
    RAISE NOTICE '  - grant_admin_capability() function for assigning capabilities';
    RAISE NOTICE '  - revoke_admin_capability() function for removing capabilities';
    RAISE NOTICE '  - has_admin_capability() function for checking permissions';
    RAISE NOTICE '  - Enhanced RLS policies for super admin management';
END $$;
