-- S9-003: Create dynamic_pricing_rules table
-- Seeds the 8 rules currently hardcoded in dynamicPricingService.ts

CREATE TABLE IF NOT EXISTS public.dynamic_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  multiplier numeric(5,3) NOT NULL,
  condition_type text NOT NULL,
  condition_value jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read dynamic pricing rules"
  ON public.dynamic_pricing_rules FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage dynamic pricing rules"
  ON public.dynamic_pricing_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND is_super_admin = true));

-- Seed 8 rules from dynamicPricingService.ts
INSERT INTO public.dynamic_pricing_rules (rule_name, multiplier, condition_type, condition_value, is_active, priority) VALUES
  ('Weekend Premium',          1.200, 'WEEKEND',     '{"days_of_week": [0, 6]}',                  true, 100),
  ('Summer Season Premium',    1.150, 'SEASONAL',    '{"seasons": ["SUMMER"]}',                   true,  90),
  ('Early Bird Discount',      0.900, 'EARLY_BIRD',  '{"advance_booking_days": 7}',               true,  80),
  ('High Demand Premium',      1.300, 'DEMAND',      '{"demand_threshold": 80}',                  true, 110),
  ('Loyalty Gold Discount',    0.950, 'LOYALTY',     '{"user_tier": "gold"}',                     true,  70),
  ('Loyalty Platinum Discount',0.900, 'LOYALTY',     '{"user_tier": "platinum"}',                 true,  75),
  ('Out of Zone Premium',      1.500, 'DESTINATION', '{"destination_type": "out_of_zone"}',       true, 105),
  ('Cross-Border Premium',     2.000, 'DESTINATION', '{"destination_type": "cross_border"}',      true, 105)
ON CONFLICT DO NOTHING;
