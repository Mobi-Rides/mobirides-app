-- Add claim notification types and helper function
-- This migration enables in-app notifications for insurance claims

-- Add claim notification types to enum
DO $$ 
BEGIN
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'claim_submitted';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'claim_status_updated';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Create helper function for claim notifications
CREATE OR REPLACE FUNCTION public.create_claim_notification(
    p_user_id UUID,
    p_claim_number TEXT,
    p_status TEXT,
    p_is_new_claim BOOLEAN DEFAULT FALSE
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_title TEXT;
    v_description TEXT;
    v_notification_type notification_type;
BEGIN
    IF p_is_new_claim THEN
        v_title := 'Claim Submitted';
        v_description := 'Your insurance claim ' || p_claim_number || ' has been submitted and is under review.';
        v_notification_type := 'claim_submitted';
    ELSE
        v_title := 'Claim Status Updated';
        CASE p_status
            WHEN 'approved' THEN
                v_description := 'Great news! Your claim ' || p_claim_number || ' has been approved.';
            WHEN 'rejected' THEN
                v_description := 'Your claim ' || p_claim_number || ' has been rejected. Please check for details.';
            WHEN 'paid' THEN
                v_description := 'Your claim ' || p_claim_number || ' payout has been processed.';
            WHEN 'under_review' THEN
                v_description := 'Your claim ' || p_claim_number || ' is now under review.';
            WHEN 'more_info_needed' THEN
                v_description := 'Additional information is required for claim ' || p_claim_number || '.';
            ELSE
                v_description := 'Your claim ' || p_claim_number || ' status has been updated to: ' || p_status;
        END CASE;
        v_notification_type := 'claim_status_updated';
    END IF;
    
    INSERT INTO notifications (
        user_id, 
        type, 
        title,
        description,
        is_read,
        role_target,
        metadata
    ) VALUES (
        p_user_id,
        v_notification_type,
        v_title,
        v_description,
        false,
        'renter_only'::notification_role,
        jsonb_build_object('claim_number', p_claim_number, 'status', p_status)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create claim notification: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.create_claim_notification IS 'Creates in-app notification for insurance claim events';
