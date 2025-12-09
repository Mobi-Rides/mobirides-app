-- Comprehensive RLS Recursion Fix (Final Clean)
-- Purpose: Fix infinite recursion in Admins and Storage
-- Removed legacy 'messages' table logic as requested

-- 1. Ensure is_admin function is SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  );
$$;

-- 2. Ensure is_super_admin function is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true
  );
$$;

DO $$
BEGIN
  -- ===================================================================
  -- STEP 1: Fix Admins Table Policies (Recursion Source)
  -- ===================================================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admins') THEN
    -- Drop existing policies to be safe
    DROP POLICY IF EXISTS "Anyone can view admin list" ON public.admins;
    DROP POLICY IF EXISTS "Admins are viewable by everyone" ON public.admins;

    -- Create safe policies
    -- Allow anyone to read the admin list (needed for basic checks, recursion-free)
    CREATE POLICY "Admins are viewable by everyone" 
    ON public.admins FOR SELECT 
    USING (true);

    -- Only Super Admins can modify, using the SECURITY DEFINER function
    -- Drop potentially recursive modification policies first
    DROP POLICY IF EXISTS "Super admins can create new admins" ON public.admins;
    DROP POLICY IF EXISTS "Super admins can insert admins" ON public.admins;
    DROP POLICY IF EXISTS "Super admins can update admin records" ON public.admins;
    DROP POLICY IF EXISTS "Super admins can update admins" ON public.admins;
    DROP POLICY IF EXISTS "Super admins can delete admin records" ON public.admins;
    DROP POLICY IF EXISTS "Super admins can delete admins" ON public.admins;

    CREATE POLICY "Super admins can insert admins" 
    ON public.admins FOR INSERT 
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "Super admins can update admins" 
    ON public.admins FOR UPDATE 
    USING (public.is_super_admin());

    CREATE POLICY "Super admins can delete admins" 
    ON public.admins FOR DELETE 
    USING (public.is_super_admin());
  END IF;

  -- ===================================================================
  -- STEP 2: Fix Storage Policies (Recursion Trigger)
  -- ===================================================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- Drop potentially recursive admin policies
    DROP POLICY IF EXISTS "verification_admin_read_all" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can view all verification files" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can view all license verifications" ON storage.objects;

    -- Create safe admin read policy using the SECURITY DEFINER function
    CREATE POLICY "Admins can view all verification files"
    ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
      AND
      public.is_admin()
    );

    -- Ensure user policies exist and are correct (idempotent)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'Users can manage their verification files') THEN
      CREATE POLICY "Users can manage their verification files"
      ON storage.objects FOR ALL
      USING (
        bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
    END IF;
  END IF;

  -- ===================================================================
  -- STEP 3: Cleanup Legacy Messages Table (If it still exists)
  -- ===================================================================
  -- User requested to remove public.messages if it exists
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    DROP TABLE public.messages CASCADE;
  END IF;

END $$;

COMMENT ON FUNCTION public.is_admin() IS 'SECURITY DEFINER check to prevent RLS recursion';
COMMENT ON POLICY "Admins are viewable by everyone" ON public.admins IS 'Public access to admin list to prevent recursion during admin checks';
