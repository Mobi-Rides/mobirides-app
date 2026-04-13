
-- ============================================================
-- Migration: fix_admin_portal_data_linkage
-- Fixes: car verification status, profile sync trigger,
--        last_sign_in_at RPC reference, AdminStats accuracy
-- ============================================================

-- ── 1. Cars: add verification_status column ──────────────────
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending';

-- Add validation trigger instead of CHECK constraint (per project standards)
CREATE OR REPLACE FUNCTION public.validate_car_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid verification_status: %. Must be pending, approved, or rejected.', NEW.verification_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_car_verification_status ON public.cars;
CREATE TRIGGER trg_validate_car_verification_status
  BEFORE INSERT OR UPDATE OF verification_status ON public.cars
  FOR EACH ROW EXECUTE FUNCTION public.validate_car_verification_status();

-- Backfill: existing is_available=true cars are already approved
UPDATE public.cars SET verification_status = 'approved' WHERE is_available = true;
-- Existing is_available=false cars stay as 'pending' (already the default)

-- ── 2. Sync trigger: user_verifications → profiles.verification_status ──
CREATE OR REPLACE FUNCTION public.sync_profile_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET verification_status = NEW.overall_status
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_verification_status_change ON public.user_verifications;
CREATE TRIGGER on_verification_status_change
  AFTER INSERT OR UPDATE OF overall_status ON public.user_verifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification_status();

-- Backfill: sync existing completed/rejected/in_progress/pending_review records
UPDATE public.profiles p
SET verification_status = uv.overall_status
FROM public.user_verifications uv
WHERE uv.user_id = p.id
  AND uv.overall_status IN ('completed', 'rejected', 'pending_review', 'in_progress');

-- ── 3. Fix get_admin_users_complete RPC (remove profiles.last_sign_in_at) ──
DROP FUNCTION IF EXISTS public.get_admin_users_complete();
CREATE OR REPLACE FUNCTION public.get_admin_users_complete()
RETURNS TABLE (
  p_id            UUID,
  p_full_name     TEXT,
  p_email         TEXT,
  p_role          TEXT,
  p_avatar_url    TEXT,
  p_phone         TEXT,
  p_created_at    TIMESTAMPTZ,
  p_updated_at    TIMESTAMPTZ,
  p_verification_status TEXT,
  p_is_active     BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id             AS p_id,
    pr.full_name      AS p_full_name,
    pr.email          AS p_email,
    pr.role           AS p_role,
    pr.avatar_url     AS p_avatar_url,
    pr.phone          AS p_phone,
    pr.created_at     AS p_created_at,
    pr.updated_at     AS p_updated_at,
    pr.verification_status AS p_verification_status,
    TRUE              AS p_is_active
  FROM public.profiles pr
  ORDER BY pr.created_at DESC;
END;
$$;
