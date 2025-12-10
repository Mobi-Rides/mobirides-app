-- MOBI-602-1: Create insurance tables schema with RLS

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.insurance_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_rate DECIMAL(10,2) NOT NULL,
    coverage_percentage INTEGER NOT NULL CHECK (coverage_percentage BETWEEN 0 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.policy_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.insurance_plans(id) ON DELETE RESTRICT,
    premium DECIMAL(10,2) NOT NULL,
    selected_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.insurance_plans;
CREATE POLICY "Anyone can view active plans"
  ON public.insurance_plans
  FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage plans" ON public.insurance_plans;
CREATE POLICY "Admins manage plans"
  ON public.insurance_plans
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users view their own selections" ON public.policy_selections;
CREATE POLICY "Users view their own selections"
  ON public.policy_selections
  FOR SELECT TO authenticated
  USING (auth.uid() = selected_by);

DROP POLICY IF EXISTS "Service role manages selections" ON public.policy_selections;
CREATE POLICY "Service role manages selections"
  ON public.policy_selections
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_policy_selections_booking ON public.policy_selections(booking_id);
CREATE INDEX IF NOT EXISTS idx_policy_selections_plan ON public.policy_selections(plan_id);

