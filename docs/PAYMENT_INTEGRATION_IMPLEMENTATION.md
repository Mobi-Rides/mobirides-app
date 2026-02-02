# MobiRides Payment Integration - Technical Implementation Document

**Version:** 1.0  
**Date:** February 2, 2026  
**Status:** Pending Review  
**Authors:** Development Team  
**Reviewers:** Dev Team & Engineers

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Payment Flow Architecture](#payment-flow-architecture)
3. [Database Schema](#database-schema)
4. [Edge Functions](#edge-functions)
5. [Frontend Components](#frontend-components)
6. [Integration Specifications](#integration-specifications)
7. [Security Considerations](#security-considerations)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Timeline](#implementation-timeline)
10. [Risk Assessment](#risk-assessment)

---

## Executive Summary

### Purpose
Implement end-to-end payment processing for MobiRides car rental platform, enabling:
- Card payments via PayGate (DVLP Botswana/FNB Merchant)
- Mobile money via Ooze Botswana (OrangeMoney now, MyZaka & Smega Q2 2026)
- Automated host payouts and withdrawals

### Key Design Decisions

| Decision | Chosen Approach | Rationale |
|----------|-----------------|-----------|
| Earnings Timing | Credited when renter pays (pending until rental completes) | Immediate visibility for hosts |
| Payment Flow | "Request first, pay later" | Host approval before payment commitment |
| Withdrawal Method | Automated via payment gateway | Reduces manual processing |
| Withdrawal Minimum | P200 | Balances transaction costs |
| Commission Model | 15% platform fee | Existing commission_rates table |

### Payment Providers

| Provider | Purpose | Status |
|----------|---------|--------|
| PayGate (PayWeb3) | Card payments | Ready for integration |
| Ooze Botswana | OrangeMoney | Ready for integration |
| Ooze Botswana | MyZaka | Q2 2026 |
| Ooze Botswana | Smega | Q2 2026 |

---

## Payment Flow Architecture

### Complete Transaction Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: BOOKING REQUEST                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Renter                                                                    │
│     └─► Creates booking request                                             │
│           └─► Booking status: pending                                       │
│                 └─► Host receives notification                              │
│                       └─► Host reviews request                              │
│                             ├─► APPROVE → status: awaiting_payment          │
│                             │              └─► 24h payment deadline set     │
│                             └─► DECLINE → status: declined                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: PAYMENT COLLECTION                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Renter sees "Pay Now" button                                              │
│     └─► Selects payment method (Card / OrangeMoney)                         │
│           └─► Frontend calls: initiate-payment edge function                │
│                 └─► Edge function creates payment_transaction (initiated)   │
│                       └─► Calls PayGate/Ooze API                            │
│                             └─► Returns redirect URL / payment reference    │
│                                   └─► Renter completes payment              │
│                                         └─► Provider sends webhook          │
│                                               └─► payment-webhook function  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: FUND ALLOCATION (on successful payment)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Payment Confirmed (P1000 example)                                         │
│     └─► payment_transaction.status = 'completed'                            │
│           └─► Calculate split:                                              │
│                 ├─► Platform Commission (15%): P150                         │
│                 │     └─► Recorded in payment_transaction.platform_commission│
│                 └─► Host Earnings (85%): P850                               │
│                       └─► host_wallets.pending_balance += P850              │
│                             └─► wallet_transaction created                  │
│                                   (type: rental_earnings_pending)           │
│                                     └─► booking.status = 'confirmed'        │
│                                           └─► Notifications sent            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: EARNINGS RELEASE                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Rental Completed                                                          │
│     └─► Trigger: handover_in completed                                      │
│           OR: 24h after rental end_date (auto-release)                      │
│             └─► host_wallets.pending_balance -= P850                        │
│                   └─► host_wallets.balance += P850                          │
│                         └─► wallet_transaction created                      │
│                               (type: earnings_released)                     │
│                                 └─► Host notified: "Earnings available"     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: HOST WITHDRAWAL                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Host requests withdrawal (min P200)                                       │
│     └─► Validates: amount <= available balance                              │
│           └─► Creates withdrawal_request (status: pending)                  │
│                 └─► host_wallets.balance -= amount                          │
│                       └─► process-withdrawal edge function                  │
│                             └─► Calls PayGate/Ooze payout API               │
│                                   └─► On success: status = 'completed'      │
│                                   └─► On failure: status = 'failed'         │
│                                         └─► Balance restored                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Booking Status State Machine

```
                    ┌──────────────┐
                    │   pending    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌───────────┐ ┌──────────┐
        │ declined │ │ cancelled │ │awaiting_ │
        └──────────┘ └───────────┘ │ payment  │
                                   └────┬─────┘
                                        │
                           ┌────────────┼────────────┐
                           │            │            │
                           ▼            ▼            ▼
                     ┌──────────┐ ┌───────────┐ ┌──────────┐
                     │ expired  │ │ cancelled │ │confirmed │
                     │(timeout) │ └───────────┘ └────┬─────┘
                     └──────────┘                    │
                                                     ▼
                                               ┌──────────┐
                                               │  active  │
                                               └────┬─────┘
                                                    │
                                                    ▼
                                               ┌──────────┐
                                               │completed │
                                               └──────────┘
```

---

## Database Schema

### New Tables

#### 1. payment_transactions

Primary table for all payment attempts and completions.

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Payment details
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BWP',
  payment_method VARCHAR(50) NOT NULL,
  -- Values: 'card', 'orange_money', 'myzaka', 'smega'
  payment_provider VARCHAR(50) NOT NULL,
  -- Values: 'paygate', 'ooze'
  
  -- Provider references
  provider_transaction_id VARCHAR(100),
  provider_pay_request_id VARCHAR(50),  -- PayGate PAY_REQUEST_ID
  provider_reference VARCHAR(100),
  
  -- Status tracking
  status VARCHAR(30) NOT NULL DEFAULT 'initiated',
  -- Values: initiated, pending, completed, failed, refunded, cancelled
  
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
  
  -- Indexes
  CONSTRAINT payment_transactions_amount_positive CHECK (amount > 0)
);

-- Indexes for common queries
CREATE INDEX idx_payment_transactions_booking ON payment_transactions(booking_id);
CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at DESC);
CREATE INDEX idx_payment_transactions_provider_ref ON payment_transactions(provider_transaction_id);
```

#### 2. withdrawal_requests

Track host withdrawal requests and their processing status.

```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id),
  wallet_id UUID NOT NULL REFERENCES host_wallets(id),
  
  -- Withdrawal details
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BWP',
  
  -- Payout destination
  payout_method VARCHAR(50) NOT NULL,
  -- Values: 'bank_transfer', 'orange_money', 'myzaka', 'smega'
  payout_details JSONB NOT NULL,
  -- Structure varies by method:
  -- bank_transfer: { bank_name, account_number, account_holder, branch_code }
  -- orange_money: { mobile_number, account_holder }
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending',
  -- Values: pending, processing, completed, failed, cancelled
  
  -- Processing details
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  provider_reference VARCHAR(100),
  provider_response JSONB,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT withdrawal_requests_amount_positive CHECK (amount >= 200)
);

-- Indexes
CREATE INDEX idx_withdrawal_requests_host ON withdrawal_requests(host_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created ON withdrawal_requests(created_at DESC);
```

#### 3. payout_details

Store host payout methods (bank accounts, mobile money).

```sql
CREATE TABLE payout_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Method type
  payout_method VARCHAR(50) NOT NULL,
  -- Values: 'bank_transfer', 'orange_money', 'myzaka', 'smega'
  
  -- Encrypted details
  details_encrypted JSONB NOT NULL,
  -- Bank: { bank_name, account_number, account_holder, branch_code }
  -- Mobile: { mobile_number, account_holder }
  
  -- Display info (non-sensitive)
  display_name VARCHAR(100),  -- e.g., "FNB ***4521" or "Orange ***7890"
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT payout_details_one_default_per_host 
    EXCLUDE (host_id WITH =) WHERE (is_default = true)
);

-- Indexes
CREATE INDEX idx_payout_details_host ON payout_details(host_id);
CREATE INDEX idx_payout_details_default ON payout_details(host_id, is_default) WHERE is_default = true;
```

#### 4. payment_config

Admin-configurable payment settings.

```sql
CREATE TABLE payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO payment_config (key, value, description) VALUES
  ('payment_deadline_hours', '"24"', 'Hours renter has to pay after booking approved'),
  ('minimum_withdrawal', '"200"', 'Minimum withdrawal amount in BWP'),
  ('auto_release_earnings_hours', '"24"', 'Hours after rental end to auto-release earnings'),
  ('paygate_enabled', 'true', 'Enable card payments via PayGate'),
  ('orange_money_enabled', 'true', 'Enable OrangeMoney payments'),
  ('myzaka_enabled', 'false', 'Enable MyZaka payments (Q2 2026)'),
  ('smega_enabled', 'false', 'Enable Smega payments (Q2 2026)'),
  ('max_withdrawal_per_day', '"10000"', 'Maximum withdrawal amount per day in BWP'),
  ('withdrawal_cooldown_hours', '"24"', 'Hours between withdrawal requests');
```

### Table Modifications

#### 1. bookings table additions

```sql
-- Add payment-related columns
ALTER TABLE bookings 
  ADD COLUMN payment_status VARCHAR(30) DEFAULT 'unpaid',
  ADD COLUMN payment_deadline TIMESTAMPTZ,
  ADD COLUMN payment_transaction_id UUID REFERENCES payment_transactions(id);

-- Payment status values: unpaid, awaiting_payment, paid, refunded, partially_refunded

COMMENT ON COLUMN bookings.payment_status IS 'Payment state: unpaid, awaiting_payment, paid, refunded, partially_refunded';
COMMENT ON COLUMN bookings.payment_deadline IS 'Deadline for renter to complete payment after host approval';
```

#### 2. host_wallets table additions

```sql
-- Add pending balance tracking
ALTER TABLE host_wallets 
  ADD COLUMN pending_balance NUMERIC(10,2) DEFAULT 0;

-- Rename for clarity (optional, requires code updates)
-- balance = available_balance (can withdraw)
-- pending_balance = from active rentals (cannot withdraw)

COMMENT ON COLUMN host_wallets.balance IS 'Available balance that can be withdrawn';
COMMENT ON COLUMN host_wallets.pending_balance IS 'Earnings from active rentals, released after completion';
```

#### 3. wallet_transactions type additions

```sql
-- Ensure transaction_type enum supports new types
-- Existing types: topup, commission_deduction, withdrawal
-- New types needed: rental_earnings_pending, earnings_released, withdrawal_reversal

-- If using varchar, ensure these values are handled:
-- 'rental_earnings_pending' - Initial credit when payment received
-- 'earnings_released' - Move from pending to available
-- 'withdrawal_reversal' - Failed withdrawal restored
```

### Row Level Security Policies

```sql
-- payment_transactions RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admins WHERE id = auth.uid()
  ));

-- withdrawal_requests RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can create their own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- payout_details RLS
ALTER TABLE payout_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage their own payout details"
  ON payout_details FOR ALL
  USING (auth.uid() = host_id);

-- payment_config RLS (admin only)
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment config"
  ON payment_config FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admins WHERE id = auth.uid()
  ));

