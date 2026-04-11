-- Restore RLS policies for wallet_transactions dropped by remote schema sync (20260319212624)

CREATE POLICY "Users can view their own wallet transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.host_wallets
      WHERE id = wallet_transactions.wallet_id
      AND host_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all wallet transactions"
  ON public.wallet_transactions
  FOR ALL
  USING (auth.role() = 'service_role');
