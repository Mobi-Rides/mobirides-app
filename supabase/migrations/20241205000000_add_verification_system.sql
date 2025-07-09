-- =====================================================
-- Verification System Migration
-- Adds comprehensive verification tables and enums
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- VERIFICATION ENUMS
-- =====================================================

-- Verification status types for KYC process
CREATE TYPE verification_status AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'failed',
    'rejected',
    'pending_review'
);

-- Verification steps enum
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

-- Document types for verification
CREATE TYPE document_type AS ENUM (
    'national_id_front',
    'national_id_back',
    'driving_license_front',
    'driving_license_back',
    'proof_of_address',
    'vehicle_registration',
    'vehicle_ownership',
    'proof_of_income',
    'selfie_photo'
);

-- Address confirmation methods
CREATE TYPE verification_method AS ENUM (
    'document',
    'utility_bill',
    'bank_statement'
);

-- =====================================================
-- VERIFICATION TABLES
-- =====================================================

-- User verification data table
CREATE TABLE public.user_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_step verification_step DEFAULT 'personal_info',
    overall_status verification_status DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Personal information (JSON for flexibility)
    personal_info JSONB,
    
    -- Step completion status
    personal_info_completed BOOLEAN DEFAULT false,
    documents_completed BOOLEAN DEFAULT false,
    selfie_completed BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    address_confirmed BOOLEAN DEFAULT false,
    
    -- Admin fields
    admin_notes TEXT,
    rejection_reasons TEXT[],
    
    UNIQUE(user_id)
);

-- Document uploads table
CREATE TABLE public.verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    document_number TEXT,
    expiry_date DATE,
    status verification_status DEFAULT 'pending_review',
    rejection_reason TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, document_type)
);

-- Phone verification table
CREATE TABLE public.phone_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    country_code TEXT NOT NULL,
    verification_code TEXT,
    is_verified BOOLEAN DEFAULT false,
    attempt_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    
    UNIQUE(user_id)
);

-- Address confirmation table
CREATE TABLE public.verification_address (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL REFERENCES public.user_verifications(id) ON DELETE CASCADE,
    
    -- Address to confirm
    street_address TEXT NOT NULL,
    area_suburb TEXT NOT NULL, 
    city TEXT NOT NULL,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'Botswana',
    
    -- Confirmation method and status
    confirmation_method verification_method NOT NULL,
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by UUID REFERENCES public.profiles(id),
    
    -- Supporting documents
    supporting_document_id UUID REFERENCES public.verification_documents(id),
    
    -- Validation
    validation_notes TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(verification_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Verification indexes
CREATE INDEX idx_user_verifications_status ON public.user_verifications(overall_status);
CREATE INDEX idx_user_verifications_step ON public.user_verifications(current_step);
CREATE INDEX idx_verification_documents_user ON public.verification_documents(user_id);
CREATE INDEX idx_verification_documents_type ON public.verification_documents(document_type);
CREATE INDEX idx_verification_documents_status ON public.verification_documents(status);
CREATE INDEX idx_phone_verifications_phone ON public.phone_verifications(phone_number);
CREATE INDEX idx_verification_address_confirmed ON public.verification_address(is_confirmed);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all verification tables
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_address ENABLE ROW LEVEL SECURITY;

-- User verification policies
CREATE POLICY "Users can manage their verification" ON public.user_verifications FOR ALL USING (auth.uid() = user_id);

-- Document policies
CREATE POLICY "Users can manage their documents" ON public.verification_documents FOR ALL USING (auth.uid() = user_id);

-- Phone verification policies
CREATE POLICY "Users can manage their phone verification" ON public.phone_verifications FOR ALL USING (auth.uid() = user_id);

-- Address verification policies
CREATE POLICY "Users can view their address verification" ON public.verification_address 
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_verifications WHERE id = verification_address.verification_id
        )
    );

CREATE POLICY "Users can update their address verification" ON public.verification_address 
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_verifications WHERE id = verification_address.verification_id
        )
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update verification step
CREATE OR REPLACE FUNCTION update_verification_step(
    user_uuid UUID,
    new_step verification_step
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_verifications
    SET 
        current_step = new_step,
        last_updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN FOUND;
END;
$$;

-- Function to check verification completion
CREATE OR REPLACE FUNCTION check_verification_completion(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    verification_complete BOOLEAN;
BEGIN
    SELECT 
        personal_info_completed AND 
        documents_completed AND 
        phone_verified AND 
        address_confirmed
    INTO verification_complete
    FROM public.user_verifications
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(verification_complete, false);
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to verification tables
CREATE TRIGGER update_user_verifications_updated_at 
    BEFORE UPDATE ON public.user_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_verification_updated_at();

CREATE TRIGGER update_verification_address_updated_at 
    BEFORE UPDATE ON public.verification_address 
    FOR EACH ROW EXECUTE FUNCTION update_verification_updated_at();

-- =====================================================
-- UPDATE EXISTING PROFILES TABLE
-- =====================================================

-- Add verification status to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'verification_status'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN verification_status verification_status DEFAULT 'not_started',
        ADD COLUMN verification_completed_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN verification_rejected_reason TEXT;
        
        -- Create index on verification status
        CREATE INDEX idx_profiles_verification_status ON public.profiles(verification_status);
    END IF;
END
$$;
