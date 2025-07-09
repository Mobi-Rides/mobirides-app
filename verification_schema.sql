-- =====================================================
-- MOBIRIDES VERIFICATION SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This schema supports the complete KYC/Identity verification system
-- with Botswana-specific requirements

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

CREATE TYPE verification_status AS ENUM (
    'not_started',
    'in_progress', 
    'completed',
    'failed',
    'rejected',
    'pending_review'
);

CREATE TYPE verification_step AS ENUM (
    'personal_info',
    'document_upload',
    'selfie_verification', 
    'phone_verification',
    'address_confirmation',
    'review_submit',
    'processing_status',
    'completion'
);

CREATE TYPE document_type AS ENUM (
    'national_id_front',        -- Omang front
    'national_id_back',         -- Omang back
    'driving_license_front',
    'driving_license_back', 
    'proof_of_address',         -- Utility bill/bank statement
    'vehicle_registration',     -- For hosts only
    'vehicle_ownership',        -- For hosts only
    'proof_of_income',          -- Optional
    'selfie_photo'
);

CREATE TYPE verification_method AS ENUM (
    'document',
    'utility_bill',
    'bank_statement',
    'manual_review'
);

-- =====================================================
-- MAIN VERIFICATION TABLE
-- =====================================================

CREATE TABLE user_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    current_step verification_step NOT NULL DEFAULT 'personal_info',
    overall_status verification_status NOT NULL DEFAULT 'not_started',
    user_role TEXT NOT NULL CHECK (user_role IN ('renter', 'host')),
    is_host_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Verification expiry (if applicable)
    
    -- Admin fields
    admin_notes TEXT,
    rejection_reasons TEXT[],
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    referral_source TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id),
    CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- =====================================================
-- STEP STATUS TRACKING TABLE
-- =====================================================

CREATE TABLE verification_step_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES user_verifications(id) ON DELETE CASCADE,
    step verification_step NOT NULL,
    status verification_status NOT NULL DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(verification_id, step),
    CHECK (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at))
);

-- =====================================================
-- PERSONAL INFORMATION TABLE
-- =====================================================

CREATE TABLE verification_personal_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES user_verifications(id) ON DELETE CASCADE,
    
    -- Basic info
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    national_id_number TEXT NOT NULL, -- Omang number
    phone_number TEXT NOT NULL,       -- Format: +267XXXXXXXX
    email TEXT NOT NULL,
    
    -- Address
    street_address TEXT NOT NULL,
    area_suburb TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'Botswana',
    
    -- Emergency contact
    emergency_contact_name TEXT NOT NULL,
    emergency_contact_relationship TEXT NOT NULL,
    emergency_contact_phone TEXT NOT NULL,
    
    -- Validation flags
    is_validated BOOLEAN NOT NULL DEFAULT FALSE,
    validation_errors JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(verification_id),
    CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years'), -- Must be 18+
    CHECK (phone_number ~ '^\+267\d{8}$'), -- Botswana phone format
    CHECK (emergency_contact_phone ~ '^\+267\d{8}$'),
    CHECK (length(national_id_number) = 9 AND national_id_number ~ '^\d{9}$') -- Omang format
);

-- =====================================================
-- DOCUMENT UPLOADS TABLE  
-- =====================================================

CREATE TABLE verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES user_verifications(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    
    -- File information
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Storage path/URL
    file_size BIGINT NOT NULL,
    file_mime_type TEXT NOT NULL,
    file_hash TEXT, -- For deduplication/integrity
    
    -- Document metadata
    document_number TEXT, -- License number, ID number, etc.
    issue_date DATE,
    expiry_date DATE,
    issuing_authority TEXT,
    
    -- Validation
    status verification_status NOT NULL DEFAULT 'pending_review',
    validation_result JSONB, -- AI/manual validation results
    rejection_reason TEXT,
    
    -- Processing
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES profiles(id), -- Admin who processed
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(verification_id, document_type),
    CHECK (file_size > 0 AND file_size <= 5242880), -- Max 5MB
    CHECK (file_mime_type IN ('image/jpeg', 'image/png', 'application/pdf')),
    CHECK (expiry_date IS NULL OR expiry_date > issue_date)
);

-- =====================================================
-- PHONE VERIFICATION TABLE
-- =====================================================

CREATE TABLE verification_phone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES user_verifications(id) ON DELETE CASCADE,
    
    -- Phone details
    phone_number TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT '+267',
    
    -- Verification process
    verification_code TEXT, -- Encrypted/hashed OTP
    verification_code_expires_at TIMESTAMPTZ,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    
    -- Attempt tracking
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    blocked_until TIMESTAMPTZ,
    
    -- SMS tracking
    sms_provider TEXT, -- Which SMS service used
    sms_message_id TEXT, -- Provider message ID
    sms_cost DECIMAL(10,4), -- Cost tracking
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(verification_id),
    CHECK (phone_number ~ '^\+267\d{8}$'),
    CHECK (attempt_count >= 0 AND attempt_count <= max_attempts),
    CHECK (verified_at IS NULL OR is_verified = TRUE)
);

