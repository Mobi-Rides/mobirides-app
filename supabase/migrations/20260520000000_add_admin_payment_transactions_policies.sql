-- Migration: Add Admin RLS Policies for Payment Transactions Table
-- Description: Ensures Admin and SuperAdmin roles (as identified by public.is_admin(auth.uid())) can view all payment transactions on the platform.

-- 1. Drop existing admin view policy if it exists
DROP POLICY IF EXISTS "Admins can view all payment transactions" ON public.payment_transactions;

-- 2. Create the updated SELECT policy for Admins to view all payment transactions
CREATE POLICY "Admins can view all payment transactions"
ON public.payment_transactions FOR SELECT
USING (
  public.is_admin(auth.uid())
);