CREATE POLICY "Anyone can read payment config"
  ON payment_config FOR SELECT
  USING (true);
```

### Database Functions

#### 1. release_pending_earnings

```sql
CREATE OR REPLACE FUNCTION release_pending_earnings(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id UUID;
  v_amount NUMERIC;
  v_wallet_id UUID;
  v_booking_status TEXT;
BEGIN
  -- Get booking info and validate
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
  
  -- Update wallet balances atomically
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
  
  -- Record the transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    reference_id,
    balance_after
  )
  SELECT 
    v_wallet_id,
    v_amount,
    'earnings_released',
    'Earnings released for booking ' || p_booking_id::TEXT,
    p_booking_id,
    hw.balance
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN TRUE;
END;
$$;
```

#### 2. credit_pending_earnings

```sql
CREATE OR REPLACE FUNCTION credit_pending_earnings(
  p_booking_id UUID,
  p_host_earnings NUMERIC,
  p_platform_commission NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id UUID;
  v_wallet_id UUID;
BEGIN
  -- Get host from booking
  SELECT c.owner_id
  INTO v_host_id
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  WHERE b.id = p_booking_id;
  
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;
  
  -- Update pending balance
  UPDATE host_wallets
  SET 
    pending_balance = pending_balance + p_host_earnings,
    updated_at = NOW()
  WHERE host_id = v_host_id
  RETURNING id INTO v_wallet_id;
  
  -- Create wallet if doesn't exist
  IF v_wallet_id IS NULL THEN
    INSERT INTO host_wallets (host_id, balance, pending_balance, currency)
    VALUES (v_host_id, 0, p_host_earnings, 'BWP')
    RETURNING id INTO v_wallet_id;
  END IF;
  
  -- Record transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    reference_id,
    balance_after
  )
  SELECT 
    v_wallet_id,
    p_host_earnings,
    'rental_earnings_pending',
    'Pending earnings from booking ' || p_booking_id::TEXT || ' (Commission: P' || p_platform_commission::TEXT || ')',
    p_booking_id,
    hw.pending_balance
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN TRUE;
END;
$$;
```

#### 3. process_withdrawal_request

```sql
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
AS $$
DECLARE
  v_wallet_id UUID;
  v_available_balance NUMERIC;
  v_withdrawal_id UUID;
  v_min_withdrawal NUMERIC;