-- =====================================================
-- ADDRESS CONFIRMATION TABLE
-- =====================================================

CREATE TABLE verification_address (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES user_verifications(id) ON DELETE CASCADE,
    
    -- Address to confirm
    street_address TEXT NOT NULL,
    area_suburb TEXT NOT NULL, 
    city TEXT NOT NULL,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'Botswana',
    
    -- Confirmation method and status
    confirmation_method verification_method NOT NULL,
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES profiles(id), -- Admin who confirmed
    
    -- Supporting documents
    supporting_document_id UUID REFERENCES verification_documents(id),
    
    -- Validation
    validation_notes TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(verification_id),
    CHECK (confirmed_at IS NULL OR is_confirmed = TRUE)
);

-- =====================================================
-- VERIFICATION AUDIT LOG
-- =====================================================

CREATE TABLE verification_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES user_verifications(id) ON DELETE CASCADE,
    
    -- Action details
    action TEXT NOT NULL, -- 'step_completed', 'document_uploaded', 'status_changed', etc.
    step verification_step,
    old_status verification_status,
    new_status verification_status,
    
    -- Actor
    performed_by UUID REFERENCES profiles(id), -- User or admin
    performed_by_type TEXT NOT NULL CHECK (performed_by_type IN ('user', 'admin', 'system')),
    
    -- Details
    description TEXT,
    metadata JSONB, -- Additional context/data
    
    -- Request info
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- VERIFICATION SETTINGS/CONFIG
-- =====================================================

CREATE TABLE verification_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Document requirements
    required_documents_renter document_type[] NOT NULL DEFAULT ARRAY['national_id_front', 'national_id_back', 'driving_license_front', 'driving_license_back', 'proof_of_address'],
    required_documents_host document_type[] NOT NULL DEFAULT ARRAY['national_id_front', 'national_id_back', 'driving_license_front', 'driving_license_back', 'proof_of_address', 'vehicle_registration', 'vehicle_ownership'],
    
    -- Processing settings
    auto_approval_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    manual_review_required BOOLEAN NOT NULL DEFAULT TRUE,
    verification_expiry_days INTEGER DEFAULT NULL, -- NULL = never expires
    
    -- Rate limiting
    max_attempts_per_day INTEGER NOT NULL DEFAULT 3,
    max_phone_attempts INTEGER NOT NULL DEFAULT 3,
    phone_cooldown_minutes INTEGER NOT NULL DEFAULT 1,
    
    -- File upload limits
    max_file_size_mb INTEGER NOT NULL DEFAULT 5,
    allowed_file_types TEXT[] NOT NULL DEFAULT ARRAY['image/jpeg', 'image/png', 'application/pdf'],
    
    -- Active config
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Only one active config at a time
    EXCLUDE USING gist (
        tstzrange(effective_from, effective_until, '[)') WITH &&
    ) WHERE (is_active = TRUE)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Main verification table indexes
CREATE INDEX idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX idx_user_verifications_status ON user_verifications(overall_status);
CREATE INDEX idx_user_verifications_created_at ON user_verifications(created_at);
CREATE INDEX idx_user_verifications_step_status ON user_verifications(current_step, overall_status);

-- Step status indexes
CREATE INDEX idx_verification_step_statuses_verification_id ON verification_step_statuses(verification_id);
CREATE INDEX idx_verification_step_statuses_step ON verification_step_statuses(step);
CREATE INDEX idx_verification_step_statuses_status ON verification_step_statuses(status);

-- Document indexes
CREATE INDEX idx_verification_documents_verification_id ON verification_documents(verification_id);
CREATE INDEX idx_verification_documents_type ON verification_documents(document_type);
CREATE INDEX idx_verification_documents_status ON verification_documents(status);
CREATE INDEX idx_verification_documents_created_at ON verification_documents(created_at);

-- Phone verification indexes
CREATE INDEX idx_verification_phone_verification_id ON verification_phone(verification_id);
CREATE INDEX idx_verification_phone_phone_number ON verification_phone(phone_number);
CREATE INDEX idx_verification_phone_verified ON verification_phone(is_verified);

-- Address verification indexes
CREATE INDEX idx_verification_address_verification_id ON verification_address(verification_id);
CREATE INDEX idx_verification_address_confirmed ON verification_address(is_confirmed);

