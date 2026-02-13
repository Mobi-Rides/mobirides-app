-- Create payment_config table
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO payment_config (key, value, description) VALUES
  ('payment_deadline_hours', '"24"', 'Hours renter has to pay after booking approved'),
  ('minimum_withdrawal', '"200"', 'Minimum withdrawal amount in BWP'),
  ('minimum_wallet_balance', '"50"', 'Minimum wallet balance to accept bookings'),
  ('auto_release_earnings_hours', '"24"', 'Hours after rental end to auto-release earnings'),
  ('paygate_enabled', 'true', 'Enable card payments via PayGate'),
  ('orange_money_enabled', 'true', 'Enable OrangeMoney payments'),
  ('myzaka_enabled', 'false', 'Enable MyZaka payments (Q2 2026)'),
  ('smega_enabled', 'false', 'Enable Smega payments (Q2 2026)'),
  ('host_subscription_enabled', 'false', 'Enable monthly host subscription'),
  ('host_subscription_amount', '"50"', 'Monthly subscription fee in BWP'),
  ('subscription_grace_days', '"7"', 'Grace period days for insufficient balance'),
  ('max_withdrawal_per_day', '"10000"', 'Maximum withdrawal amount per day in BWP'),
  ('withdrawal_cooldown_hours', '"24"', 'Hours between withdrawal requests')
ON CONFLICT (key) DO NOTHING;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Payment details
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BWP',
  payment_method VARCHAR(50) NOT NULL,
  payment_provider VARCHAR(50) NOT NULL,
  
  -- Provider references
  provider_transaction_id VARCHAR(100),
  provider_pay_request_id VARCHAR(50),
  provider_reference VARCHAR(100),
  
  -- Status tracking
  status VARCHAR(30) NOT NULL DEFAULT 'initiated',
  
  -- Commission split tracking
  platform_commission NUMERIC(10,2),
  host_earnings NUMERIC(10,2),
  commission_rate NUMERIC(5,4),
  
  -- Metadata
  provider_response JSONB,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT payment_transactions_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_ref ON payment_transactions(provider_transaction_id);

-- Create payout_details table
CREATE TABLE IF NOT EXISTS payout_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Method type
  payout_method VARCHAR(50) NOT NULL,
  
  -- Encrypted details
  details_encrypted JSONB NOT NULL,
  
  -- Display info (non-sensitive)
  display_name VARCHAR(100),
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT payout_details_one_default_per_host 
    EXCLUDE (host_id WITH =) WHERE (is_default = true)
);

CREATE INDEX IF NOT EXISTS idx_payout_details_host ON payout_details(host_id);
CREATE INDEX IF NOT EXISTS idx_payout_details_default ON payout_details(host_id, is_default) WHERE is_default = true;

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id),
  wallet_id UUID NOT NULL REFERENCES host_wallets(id),
  
  -- Withdrawal details
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BWP',
  
  -- Payout destination
  payout_method VARCHAR(50) NOT NULL,
  payout_details JSONB NOT NULL,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending',
  
  -- Processing details
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  provider_reference VARCHAR(100),
  provider_response JSONB,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT withdrawal_requests_amount_positive CHECK (amount >= 200)
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_host ON withdrawal_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created ON withdrawal_requests(created_at DESC);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

-- Policies for payment_transactions
CREATE POLICY "Users can view their own payment transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ) OR 
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- Policies for withdrawal_requests
CREATE POLICY "Hosts can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can create their own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Policies for payout_details
CREATE POLICY "Hosts can manage their own payout details"
  ON payout_details FOR ALL
  USING (auth.uid() = host_id);

-- Policies for payment_config
CREATE POLICY "Admins can manage payment config"
  ON payment_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ) OR 
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read payment config"
  ON payment_config FOR SELECT
  USING (true);

-- Alter bookings table
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_transaction_id UUID REFERENCES payment_transactions(id),
  ADD COLUMN IF NOT EXISTS insurance_premium NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_policy_id UUID,
  ADD COLUMN IF NOT EXISTS base_rental_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dynamic_pricing_multiplier NUMERIC(6,4) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_code_id UUID,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2);

