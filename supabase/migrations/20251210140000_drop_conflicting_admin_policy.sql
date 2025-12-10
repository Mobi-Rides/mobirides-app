-- Fix Critical Recursion in Admins Table
-- Cause: "Only admins can view admin list" policy uses a direct subquery that triggers RLS recursion.
-- Solution: Drop the offending policy and ensure the safe "Admins are viewable by everyone" is active.

DO $$
BEGIN
  -- 1. Drop the specific recursive policy identified
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admins' AND policyname = 'Only admins can view admin list'
  ) THEN
    DROP POLICY "Only admins can view admin list" ON public.admins;
    RAISE NOTICE 'Dropped recursive policy: Only admins can view admin list';
  END IF;

  -- 2. Drop "Admins can view themselves" if it exists (it might be safe, but "viewable by everyone" covers it)
  -- Simplify to a single source of truth for SELECT
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admins' AND policyname = 'Admins can view themselves'
  ) THEN
    DROP POLICY "Admins can view themselves" ON public.admins;
    RAISE NOTICE 'Dropped redundant policy: Admins can view themselves';
  END IF;

  -- 3. Ensure the SAFE policy exists
  -- "Admins are viewable by everyone" -> USING (true)
  -- This breaks the recursion because it doesn't query the table to check permission.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admins' AND policyname = 'Admins are viewable by everyone'
  ) THEN
    CREATE POLICY "Admins are viewable by everyone" 
    ON public.admins FOR SELECT 
    TO authenticated
    USING (true);
    RAISE NOTICE 'Created safe policy: Admins are viewable by everyone';
  ELSE
    -- Ensure it is actually using (true)
    -- We can't easily check the definition via SQL in a DO block without complex parsing, 
    -- so we'll drop and recreate to be sure.
    DROP POLICY "Admins are viewable by everyone" ON public.admins;
    CREATE POLICY "Admins are viewable by everyone" 
    ON public.admins FOR SELECT 
    TO authenticated
    USING (true);
    RAISE NOTICE 'Recreated safe policy: Admins are viewable by everyone';
  END IF;

END $$;
