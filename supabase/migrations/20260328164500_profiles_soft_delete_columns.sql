-- S9-004 / MOB-130: Profiles soft-delete columns (Anonymize-on-Delete Phase 1)
-- Adds is_deleted, deleted_at, deleted_by to profiles table.
-- Non-admin SELECT policies updated to filter out deleted profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

COMMENT ON COLUMN public.profiles.is_deleted IS 'Soft-delete flag for anonymized users';
COMMENT ON COLUMN public.profiles.deleted_at  IS 'Timestamp of account deletion';
COMMENT ON COLUMN public.profiles.deleted_by  IS 'Admin who performed the deletion';

-- Update non-admin SELECT policies to exclude deleted profiles
DROP POLICY IF EXISTS "profiles_own_select"                      ON public.profiles;
DROP POLICY IF EXISTS "profiles_authenticated_basic_read"        ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_car_owner_read"           ON public.profiles;

-- Own profile (still visible even if deleted — user may need to see their own state)
CREATE POLICY "profiles_own_select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Authenticated users — exclude deleted
CREATE POLICY "profiles_authenticated_basic_read"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated' AND (is_deleted = false OR is_deleted IS NULL));

-- Public car owner read — exclude deleted
CREATE POLICY "profiles_public_car_owner_read"
  ON public.profiles FOR SELECT
  USING (
    (is_deleted = false OR is_deleted IS NULL)
    AND EXISTS (
      SELECT 1 FROM public.cars WHERE cars.owner_id = profiles.id
    )
  );

-- Admins retain full access (no is_deleted filter — intentional)