COMMENT ON COLUMN bookings.payment_status IS 'Payment state: unpaid, awaiting_payment, paid, refunded, partially_refunded';
COMMENT ON COLUMN bookings.payment_deadline IS 'Deadline for renter to complete payment after host approval';
COMMENT ON COLUMN bookings.base_rental_price IS 'Price before dynamic pricing: price_per_day × days';
COMMENT ON COLUMN bookings.dynamic_pricing_multiplier IS 'Composite multiplier from all pricing rules';
COMMENT ON COLUMN bookings.discount_amount IS 'Total discount applied (promo codes, etc.)';
COMMENT ON COLUMN bookings.total_price IS 'Grand total: rental + insurance - discounts (what renter pays)';

-- Alter host_wallets table
ALTER TABLE host_wallets 
  ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN host_wallets.balance IS 'Available balance that can be withdrawn';
COMMENT ON COLUMN host_wallets.pending_balance IS 'Earnings from active rentals, released after completion';

-- Alter wallet_transactions table
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_transaction_type_check;

-- Optional: Clean up invalid rows if necessary (use with caution in prod)
-- UPDATE wallet_transactions SET transaction_type = 'adjustment' WHERE transaction_type NOT IN ('credit', 'debit', 'commission', 'refund', 'withdrawal', 'rental_earnings_pending', 'earnings_released', 'withdrawal_reversal', 'topup', 'adjustment', 'fee_deduction', 'commission_deduction');
-- Do NOT enforce constraint if existing data violates it (for now), or add missing types
-- ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_transaction_type_check 
--  CHECK (transaction_type IN ('credit', 'debit', 'commission', 'refund', 'withdrawal', 'rental_earnings_pending', 'earnings_released', 'withdrawal_reversal', 'topup', 'adjustment', 'fee_deduction', 'commission_deduction', 'payout'));


-- Insurance Schema Extensions
CREATE TABLE IF NOT EXISTS insurance_commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID, 
  mobirides_percentage NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  payu_percentage NUMERIC(5,4) NOT NULL DEFAULT 0.90,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

INSERT INTO insurance_commission_rates 
  (package_id, mobirides_percentage, payu_percentage, effective_from)
VALUES 
  (NULL, 0.10, 0.90, '2026-01-01');

CREATE TABLE IF NOT EXISTS premium_remittance_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_date DATE NOT NULL,
  total_policies INTEGER NOT NULL,
  total_premium_collected NUMERIC(12,2) NOT NULL,
  mobirides_commission_total NUMERIC(12,2) NOT NULL,
  payu_amount_total NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  remitted_by UUID REFERENCES auth.users(id),
  remitted_at TIMESTAMPTZ,
  payu_confirmation_reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update insurance_policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_policies') THEN
    ALTER TABLE insurance_policies 
      ADD COLUMN IF NOT EXISTS payu_remittance_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS payu_remittance_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS payu_remittance_reference VARCHAR(100),
      ADD COLUMN IF NOT EXISTS mobirides_commission NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS payu_amount NUMERIC(10,2);
  END IF;
END $$;