-- Audit log indexes
CREATE INDEX idx_verification_audit_log_verification_id ON verification_audit_log(verification_id);
CREATE INDEX idx_verification_audit_log_action ON verification_audit_log(action);
CREATE INDEX idx_verification_audit_log_created_at ON verification_audit_log(created_at);
CREATE INDEX idx_verification_audit_log_performed_by ON verification_audit_log(performed_by);

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON user_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_step_statuses_updated_at BEFORE UPDATE ON verification_step_statuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_personal_info_updated_at BEFORE UPDATE ON verification_personal_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_documents_updated_at BEFORE UPDATE ON verification_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_phone_updated_at BEFORE UPDATE ON verification_phone FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_address_updated_at BEFORE UPDATE ON verification_address FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_config_updated_at BEFORE UPDATE ON verification_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create audit log entries
CREATE OR REPLACE FUNCTION create_verification_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.overall_status != NEW.overall_status THEN
        INSERT INTO verification_audit_log (
            verification_id,
            action,
            old_status,
            new_status,
            performed_by_type,
            description
        ) VALUES (
            NEW.id,
            'status_changed',
            OLD.overall_status,
            NEW.overall_status,
            'system',
            'Status changed from ' || OLD.overall_status || ' to ' || NEW.overall_status
        );
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.current_step != NEW.current_step THEN
        INSERT INTO verification_audit_log (
            verification_id,
            action,
            step,
            performed_by_type,
            description
        ) VALUES (
            NEW.id,
            'step_changed',
            NEW.current_step,
            'system',
            'Step changed from ' || OLD.current_step || ' to ' || NEW.current_step
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER user_verifications_audit_trigger 
    AFTER UPDATE ON user_verifications 
    FOR EACH ROW EXECUTE FUNCTION create_verification_audit_log();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_step_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_phone ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_address ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verification data
CREATE POLICY "Users can view own verification" ON user_verifications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own step statuses" ON verification_step_statuses
    FOR ALL USING (
        verification_id IN (
            SELECT id FROM user_verifications WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own personal info" ON verification_personal_info
    FOR ALL USING (
        verification_id IN (
            SELECT id FROM user_verifications WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own documents" ON verification_documents
    FOR ALL USING (
        verification_id IN (
            SELECT id FROM user_verifications WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own phone verification" ON verification_phone
    FOR ALL USING (
        verification_id IN (
            SELECT id FROM user_verifications WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own address verification" ON verification_address
    FOR ALL USING (
        verification_id IN (
            SELECT id FROM user_verifications WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own audit log" ON verification_audit_log
    FOR SELECT USING (
        verification_id IN (
            SELECT id FROM user_verifications WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user is verified
CREATE OR REPLACE FUNCTION is_user_verified(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_verifications 
        WHERE user_id = user_uuid 
        AND overall_status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user verification status
CREATE OR REPLACE FUNCTION get_user_verification_status(user_uuid UUID)
RETURNS TABLE (
    verification_id UUID,
    current_step verification_step,
    overall_status verification_status,
    progress_percentage NUMERIC,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uv.id,
        uv.current_step,
        uv.overall_status,
        ROUND(
            (SELECT COUNT(*) FROM verification_step_statuses vss 
             WHERE vss.verification_id = uv.id AND vss.status = 'completed') * 100.0 / 
            (SELECT COUNT(*) FROM verification_step_statuses vss2 
             WHERE vss2.verification_id = uv.id), 2
        ) as progress_percentage,
        uv.created_at,
        uv.updated_at
    FROM user_verifications uv
    WHERE uv.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA INSERTION (for testing)
-- =====================================================

-- Insert default configuration
INSERT INTO verification_config (
    required_documents_renter,
    required_documents_host,
    auto_approval_enabled,
    manual_review_required
) VALUES (
    ARRAY['national_id_front', 'national_id_back', 'driving_license_front', 'driving_license_back', 'proof_of_address'],
    ARRAY['national_id_front', 'national_id_back', 'driving_license_front', 'driving_license_back', 'proof_of_address', 'vehicle_registration', 'vehicle_ownership'],
    FALSE,
    TRUE
);

-- =====================================================
-- NOTES FOR IMPLEMENTATION
-- =====================================================

/*
INTEGRATION NOTES:

1. **File Storage**: 
   - Use Supabase Storage for document files
   - Store file paths in verification_documents.file_path
   - Implement file cleanup for rejected/expired verifications

2. **SMS Integration**:
   - Integrate with SMS providers (Twilio, AWS SNS, etc.)
   - Store provider details in verification_phone table
   - Implement rate limiting and cost tracking

3. **AI Document Validation**:
   - Use OCR services to extract document data
   - Store validation results in verification_documents.validation_result
   - Implement confidence scoring

4. **Admin Dashboard**:
   - Create admin views for manual verification review
   - Implement bulk actions for processing
   - Add verification analytics and reporting

5. **Notifications**:
   - Send email/SMS notifications for status changes
   - Create notification templates for different stages
   - Track notification delivery status

6. **API Endpoints Needed**:
   - POST /api/verification/start
   - PUT /api/verification/personal-info
   - POST /api/verification/documents
   - POST /api/verification/phone/send-code
   - POST /api/verification/phone/verify-code
   - PUT /api/verification/address
   - POST /api/verification/submit
   - GET /api/verification/status

7. **Security Considerations**:
   - Encrypt sensitive data (phone codes, personal info)
   - Implement rate limiting on all endpoints
   - Log all verification actions for audit
   - Use HTTPS for all document uploads
   - Implement document virus scanning

8. **Compliance Requirements**:
   - GDPR/Data protection compliance
   - Document retention policies
   - User consent management
   - Right to deletion implementation
*/
