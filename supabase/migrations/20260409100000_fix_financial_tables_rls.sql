-- S10-005: Drop blanket notifications read policy
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."notifications";

-- S10-006: Re-enable RLS on insurance_commission_rates and add policies
ALTER TABLE "public"."insurance_commission_rates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view insurance commission rates"
  ON "public"."insurance_commission_rates"
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage insurance commission rates"
  ON "public"."insurance_commission_rates"
  AS PERMISSIVE FOR ALL
  TO public
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));

-- S10-006: Add missing delete policy on commission_rates
CREATE POLICY "Only admins can delete commission rates"
  ON "public"."commission_rates"
  AS PERMISSIVE FOR DELETE
  TO public
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid()));