BEGIN
  -- Get minimum withdrawal from config
  SELECT (value::TEXT)::NUMERIC INTO v_min_withdrawal
  FROM payment_config WHERE key = 'minimum_withdrawal';
  v_min_withdrawal := COALESCE(v_min_withdrawal, 200);
  
  -- Validate amount
  IF p_amount < v_min_withdrawal THEN
    RAISE EXCEPTION 'Minimum withdrawal is P%', v_min_withdrawal;
  END IF;
  
  -- Get wallet and validate balance
  SELECT id, balance
  INTO v_wallet_id, v_available_balance
  FROM host_wallets
  WHERE host_id = p_host_id
  FOR UPDATE;  -- Lock for atomic operation
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: P%', v_available_balance;
  END IF;
  
  -- Deduct from balance immediately
  UPDATE host_wallets
  SET 
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Create withdrawal request
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
  
  -- Record transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    reference_id,
    balance_after
  )
  SELECT 
    v_wallet_id,
    -p_amount,
    'withdrawal',
    'Withdrawal request ' || v_withdrawal_id::TEXT,
    v_withdrawal_id,
    hw.balance
  FROM host_wallets hw
  WHERE hw.id = v_wallet_id;
  
  RETURN v_withdrawal_id;
END;
$$;
```

---

## Edge Functions

### 1. initiate-payment

**Path:** `supabase/functions/initiate-payment/index.ts`

**Purpose:** Initiate payment with PayGate or Ooze

**Request:**
```typescript
interface InitiatePaymentRequest {
  booking_id: string;
  payment_method: 'card' | 'orange_money';
  return_url: string;
  mobile_number?: string;  // Required for orange_money
}
```

**Response:**
```typescript
interface InitiatePaymentResponse {
  success: boolean;
  transaction_id: string;
  redirect_url?: string;      // For card payments
  pay_request_id?: string;    // PayGate reference
  reference?: string;         // For mobile money
  error?: string;
}
```

**Flow:**
1. Validate user is authenticated
2. Validate booking exists and status is `awaiting_payment`
3. Validate user is the renter for this booking
4. Create `payment_transaction` record (status: initiated)
5. Call PayGate/Ooze API to initiate payment
6. Update transaction with provider references
7. Return redirect URL or payment reference

**PayGate Integration:**
```typescript
// PayGate PayWeb3 initiate.trans
const paygateUrl = 'https://secure.paygate.co.za/payweb3/initiate.trans';

