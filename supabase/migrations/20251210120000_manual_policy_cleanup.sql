-- Manual Cleanup of Specific Policies to Fix Recursion
-- Explicitly drops known policies one by one to avoid "ownership" errors on system policies.

DO $$
DECLARE
  -- Helper to safely drop a policy on storage.objects
  proc_drop_storage_policy text := '
    CREATE OR REPLACE FUNCTION pg_temp.safe_drop_storage_policy(p_name text) RETURNS void AS $fn$
    BEGIN
      EXECUTE format(''DROP POLICY IF EXISTS %I ON storage.objects'', p_name);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING ''Could not drop policy % on storage.objects: %'', p_name, SQLERRM;
    END;
    $fn$ LANGUAGE plpgsql;
  ';
BEGIN
  -- Execute the helper function creation
  EXECUTE proc_drop_storage_policy;
  
  -- 1. Drop Storage Policies (Explicit List of all known policies created by us)
  PERFORM pg_temp.safe_drop_storage_policy('verification_admin_read_all');
  PERFORM pg_temp.safe_drop_storage_policy('verification_admin_read_all_complex');
  PERFORM pg_temp.safe_drop_storage_policy('verification_admin_read_all_hierarchical');
  PERFORM pg_temp.safe_drop_storage_policy('Admins can view all verification files');
  PERFORM pg_temp.safe_drop_storage_policy('Admins can view all license verifications');
  
  -- User policies
  PERFORM pg_temp.safe_drop_storage_policy('verification-documents_users_insert');
  PERFORM pg_temp.safe_drop_storage_policy('verification-documents_users_select');
  PERFORM pg_temp.safe_drop_storage_policy('verification-documents_users_update');
  PERFORM pg_temp.safe_drop_storage_policy('verification-documents_users_delete');
  
  PERFORM pg_temp.safe_drop_storage_policy('verification-selfies_users_insert');
  PERFORM pg_temp.safe_drop_storage_policy('verification-selfies_users_select');
  PERFORM pg_temp.safe_drop_storage_policy('verification-selfies_users_update');
  PERFORM pg_temp.safe_drop_storage_policy('verification-selfies_users_delete');
  
  PERFORM pg_temp.safe_drop_storage_policy('verification-temp_users_insert');
  PERFORM pg_temp.safe_drop_storage_policy('verification-temp_users_select');
  PERFORM pg_temp.safe_drop_storage_policy('verification-temp_users_update');
  PERFORM pg_temp.safe_drop_storage_policy('verification-temp_users_delete');
  
  PERFORM pg_temp.safe_drop_storage_policy('Users can upload their verification files');
  PERFORM pg_temp.safe_drop_storage_policy('Users can manage their verification files');
  PERFORM pg_temp.safe_drop_storage_policy('storage_admin_read');
  PERFORM pg_temp.safe_drop_storage_policy('storage_user_insert');
  PERFORM pg_temp.safe_drop_storage_policy('storage_user_select');
  PERFORM pg_temp.safe_drop_storage_policy('storage_user_update');


  -- 2. Drop Admins Policies (Explicit List)
  DROP POLICY IF EXISTS "Anyone can view admin list" ON public.admins;
  DROP POLICY IF EXISTS "Admins are viewable by everyone" ON public.admins;
  DROP POLICY IF EXISTS "public_admins_select" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can create new admins" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can insert admins" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can update admin records" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can update admins" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can delete admin records" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can delete admins" ON public.admins;
  DROP POLICY IF EXISTS "Super admins can manage admins" ON public.admins;
  DROP POLICY IF EXISTS "admins_read_policy" ON public.admins;
  DROP POLICY IF EXISTS "admins_write_policy" ON public.admins;

END $$;

-- 3. Re-verify is_admin is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid());
$$;

-- 4. Recreate Policies
-- Admins: Simple open read
CREATE POLICY "admins_read_policy" 
ON public.admins FOR SELECT 
TO authenticated 
USING (true);

-- Storage: Admin read (using safe function)
CREATE POLICY "storage_admin_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
  AND public.is_admin()
);

-- Storage: User Insert (using folder check)
CREATE POLICY "storage_user_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage: User Select
CREATE POLICY "storage_user_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage: User Update
CREATE POLICY "storage_user_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
