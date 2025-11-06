-- Migration: Reset messages RLS policies to eliminate recursion
-- Context: Direct SELECT on public.messages still reports
--   "infinite recursion detected in policy for relation 'messages'"
-- Goal: Drop ALL existing messages policies and recreate minimal, self-contained ones
-- Notes:
-- - Policies use only auth.uid(), sender_id, receiver_id
-- - Admin bypass policy is created ONLY if public.admins exists
-- - No function calls or cross-table references besides public.admins EXISTS

DO $$
DECLARE
  r RECORD;
  messages_exists BOOLEAN;
  admins_exists BOOLEAN;
BEGIN
  -- Check existence of public.messages and public.admins
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='messages'
  ) INTO messages_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='admins'
  ) INTO admins_exists;

  IF NOT messages_exists THEN
    RAISE NOTICE 'Table public.messages does not exist; skipping policy reset.';
    RETURN;
  END IF;

  -- Drop ALL existing policies on public.messages
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='messages'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.messages', r.policyname);
  END LOOP;

  -- Recreate minimal, self-contained user policies
  CREATE POLICY "Users can view their own messages"
    ON public.messages
    FOR SELECT TO authenticated
    USING (
      sender_id = auth.uid() OR receiver_id = auth.uid()
    );

  CREATE POLICY "Users can insert their own messages"
    ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
      sender_id = auth.uid()
    );

  CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE TO authenticated
    USING (
      sender_id = auth.uid()
    )
    WITH CHECK (
      sender_id = auth.uid()
    );

  -- Optional admin bypass: only if public.admins exists
  IF admins_exists THEN
    CREATE POLICY "Admins can view all messages"
      ON public.messages
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
      );
  END IF;
END $$;

-- Ensure authenticated can read admins if admin bypass policy exists
DO $$
DECLARE admins_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='admins'
  ) INTO admins_exists;

  IF admins_exists THEN
    -- Grant SELECT to authenticated to allow EXISTS check
    BEGIN
      GRANT SELECT ON public.admins TO authenticated;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore grant errors (role/table differences across environments)
      RAISE NOTICE 'Grant SELECT on public.admins to authenticated failed; continuing.';
    END;
  END IF;
END $$;