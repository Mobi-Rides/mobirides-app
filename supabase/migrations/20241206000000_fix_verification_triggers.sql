-- =====================================================
-- Fix Verification Trigger Function Mismatch
-- The trigger function was trying to update 'updated_at' 
-- but the user_verifications table has 'last_updated_at'
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_user_verifications_updated_at ON public.user_verifications;
DROP FUNCTION IF EXISTS update_verification_updated_at();

-- Create corrected function that updates the right field names
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- For user_verifications table, update last_updated_at
    IF TG_TABLE_NAME = 'user_verifications' THEN
        NEW.last_updated_at = NOW();
    END IF;
    
    -- For other tables that might have updated_at
    IF TG_TABLE_NAME = 'verification_address' THEN
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_verifications with correct function
CREATE TRIGGER update_user_verifications_updated_at 
    BEFORE UPDATE ON public.user_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for verification_address (this one is correct)
CREATE TRIGGER update_verification_address_updated_at 
    BEFORE UPDATE ON public.verification_address 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Also create a general trigger function for future use
CREATE OR REPLACE FUNCTION update_last_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_last_updated_at_column() TO authenticated;
