-- Add Admin Access to Verification Tables
-- Purpose: Allow admins to view all verification records, not just their own.

DO $$
BEGIN
  -- 1. user_verifications
  DROP POLICY IF EXISTS "Admins can view all verifications" ON public.user_verifications;
  CREATE POLICY "Admins can view all verifications"
    ON public.user_verifications
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "Admins can update all verifications" ON public.user_verifications;
  CREATE POLICY "Admins can update all verifications"
    ON public.user_verifications
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

  -- 2. verification_documents
  DROP POLICY IF EXISTS "Admins can view all documents" ON public.verification_documents;
  CREATE POLICY "Admins can view all documents"
    ON public.verification_documents
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );
    
  DROP POLICY IF EXISTS "Admins can update all documents" ON public.verification_documents;
  CREATE POLICY "Admins can update all documents"
    ON public.verification_documents
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

  -- 3. phone_verifications
  DROP POLICY IF EXISTS "Admins can view all phone verifications" ON public.phone_verifications;
  CREATE POLICY "Admins can view all phone verifications"
    ON public.phone_verifications
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

  -- 4. verification_address
  DROP POLICY IF EXISTS "Admins can view all address verifications" ON public.verification_address;
  CREATE POLICY "Admins can view all address verifications"
    ON public.verification_address
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

END $$;
