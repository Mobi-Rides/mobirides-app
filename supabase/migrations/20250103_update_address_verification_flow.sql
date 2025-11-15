-- Update User Verification Flow - Remove Address Confirmation Step
-- This migration updates existing users to have address_confirmed = true
-- and implements new verification completion logic

-- Update all existing users to have address_confirmed = true
UPDATE user_verifications 
SET 
    address_confirmed = true,
    last_updated_at = NOW()
WHERE 
    address_confirmed = false 
    OR address_confirmed IS NULL;

-- Update current_step for users who were stuck on address confirmation
UPDATE user_verifications
SET
    current_step = CASE
        WHEN current_step = 'address_confirmation' THEN 'completion'
        ELSE current_step
    END,
    last_updated_at = NOW()
WHERE
    current_step = 'address_confirmation';

-- Update overall_status for completed verifications
UPDATE user_verifications 
SET 
    overall_status = 'completed',
    completed_at = NOW(),
    last_updated_at = NOW()
WHERE 
    personal_info_completed = true 
    AND documents_completed = true 
    AND selfie_completed = true 
    AND phone_verified = true 
    AND address_confirmed = true 
    AND overall_status != 'completed';

-- Create or replace the verification completion function
CREATE OR REPLACE FUNCTION check_verification_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-complete address verification for new records
    IF NEW.address_confirmed IS NULL THEN
        NEW.address_confirmed := true;
    END IF;
    
    -- Check if all steps are completed
    IF NEW.personal_info_completed = true 
       AND NEW.documents_completed = true 
       AND NEW.selfie_completed = true 
       AND NEW.phone_verified = true 
       AND NEW.address_confirmed = true 
       AND NEW.overall_status != 'completed' THEN
        
        NEW.overall_status := 'completed';
        NEW.completed_at := NOW();
        NEW.current_step := 'COMPLETION';
    END IF;
    
    NEW.last_updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS verification_completion_trigger ON user_verifications;
CREATE TRIGGER verification_completion_trigger
    BEFORE UPDATE ON user_verifications
    FOR EACH ROW
    EXECUTE FUNCTION check_verification_completion();

-- Create trigger for INSERT operations to auto-complete address verification
DROP TRIGGER IF EXISTS verification_insert_trigger ON user_verifications;
CREATE TRIGGER verification_insert_trigger
    BEFORE INSERT ON user_verifications
    FOR EACH ROW
    EXECUTE FUNCTION check_verification_completion();

-- Add comment for documentation
COMMENT ON FUNCTION check_verification_completion() IS 'Automatically completes address verification and updates overall status when all verification steps are completed';