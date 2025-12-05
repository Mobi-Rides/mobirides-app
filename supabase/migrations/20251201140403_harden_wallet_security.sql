-- MOBI-502-2: Harden wallet RLS policies
-- Remove risky direct update by owners; add admin visibility using public.is_admin()

-- Host wallets: restrict updates to service_role only, owners can SELECT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'host_wallets' 
      AND policyname = 'Users can update their own wallet'
  ) THEN
    DROP POLICY "Users can update their own wallet" ON public.host_wallets;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'host_wallets' 
      AND policyname = 'Admins can view all wallets'
  ) THEN
    CREATE POLICY "Admins can view all wallets"
      ON public.host_wallets
      FOR SELECT TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- Wallet transactions: add admin SELECT policy; service_role already manages all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'wallet_transactions' 
      AND policyname = 'Admins can view all wallet transactions'
  ) THEN
    CREATE POLICY "Admins can view all wallet transactions"
      ON public.wallet_transactions
      FOR SELECT TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

