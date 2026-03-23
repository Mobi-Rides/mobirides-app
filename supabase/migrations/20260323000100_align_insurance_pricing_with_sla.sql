-- Align insurance pricing with Pay-U SLA
-- Consumers: src/services/insuranceService.ts, src/components/insurance/InsurancePackageSelector.tsx
-- Rollback: Remove added columns and tables; restore original seeded values

-- 1. Add SLA pricing columns to insurance_packages
ALTER TABLE public.insurance_packages
  ADD COLUMN IF NOT EXISTS daily_premium_amount decimal(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS excess_percentage decimal(5,4) DEFAULT NULL;

-- 2. Update existing packages to SLA flat daily rates + percentage excess
UPDATE public.insurance_packages SET
  daily_premium_amount = 0,
  excess_percentage = 0
WHERE name = 'none';

UPDATE public.insurance_packages SET
  daily_premium_amount = 80.00,
  excess_percentage = 0.20,
  coverage_cap = 8000
WHERE name = 'basic';

UPDATE public.insurance_packages SET
  daily_premium_amount = 150.00,
  excess_percentage = 0.15,
  coverage_cap = 20000
WHERE name = 'standard';

UPDATE public.insurance_packages SET
  daily_premium_amount = 250.00,
  excess_percentage = 0.10,
  coverage_cap = 50000
WHERE name = 'premium';

-- 3. Create insurance_commission_rates table
CREATE TABLE IF NOT EXISTS public.insurance_commission_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate decimal(5,4) NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_until timestamptz DEFAULT NULL,
  min_premium_amount decimal(10,2) DEFAULT 0,
  max_commission_amount decimal(10,2) DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.insurance_commission_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view commission rates"
  ON public.insurance_commission_rates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage commission rates"
  ON public.insurance_commission_rates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true));

-- Seed default 10% commission rate
INSERT INTO public.insurance_commission_rates (rate, effective_from)
VALUES (0.10, '2026-03-23')
ON CONFLICT DO NOTHING;

-- 4. Create premium_remittance_batches table
-- Sequence must be created before the table that references it in a DEFAULT
CREATE SEQUENCE IF NOT EXISTS premium_remittance_seq START 1;

CREATE TABLE IF NOT EXISTS public.premium_remittance_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number text UNIQUE NOT NULL DEFAULT 'REM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('premium_remittance_seq')::text, 5, '0'),
  batch_date date NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_premium_amount decimal(12,2) NOT NULL DEFAULT 0,
  commission_amount decimal(12,2) NOT NULL DEFAULT 0,
  remittance_amount decimal(12,2) NOT NULL DEFAULT 0,
  policy_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'remitted', 'confirmed')),
  payment_reference text DEFAULT NULL,
  remitted_at timestamptz DEFAULT NULL,
  confirmed_at timestamptz DEFAULT NULL,
  created_by uuid REFERENCES public.profiles(id),
  notes text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.premium_remittance_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage remittance batches"
  ON public.premium_remittance_batches FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true));