const params = {
  PAYGATE_ID: Deno.env.get('PAYGATE_ID'),
  REFERENCE: transactionId,
  AMOUNT: amountInCents,  // P100 = 10000
  CURRENCY: 'BWP',
  RETURN_URL: returnUrl,
  TRANSACTION_DATE: new Date().toISOString(),
  LOCALE: 'en-bw',
  COUNTRY: 'BWA',
  EMAIL: userEmail,
  NOTIFY_URL: `${supabaseUrl}/functions/v1/payment-webhook`,
  USER1: bookingId,  // Custom field for reference
  CHECKSUM: generateMD5Checksum(params)
};
```

### 2. payment-webhook

**Path:** `supabase/functions/payment-webhook/index.ts`

**Purpose:** Handle payment provider callbacks

**PayGate Webhook Fields:**
```typescript
interface PayGateWebhook {
  PAYGATE_ID: string;
  PAY_REQUEST_ID: string;
  REFERENCE: string;
  TRANSACTION_STATUS: '1' | '2' | '4';  // 1=Approved, 2=Declined, 4=Cancelled
  RESULT_CODE: string;
  RESULT_DESC: string;
  TRANSACTION_ID: string;
  RISK_INDICATOR: string;
  CHECKSUM: string;
}
```

**Flow:**
1. Validate checksum to prevent fraud
2. Find `payment_transaction` by provider reference
3. If TRANSACTION_STATUS === '1' (Approved):
   - Update transaction status to 'completed'
   - Calculate commission split
   - Call `credit_pending_earnings()` function
   - Update booking status to 'confirmed'
   - Update booking.payment_status to 'paid'
   - Send notifications to host and renter
4. If declined/cancelled:
   - Update transaction status to 'failed'
   - Send notification to renter
5. Return 'OK' (required by PayGate)

**Idempotency:** Check if transaction already processed to handle duplicate webhooks.

### 3. process-withdrawal

**Path:** `supabase/functions/process-withdrawal/index.ts`

**Purpose:** Process host withdrawal requests

**Request:**
```typescript
interface ProcessWithdrawalRequest {
  amount: number;
  payout_method: 'bank_transfer' | 'orange_money';
  payout_details_id?: string;  // Use saved payout details
}
```

**Flow:**
1. Validate user is authenticated host
2. Validate amount >= P200
3. Validate sufficient available balance
4. Call `process_withdrawal_request()` function
5. Initiate payout via PayGate/Ooze
6. Update withdrawal_request status
7. Send notification

### 4. query-payment

**Path:** `supabase/functions/query-payment/index.ts`

**Purpose:** Query payment status (backup for failed webhooks)

**Request:**
```typescript
interface QueryPaymentRequest {
  transaction_id?: string;
  pay_request_id?: string;
}
```

**Flow:**
1. Find transaction in database
2. Call PayGate query API
3. Update local status if different
4. Trigger fund allocation if newly completed

### 5. expire-bookings (Scheduled)

**Path:** `supabase/functions/expire-bookings/index.ts`

**Purpose:** Auto-expire unpaid bookings past deadline

**Schedule:** Every hour

**Flow:**
1. Find bookings where:
   - status = 'awaiting_payment'
   - payment_deadline < NOW()
2. Update status to 'expired'
3. Send notifications

### 6. release-earnings (Scheduled)

**Path:** `supabase/functions/release-earnings/index.ts`

**Purpose:** Auto-release earnings after rental completion

**Schedule:** Every hour

**Flow:**
1. Find bookings where:
   - status = 'completed'
   - end_date + 24h < NOW()
   - earnings not yet released
2. Call `release_pending_earnings()` for each
3. Send notifications to hosts

---

## Frontend Components

### New Pages

| Page | Path | Purpose |
|------|------|---------|
| BookingPayment | `/booking/{id}/pay` | Payment method selection and initiation |
| PaymentReturn | `/payment/return` | Handle return from payment gateway |
| PaymentHistory | `/payments` | Renter's payment history |

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| PaymentMethodSelector | `src/components/payment/` | Select card/mobile money |
| PaymentCountdown | `src/components/payment/` | Show time remaining to pay |
| PaymentSummary | `src/components/payment/` | Booking and payment breakdown |
| PaymentStatus | `src/components/payment/` | Success/failure after payment |
| WithdrawalForm | `src/components/wallet/` | Request withdrawal |
| PayoutDetailsForm | `src/components/wallet/` | Add bank/mobile money |
| WalletBalanceEnhanced | `src/components/wallet/` | Show available + pending |

### Modified Components

| Component | Changes |
|-----------|---------|
| WalletBalanceCard | Add pending_balance display |
| BookingRequestActions | Add "Pay Now" button for awaiting_payment |
| BookingStatusBadge | Add awaiting_payment, expired states |
| RentalPaymentDetails | Show commission breakdown for hosts |

---

## Integration Specifications

### PayGate PayWeb3

**Documentation:** https://docs.paygate.co.za/

**Endpoints:**
- Initiate: `POST https://secure.paygate.co.za/payweb3/initiate.trans`
- Query: `POST https://secure.paygate.co.za/payweb3/query.trans`
- Process: `https://secure.paygate.co.za/payweb3/process.trans` (redirect)

