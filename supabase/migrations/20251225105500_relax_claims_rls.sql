-- Relax insurance-claims RLS to allow submissions for expired policies
-- This aligns the DB security with the UI logic

DROP POLICY IF EXISTS "Users can submit claims for their active policies" ON public.insurance_claims;
CREATE POLICY "Users can submit claims for their active policies"
  ON public.insurance_claims FOR INSERT
  WITH CHECK (
    renter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.insurance_policies
      WHERE insurance_policies.id = policy_id
      AND insurance_policies.renter_id = auth.uid()
      AND insurance_policies.status IN ('active', 'expired')
    )
  );

-- Also ensure the bucket is definitely public for easy viewing/downloading
UPDATE storage.buckets SET public = true WHERE id = 'insurance-claims';