-- Update insurance_claims (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_claims') THEN
    ALTER TABLE insurance_claims 
      ADD COLUMN IF NOT EXISTS payu_claim_reference VARCHAR(100),
      ADD COLUMN IF NOT EXISTS external_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS excess_requested BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS excess_amount_due NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS excess_paid BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS excess_payment_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS renter_liability_amount NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS renter_liability_paid BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Database Functions

-- 1. release_pending_earnings
CREATE OR REPLACE FUNCTION release_pending_earnings(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_host_id UUID;
  v_amount NUMERIC;
  v_wallet_id UUID;
  v_booking_status TEXT;
  v_balance_before NUMERIC;
BEGIN
  SELECT 
    c.owner_id,
    pt.host_earnings,
    b.status
  INTO v_host_id, v_amount, v_booking_status
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  LEFT JOIN payment_transactions pt ON b.payment_transaction_id = pt.id
  WHERE b.id = p_booking_id;
  
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;
  
  IF v_booking_status != 'completed' THEN
    RAISE EXCEPTION 'Booking must be completed to release earnings';
  END IF;
  
  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'No earnings to release for booking: %', p_booking_id;
  END IF;
  
  SELECT balance INTO v_balance_before FROM host_wallets WHERE host_id = v_host_id;
  
  UPDATE host_wallets
  SET 
    pending_balance = pending_balance - v_amount,
    balance = balance + v_amount,
    updated_at = NOW()
  WHERE host_id = v_host_id
  RETURNING id INTO v_wallet_id;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for host: %', v_host_id;
  END IF;
  
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    booking_id,
    balance_before,
    balance_after
  )
  SELECT 
    v_wallet_id,
    v_amount,
    'earnings_released',
    'Earnings released for booking ' || p_booking_id::TEXT,
    p_booking_id,
    v_balance_before,
    hw.balance
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN TRUE;
END;
$func$;

-- 2. credit_pending_earnings
CREATE OR REPLACE FUNCTION credit_pending_earnings(
  p_booking_id UUID,
  p_host_earnings NUMERIC,
  p_platform_commission NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_host_id UUID;
  v_wallet_id UUID;
  v_balance_before NUMERIC;
BEGIN
  SELECT c.owner_id
  INTO v_host_id
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  WHERE b.id = p_booking_id;
  
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;
  
  SELECT pending_balance INTO v_balance_before FROM host_wallets WHERE host_id = v_host_id;
  v_balance_before := COALESCE(v_balance_before, 0);

  UPDATE host_wallets
  SET 
    pending_balance = pending_balance + p_host_earnings,
    updated_at = NOW()
  WHERE host_id = v_host_id
  RETURNING id INTO v_wallet_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO host_wallets (host_id, balance, pending_balance, currency)
    VALUES (v_host_id, 0, p_host_earnings, 'BWP')
    RETURNING id INTO v_wallet_id;
  END IF;
  
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    booking_id,
    balance_before,
    balance_after
  )
  SELECT 
    v_wallet_id,
    p_host_earnings,
    'rental_earnings_pending',
    'Pending earnings from booking ' || p_booking_id::TEXT || ' (Commission: P' || p_platform_commission::TEXT || ')',
    p_booking_id,
    v_balance_before,
    hw.pending_balance
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN TRUE;
END;
$func$;

-- 3. process_withdrawal_request
CREATE OR REPLACE FUNCTION process_withdrawal_request(
  p_host_id UUID,
  p_amount NUMERIC,
  p_payout_method VARCHAR,
  p_payout_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_wallet_id UUID;
  v_available_balance NUMERIC;
  v_withdrawal_id UUID;
  v_min_withdrawal NUMERIC;
  v_balance_before NUMERIC;
BEGIN
  SELECT (value::TEXT)::NUMERIC INTO v_min_withdrawal
  FROM payment_config WHERE key = 'minimum_withdrawal';
  v_min_withdrawal := COALESCE(v_min_withdrawal, 200);
  
  IF p_amount < v_min_withdrawal THEN
    RAISE EXCEPTION 'Minimum withdrawal is P%', v_min_withdrawal;
  END IF;
  
  SELECT id, balance
  INTO v_wallet_id, v_available_balance
  FROM host_wallets
  WHERE host_id = p_host_id
  FOR UPDATE;
  
  v_balance_before := v_available_balance;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: P%', v_available_balance;
  END IF;
  
  UPDATE host_wallets
  SET 
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;
  
  INSERT INTO withdrawal_requests (
    host_id,
    wallet_id,
    amount,
    payout_method,
    payout_details,
    status
  )
  VALUES (
    p_host_id,
    v_wallet_id,
    p_amount,
    p_payout_method,
    p_payout_details,
    'pending'
  )
  RETURNING id INTO v_withdrawal_id;
  
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    balance_before,
    balance_after,
    metadata
  )
  SELECT 
    v_wallet_id,
    -p_amount,
    'withdrawal',
    'Withdrawal request ' || v_withdrawal_id::TEXT,
    v_balance_before,
    hw.balance,
    jsonb_build_object('withdrawal_request_id', v_withdrawal_id)
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN v_withdrawal_id;
END;
$func$;