**Required Secrets:**
```
PAYGATE_ID=<merchant_id>
PAYGATE_ENCRYPTION_KEY=<md5_key>
PAYGATE_MODE=sandbox|production
```

**Checksum Generation:**
```typescript
function generateChecksum(params: Record<string, string>, key: string): string {
  const values = Object.values(params).join('');
  return md5(values + key);
}
```

**Supported Cards:**
- Visa
- Mastercard
- American Express (if enabled)

### Ooze Botswana (Mobile Money)

**Documentation:** TBD (requires API access)

**Supported Methods:**
- OrangeMoney (now)
- MyZaka (Q2 2026)
- Smega (Q2 2026)

**Required Secrets:**
```
OOZE_API_KEY=<api_key>
OOZE_MERCHANT_ID=<merchant_id>
OOZE_WEBHOOK_SECRET=<webhook_secret>
```

---

## Security Considerations

### Payment Security

| Concern | Mitigation |
|---------|------------|
| Checksum validation | Verify all webhook checksums before processing |
| Duplicate processing | Idempotent webhook handling via transaction status check |
| Amount tampering | Verify amount matches booking total in webhook |
| Unauthorized access | RLS policies + auth validation in edge functions |

### Withdrawal Security

| Concern | Mitigation |
|---------|------------|
| Fraud | P200 minimum, verified payout details |
| Account takeover | Re-authentication for adding payout methods |
| Velocity abuse | Max withdrawal per day, cooldown between requests |
| Race conditions | Database-level locking with FOR UPDATE |

