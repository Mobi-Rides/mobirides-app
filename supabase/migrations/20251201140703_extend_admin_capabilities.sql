-- MOBI-501-2: Extend admin capabilities schema and RLS

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.admin_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    capability TEXT NOT NULL,
    granted_by UUID REFERENCES public.admins(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Ensure columns exist when table is pre-existing
ALTER TABLE public.admin_capabilities
  ADD COLUMN IF NOT EXISTS admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE;
ALTER TABLE public.admin_capabilities
  ADD COLUMN IF NOT EXISTS capability TEXT;
ALTER TABLE public.admin_capabilities
  ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES public.admins(id);
ALTER TABLE public.admin_capabilities
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.admin_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view their capabilities" ON public.admin_capabilities;
CREATE POLICY "Admins view their capabilities"
  ON public.admin_capabilities
  FOR SELECT TO authenticated
  USING (auth.uid() = admin_id OR public.is_admin());

DROP POLICY IF EXISTS "Super admins manage capabilities" ON public.admin_capabilities;
CREATE POLICY "Super admins manage capabilities"
  ON public.admin_capabilities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a WHERE a.id = auth.uid() AND a.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins a WHERE a.id = auth.uid() AND a.is_super_admin = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_capabilities_admin_id ON public.admin_capabilities(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_capabilities_capability ON public.admin_capabilities(capability);

