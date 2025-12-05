-- MOBI-603: Payment table recovery and consolidation (idempotent)

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BWP',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','refunded')),
    provider TEXT,
    provider_reference TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view their own payments" ON public.payments;
CREATE POLICY "Users view their own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = payer_id);

DROP POLICY IF EXISTS "Service role manages all payments" ON public.payments;
CREATE POLICY "Service role manages all payments"
  ON public.payments FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Backfill wallet link consistency (no-op if already consistent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='wallet_transactions' AND indexname='idx_wallet_transactions_booking_id'
  ) THEN
    CREATE INDEX idx_wallet_transactions_booking_id ON public.wallet_transactions(booking_id);
  END IF;
END $$;