### Data Protection

| Data | Protection |
|------|------------|
| Card numbers | Never stored - PayGate hosted page |
| Bank accounts | Encrypted in payout_details |
| Mobile numbers | Partially masked in UI |
| Transaction logs | Retained for compliance |

---

## Testing Strategy

### Unit Tests

| Function | Test Cases |
|----------|------------|
| Commission calculation | Various amounts, edge cases |
| Checksum generation | Known PayGate test vectors |
| Withdrawal validation | Min amount, balance check |

### Integration Tests

| Flow | Test Cases |
|------|------------|
| Payment initiation | Valid booking, invalid booking, expired deadline |
| Webhook processing | Success, decline, cancelled, duplicate |
| Withdrawal | Sufficient balance, insufficient, concurrent requests |

### End-to-End Tests

| Scenario | Steps |
|----------|-------|
| Complete payment flow | Create booking → Approve → Pay → Confirm |
| Withdrawal flow | Complete rental → Release earnings → Withdraw |
| Expired booking | Approve → Wait for deadline → Verify expired |

### PayGate Sandbox Testing

**Test Cards:**
- Success: `4000000000000002` (Visa)
- Decline: `4000000000000036`

**Test Amount Triggers:**
- P1.00 = Approved
- P2.00 = Declined
- P4.00 = Cancelled

