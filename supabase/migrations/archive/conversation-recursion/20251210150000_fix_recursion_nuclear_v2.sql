-- Nuclear Fix for Infinite Recursion
-- 1. Drop ALL policies on public.admins to ensure no hidden recursive policies remain.
-- 2. Redefine public.is_admin() as strictly SECURITY DEFINER.
-- 3. Recreate safe policies for public.admins.
-- 4. Clean up and recreate storage policies.

DO $$
DECLARE
  pol record;
BEGIN
  -- 1. Drop ALL policies on public.admins
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admins' LOOP
    EXECUTE format('DROP POLICY %I ON public.admins', pol.policyname);
    RAISE NOTICE 'Dropped policy on admins: %', pol.policyname;
  END LOOP;

  -- 2. Drop specific storage policies (to be safe)
  -- We don't drop ALL storage policies to avoid breaking other buckets if they exist,
  -- but we drop the ones we manage.
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_admin_read') THEN
    DROP POLICY "storage_admin_read" ON storage.objects;
  END IF;
  
  -- Also drop legacy names if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'verification_admin_read_all') THEN
    DROP POLICY "verification_admin_read_all" ON storage.objects;
  END IF;
  
END $$;

-- 3. Redefine is_admin as SECURITY DEFINER
-- We drop both signatures to be clean
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(uuid);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Direct check on admins table.
  -- Since this is SECURITY DEFINER, it bypasses RLS on public.admins.
  -- This prevents the recursion loop.
  RETURN EXISTS (
    SELECT 1 
    FROM public.admins 
    WHERE id = auth.uid()
  );
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon; -- Just in case

-- 4. Recreate Admins Policy (Non-recursive)
-- Allow anyone to read the admins list (needed for is_admin check if it wasn't sec definer, but good practice for transparency/logic)
-- Actually, if is_admin is sec definer, we don't strictly need this for is_admin to work.
-- But we'll add a simple one.
CREATE POLICY "Admins are viewable by everyone"
ON public.admins FOR SELECT
TO authenticated
USING (true);

-- 5. Recreate Storage Admin Policy
-- Now safe to use is_admin()
CREATE POLICY "storage_admin_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
  AND public.is_admin()
);

-- Ensure other storage policies exist (idempotent checks)
-- We rely on previous migrations for user policies, or recreate them if missing.
-- Let's ensure they exist just in case 20251210120000 dropped them and we need them.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_user_insert' AND tablename = 'objects') THEN
    CREATE POLICY "storage_user_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_user_select' AND tablename = 'objects') THEN
    CREATE POLICY "storage_user_select"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id IN ('verification-documents', 'verification-selfies', 'verification-temp')
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;
