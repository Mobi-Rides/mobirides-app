-- =====================================================
-- Remake User Verification Policies
-- Comprehensive RLS policies for verification system
-- =====================================================

-- Drop all existing verification policies
DROP POLICY IF EXISTS "Users can manage their verification" ON public.user_verifications;
DROP POLICY IF EXISTS "Users can manage their documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Users can manage their phone verification" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can view their address verification" ON public.verification_address;
DROP POLICY IF EXISTS "Users can update their address verification" ON public.verification_address;

-- =====================================================
-- USER_VERIFICATIONS POLICIES
-- =====================================================

-- Allow users to view their own verification data
CREATE POLICY "Users can view own verification"
    ON public.user_verifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own verification record
CREATE POLICY "Users can create own verification"
    ON public.user_verifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own verification data
CREATE POLICY "Users can update own verification"
    ON public.user_verifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own verification data (optional)
CREATE POLICY "Users can delete own verification"
    ON public.user_verifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Admin policy for verification management
CREATE POLICY "Admins can manage all verifications"
    ON public.user_verifications
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- VERIFICATION_DOCUMENTS POLICIES
-- =====================================================

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
    ON public.verification_documents
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to upload their own documents
CREATE POLICY "Users can upload own documents"
    ON public.verification_documents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own documents
CREATE POLICY "Users can update own documents"
    ON public.verification_documents
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
    ON public.verification_documents
    FOR DELETE
    USING (auth.uid() = user_id);

-- Admin policy for document management
CREATE POLICY "Admins can manage all documents"
    ON public.verification_documents
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- PHONE_VERIFICATIONS POLICIES
-- =====================================================

-- Allow users to view their own phone verification
CREATE POLICY "Users can view own phone verification"
    ON public.phone_verifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to create their own phone verification
CREATE POLICY "Users can create own phone verification"
    ON public.phone_verifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own phone verification
CREATE POLICY "Users can update own phone verification"
    ON public.phone_verifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own phone verification
CREATE POLICY "Users can delete own phone verification"
    ON public.phone_verifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Admin policy for phone verification management
CREATE POLICY "Admins can manage all phone verifications"
    ON public.phone_verifications
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- VERIFICATION_ADDRESS POLICIES
-- =====================================================

-- Allow users to view their own address verification
CREATE POLICY "Users can view own address verification"
    ON public.verification_address
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT uv.user_id 
            FROM public.user_verifications uv 
            WHERE uv.id = verification_address.verification_id
        )
    );

-- Allow users to create their own address verification
CREATE POLICY "Users can create own address verification"
    ON public.verification_address
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT uv.user_id 
            FROM public.user_verifications uv 
            WHERE uv.id = verification_address.verification_id
        )
    );

-- Allow users to update their own address verification
CREATE POLICY "Users can update own address verification"
    ON public.verification_address
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT uv.user_id 
            FROM public.user_verifications uv 
            WHERE uv.id = verification_address.verification_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT uv.user_id 
            FROM public.user_verifications uv 
            WHERE uv.id = verification_address.verification_id
        )
    );

-- Allow users to delete their own address verification
CREATE POLICY "Users can delete own address verification"
    ON public.verification_address
    FOR DELETE
    USING (
        auth.uid() IN (
            SELECT uv.user_id 
            FROM public.user_verifications uv 
            WHERE uv.id = verification_address.verification_id
        )
    );

-- Admin policy for address verification management
CREATE POLICY "Admins can manage all address verifications"
    ON public.verification_address
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user owns verification record
CREATE OR REPLACE FUNCTION user_owns_verification(verification_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_verifications 
        WHERE id = verification_uuid AND user_id = auth.uid()
    );
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION user_owns_verification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- =====================================================
-- ENABLE REALTIME (OPTIONAL)
-- =====================================================

-- Enable realtime for verification status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.phone_verifications;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Users can view own verification" ON public.user_verifications IS 
'Allow authenticated users to view their own verification records';

COMMENT ON POLICY "Users can view own documents" ON public.verification_documents IS 
'Allow authenticated users to view their own uploaded documents';

COMMENT ON POLICY "Users can view own phone verification" ON public.phone_verifications IS 
'Allow authenticated users to view their own phone verification records';

COMMENT ON POLICY "Users can view own address verification" ON public.verification_address IS 
'Allow authenticated users to view their own address verification records';

COMMENT ON FUNCTION user_owns_verification(UUID) IS 
'Security function to check if authenticated user owns a verification record';

COMMENT ON FUNCTION is_admin() IS 
'Security function to check if authenticated user has admin privileges';