---

## Implementation Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Infrastructure | Database schema, secrets config, payment_config |
| 2-3 | PayGate Core | initiate-payment, payment-webhook |
| 3-4 | PayGate Complete | Return handler, query-payment, testing |
| 4-5 | Wallet Enhancement | Split payments, earnings release, balance UI |
| 5-6 | Renter Payment UI | Payment selection, booking status updates |
| 6-7 | Ooze Integration | OrangeMoney via Ooze |
| 7-8 | Withdrawals | Payout details, withdrawal requests, automation |
| 8-9 | Admin Tools | Transaction dashboard, withdrawal management |
| 9-10 | Reporting | Revenue dashboard, reconciliation |
| 10-11 | Polish & QA | End-to-end testing, edge cases, documentation |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PayGate integration delays | Medium | High | Start sandbox testing immediately |
| Ooze API unavailable | Medium | Medium | Begin research spike early |
| Webhook failures | Low | High | Query-payment backup, monitoring |
| Withdrawal fraud | Low | High | Velocity limits, verification |
| Reconciliation errors | Low | Medium | Daily automated reconciliation |
| Edge function timeouts | Low | Medium | Async processing where possible |

---

## Dependencies

### External
- [ ] PayGate merchant account (via DVLP Botswana/FNB)
- [ ] Ooze Botswana API credentials
- [ ] Bank account for platform revenue

### Internal
- [x] Commission rates table (exists)
- [x] Host wallets table (exists, needs modification)
- [x] Wallet transactions table (exists)
- [x] Notification system (exists)
- [x] Handover system (for earnings release trigger)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Payment success rate | > 95% |
| Webhook processing time | < 5 seconds |
| Withdrawal processing | < 24 hours |
| Reconciliation accuracy | 100% |
| Host satisfaction (earnings visibility) | > 4.5/5 |

---

## Appendix A: Error Codes

### PayGate Result Codes

| Code | Description | Action |
|------|-------------|--------|
| 900001 | Transaction approved | Mark as completed |
| 900002 | Transaction declined | Mark as failed, notify user |
| 900003 | Invalid checksum | Log error, investigate |
| 900004 | Duplicate transaction | Return success (idempotent) |
| 990017 | Auth complete pending settlement | Treat as pending |

### Internal Error Codes

| Code | Description |
|------|-------------|
| PAY001 | Booking not found |
| PAY002 | Booking not in awaiting_payment status |
| PAY003 | Payment deadline expired |
| PAY004 | Amount mismatch |
| WDR001 | Insufficient balance |
| WDR002 | Below minimum withdrawal |
| WDR003 | Payout details not verified |

---

## Appendix B: Notification Templates

### Payment Received (to Host)

```
Subject: Payment Received for Your Car Rental

Hi {host_name},

Great news! {renter_name} has completed payment for the {car_brand} {car_model} rental.

Booking Details:
- Dates: {start_date} to {end_date}
- Total: P{total_amount}
- Your earnings: P{host_earnings} (pending until rental completes)

The rental is now confirmed. Please prepare your vehicle for handover.
```

### Payment Received (to Renter)

```
Subject: Payment Confirmed - Your Rental is Booked!

Hi {renter_name},

Your payment of P{total_amount} has been processed successfully.

Your rental of the {car_brand} {car_model} is now confirmed for {start_date} to {end_date}.

You'll receive handover instructions closer to the rental date.
```

### Earnings Released (to Host)

```
Subject: Earnings Available for Withdrawal

Hi {host_name},

Your earnings of P{amount} from the {car_brand} {car_model} rental are now available for withdrawal.

Available Balance: P{available_balance}

You can withdraw your earnings at any time from your wallet.
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-02 | Dev Team | Initial document |

---

**END OF DOCUMENT**
