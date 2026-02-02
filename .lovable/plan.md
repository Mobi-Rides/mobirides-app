
# MobiRides Payment Integration - Jira-Style Implementation Plan

## Executive Summary

This document outlines the phased implementation of payment processing for MobiRides, integrating PayGate (via DVLP Botswana/FNB Merchant) for card payments and Ooze Botswana for mobile money (OrangeMoney now, MyZaka and Smega in Q2 2026).

**Key Design Decisions (from stakeholder input):**
- Earnings credited to host wallet immediately when renter pays (marked as pending until rental completes)
- "Request first, pay later" flow: Host approves booking, renter has deadline to pay
- Automated withdrawals via payment gateway
- Minimum withdrawal amount: P200

---

## Payment Flow Architecture

### Complete Transaction Lifecycle

```text
PHASE 1: BOOKING REQUEST
┌────────────────────────────────────────────────────────────────┐
│ Renter                                                         │
│   └─► Creates booking request (status: pending)                │
│         └─► Host receives notification                         │
│               └─► Host approves/declines                       │
│                     └─► If approved: status → awaiting_payment │
│                           └─► Renter has 24h to pay            │
└────────────────────────────────────────────────────────────────┘

PHASE 2: PAYMENT COLLECTION
┌────────────────────────────────────────────────────────────────┐
│ Renter clicks "Pay Now"                                        │
│   └─► Edge function: initiate-payment                          │
│         └─► PayGate PayWeb3 initiate.trans                     │
│               └─► Returns PAY_REQUEST_ID                       │
│                     └─► Redirect to PayGate hosted page        │
│                           └─► Renter completes payment         │
│                                 └─► PayGate NOTIFY_URL webhook │
│                                       └─► payment confirmed    │
└────────────────────────────────────────────────────────────────┘

PHASE 3: FUND ALLOCATION
┌────────────────────────────────────────────────────────────────┐
│ Payment Confirmed (webhook received)                           │
│   └─► Create payment_transaction record                        │
│         └─► Calculate split:                                   │
│               • Commission (15%): P150 → platform_revenue      │
│               • Host share (85%): P850 → host wallet (pending) │
│                     └─► Booking status: confirmed              │
│                           └─► Notifications sent               │
└────────────────────────────────────────────────────────────────┘

PHASE 4: EARNINGS RELEASE
┌────────────────────────────────────────────────────────────────┐
│ Rental Completed (handover_out + handover_in done)             │
│   └─► Host earnings status: pending → available                │
│         └─► Host can now withdraw                              │
└────────────────────────────────────────────────────────────────┘

PHASE 5: HOST WITHDRAWAL
┌────────────────────────────────────────────────────────────────┐
│ Host requests withdrawal (min P200)                            │
│   └─► Edge function: process-withdrawal                        │
│         └─► PayGate/Mobile Money payout                        │
│               └─► wallet_transaction recorded                  │
│                     └─► Balance updated                        │
└────────────────────────────────────────────────────────────────┘
```

---

## Epic Structure

### EPIC 1: Payment Infrastructure Foundation
**Priority:** P0 (Critical)
**Target:** Week 1-2

### EPIC 2: PayGate Card Payment Integration
**Priority:** P0 (Critical)
**Target:** Week 2-4

### EPIC 3: Host Wallet Enhancement
**Priority:** P0 (Critical)
**Target:** Week 3-5

### EPIC 4: Payment UI/UX
**Priority:** P1 (High)
**Target:** Week 4-6

### EPIC 5: Mobile Money Integration (Ooze)
**Priority:** P1 (High)
**Target:** Week 6-8

### EPIC 6: Withdrawal System
**Priority:** P1 (High)
**Target:** Week 7-9

### EPIC 7: Admin Payment Management
**Priority:** P2 (Medium)
**Target:** Week 8-10

### EPIC 8: Reporting & Reconciliation
**Priority:** P2 (Medium)
**Target:** Week 9-11

---

## Detailed Stories by Epic

---

## EPIC 1: Payment Infrastructure Foundation

### MPAY-001: Database Schema for Payments
**Type:** Task | **Priority:** P0 | **Points:** 8

**Description:**
Create the database schema to support payment transactions, withdrawal requests, and enhanced wallet functionality.

**Acceptance Criteria:**
- [ ] Create `payment_transactions` table with full audit trail
- [ ] Create `withdrawal_requests` table
- [ ] Add `payment_status` column to bookings (pending_payment, paid, refunded)
- [ ] Add `available_balance` and `pending_balance` to host_wallets (or track via view)
- [ ] Create `payment_methods` table for saved cards/mobile money accounts
- [ ] Add `payout_details` table for host bank/mobile money info
- [ ] All tables have appropriate RLS policies

**Technical Details:**

**payment_transactions table:**
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID NOT NULL,
  
  -- Payment details
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BWP',
  payment_method VARCHAR(50) NOT NULL, -- 'card', 'orange_money', 'myzaka', 'smega'
  payment_provider VARCHAR(50) NOT NULL, -- 'paygate', 'ooze'
  
  -- Provider references
  provider_transaction_id VARCHAR(100),
  provider_pay_request_id VARCHAR(50), -- PayGate PAY_REQUEST_ID
  provider_reference VARCHAR(100),
  
  -- Status tracking
  status VARCHAR(30) NOT NULL DEFAULT 'initiated',
  -- initiated, pending, completed, failed, refunded, cancelled
  
  -- Split tracking
  platform_commission NUMERIC(10,2),
  host_earnings NUMERIC(10,2),
  commission_rate NUMERIC(5,4),
  
  -- Metadata
  provider_response JSONB,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**withdrawal_requests table:**
```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id),
  wallet_id UUID NOT NULL REFERENCES host_wallets(id),
  
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BWP',
  
  -- Payout destination
  payout_method VARCHAR(50) NOT NULL, -- 'bank_transfer', 'orange_money', 'myzaka', 'smega'
  payout_details JSONB NOT NULL, -- account number, mobile number, etc.
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending',
  -- pending, processing, completed, failed, cancelled
  
  -- Processing details
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  provider_reference VARCHAR(100),
  provider_response JSONB,
  failure_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**booking modifications:**
```sql
ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(30) DEFAULT 'unpaid';
-- Values: unpaid, awaiting_payment, paid, refunded, partially_refunded
ALTER TABLE bookings ADD COLUMN payment_deadline TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN payment_transaction_id UUID REFERENCES payment_transactions(id);
```

**host_wallets modifications:**
```sql
-- Add tracking for pending vs available
ALTER TABLE host_wallets ADD COLUMN pending_balance NUMERIC(10,2) DEFAULT 0;
-- 'balance' becomes 'available_balance' (can withdraw)
-- 'pending_balance' = earnings from active rentals (cannot withdraw yet)
```

---

### MPAY-002: PayGate Secrets Configuration
**Type:** Task | **Priority:** P0 | **Points:** 2

**Description:**
Configure PayGate credentials as Supabase Edge Function secrets.

**Acceptance Criteria:**
- [ ] PAYGATE_ID secret configured
- [ ] PAYGATE_ENCRYPTION_KEY secret configured
- [ ] PAYGATE_NOTIFY_URL configured (points to webhook edge function)
- [ ] Sandbox credentials for testing environment

**Secrets Required:**
- `PAYGATE_ID`: Merchant ID from DVLP/FNB
- `PAYGATE_ENCRYPTION_KEY`: MD5 checksum key from PayGate portal
- `PAYGATE_MODE`: 'sandbox' or 'production'

---

### MPAY-003: Payment Configuration Table
**Type:** Task | **Priority:** P1 | **Points:** 3

**Description:**
Create admin-configurable payment settings.

**Technical Details:**
```sql
CREATE TABLE payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO payment_config (key, value, description) VALUES
('payment_deadline_hours', '24', 'Hours renter has to pay after booking approved'),
('minimum_withdrawal', '200', 'Minimum withdrawal amount in BWP'),
('auto_release_earnings_hours', '24', 'Hours after rental end to auto-release earnings'),
('paygate_enabled', 'true', 'Enable card payments via PayGate'),
('orange_money_enabled', 'true', 'Enable OrangeMoney payments'),
('myzaka_enabled', 'false', 'Enable MyZaka payments (Q2 2026)'),
('smega_enabled', 'false', 'Enable Smega payments (Q2 2026)');
```

---

## EPIC 2: PayGate Card Payment Integration

### MPAY-010: Payment Initiation Edge Function
**Type:** Story | **Priority:** P0 | **Points:** 8

**Description:**
Create edge function to initiate PayGate PayWeb3 transactions.

**Acceptance Criteria:**
- [ ] Validates booking exists and is in awaiting_payment status
- [ ] Generates secure checksum per PayGate specs
- [ ] Returns PAY_REQUEST_ID and redirect URL
- [ ] Creates payment_transaction record with 'initiated' status
- [ ] Handles errors gracefully with user-friendly messages

**Edge Function:** `supabase/functions/initiate-payment/index.ts`

**Request Body:**
```json
{
  "booking_id": "uuid",
  "return_url": "https://mobirides-app.lovable.app/booking-confirmation",
  "payment_method": "card"
}
```

**Response:**
```json
{
  "success": true,
  "pay_request_id": "23B785AE-C96C-32AF-4879-D2C9363DB6E8",
  "redirect_url": "https://secure.paygate.co.za/payweb3/process.trans",
  "transaction_id": "uuid"
}
```

**PayGate Integration Details:**
- Endpoint: `POST https://secure.paygate.co.za/payweb3/initiate.trans`
- Currency: BWP (Botswana Pula)
- Country: BWA
- Locale: en-bw
- Amount in cents (P100 = 10000)
- MD5 checksum required

---

### MPAY-011: Payment Webhook Handler
**Type:** Story | **Priority:** P0 | **Points:** 8

**Description:**
Create edge function to handle PayGate NOTIFY_URL callbacks.

**Acceptance Criteria:**
- [ ] Validates checksum to prevent fraud
- [ ] Updates payment_transaction status based on result
- [ ] If successful: updates booking status, credits host wallet, sends notifications
- [ ] If failed: updates status, notifies renter
- [ ] Responds with 'OK' as required by PayGate
- [ ] Idempotent - handles duplicate notifications

**Edge Function:** `supabase/functions/payment-webhook/index.ts`

**PayGate Response Fields:**
- PAYGATE_ID
- PAY_REQUEST_ID
- REFERENCE
- TRANSACTION_STATUS (1=Approved, 2=Declined, 4=Cancelled)
- RESULT_CODE
- RESULT_DESC
- TRANSACTION_ID
- RISK_INDICATOR
- CHECKSUM

---

### MPAY-012: Payment Status Query Function
**Type:** Story | **Priority:** P1 | **Points:** 5

**Description:**
Create edge function to query PayGate for transaction status (for cases where webhook fails).

**Acceptance Criteria:**
- [ ] Accepts PAY_REQUEST_ID
- [ ] Queries PayGate query endpoint
- [ ] Returns current transaction status
- [ ] Can be triggered manually or via cron for stuck transactions

**Edge Function:** `supabase/functions/query-payment/index.ts`

---

### MPAY-013: Payment Return URL Handler
**Type:** Story | **Priority:** P1 | **Points:** 3

**Description:**
Create page component to handle return from PayGate after payment.

**Acceptance Criteria:**
- [ ] Parses URL parameters from PayGate redirect
- [ ] Shows appropriate success/failure message
- [ ] Validates checksum
- [ ] Redirects to booking details after short delay

**Component:** `src/pages/PaymentReturn.tsx`

---

## EPIC 3: Host Wallet Enhancement

### MPAY-020: Split Payment Processing
**Type:** Story | **Priority:** P0 | **Points:** 5

**Description:**
When payment is confirmed, automatically split funds between platform commission and host earnings.

**Acceptance Criteria:**
- [ ] Calculate commission using existing commission_rates table
- [ ] Credit host wallet with pending_balance (not available yet)
- [ ] Record wallet_transaction with type 'rental_earnings_pending'
- [ ] Update booking with commission_amount and commission_status

**Flow:**
```
Payment P1000 received
  ├─► Platform Commission (15%): P150
  │     └─► Recorded in payment_transaction.platform_commission
  └─► Host Earnings (85%): P850
        └─► Credited to host_wallets.pending_balance
        └─► wallet_transaction created (type: rental_earnings_pending)
```

---

### MPAY-021: Earnings Release on Rental Completion
**Type:** Story | **Priority:** P0 | **Points:** 5

**Description:**
Move earnings from pending to available when rental is successfully completed.

**Acceptance Criteria:**
- [ ] Triggered when handover_in is completed
- [ ] Or auto-triggered 24h after rental end_date if no issues reported
- [ ] Moves amount from pending_balance to balance (available)
- [ ] Creates wallet_transaction (type: earnings_released)
- [ ] Notifies host that earnings are available for withdrawal

**Database Function:**
```sql
CREATE OR REPLACE FUNCTION release_pending_earnings(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_host_id UUID;
  v_amount NUMERIC;
  v_wallet_id UUID;
BEGIN
  -- Get booking and earnings info
  SELECT c.host_id, b.total_price * 0.85
  INTO v_host_id, v_amount
  FROM bookings b
  JOIN cars c ON b.car_id = c.id
  WHERE b.id = p_booking_id;
  
  -- Update wallet balances
  UPDATE host_wallets
  SET pending_balance = pending_balance - v_amount,
      balance = balance + v_amount,
      updated_at = NOW()
  WHERE host_id = v_host_id
  RETURNING id INTO v_wallet_id;
  
  -- Record transaction
  INSERT INTO wallet_transactions (...)
  ...
  
  RETURN TRUE;
END;
$$;
```

---

### MPAY-022: Wallet Balance Display Enhancement
**Type:** Story | **Priority:** P1 | **Points:** 3

**Description:**
Update WalletBalanceCard to show both available and pending balances.

**Acceptance Criteria:**
- [ ] Display available balance prominently (withdrawable)
- [ ] Show pending balance separately (from active rentals)
- [ ] Show total (available + pending)
- [ ] Pending earnings have tooltip explaining when they'll be released

**UI Mockup:**
```
┌──────────────────────────────────┐
│ 💰 Your Wallet                   │
│                                  │
│ Available Balance    P850.00     │
│ ────────────────────────────     │
│ Pending Earnings     P450.00     │
│ (from 2 active rentals)          │
│                                  │
│ [Withdraw Available Funds]       │
└──────────────────────────────────┘
```

---

## EPIC 4: Payment UI/UX

### MPAY-030: Payment Selection Page
**Type:** Story | **Priority:** P0 | **Points:** 5

**Description:**
Create payment method selection UI for renters.

**Acceptance Criteria:**
- [ ] Shows available payment methods (card, OrangeMoney)
- [ ] Displays booking summary and total
- [ ] Clear breakdown of what renter is paying for
- [ ] "Pay Now" button initiates payment flow
- [ ] Loading states during payment initiation

**Component:** `src/pages/BookingPayment.tsx`

---

### MPAY-031: Booking Status Flow Update
**Type:** Story | **Priority:** P0 | **Points:** 5

**Description:**
Update booking status handling to include payment states.

**New Status Flow:**
```
pending → (host approves) → awaiting_payment → (renter pays) → confirmed
pending → (host declines) → declined
awaiting_payment → (payment fails) → awaiting_payment (can retry)
awaiting_payment → (deadline passes) → expired
confirmed → (rental starts) → active
active → (rental ends) → completed
```

**Acceptance Criteria:**
- [ ] Update booking status enum/handling
- [ ] Show payment deadline countdown on awaiting_payment bookings
- [ ] Allow payment retry on failed attempts
- [ ] Auto-expire bookings past payment deadline (cron job)

---

### MPAY-032: Payment Countdown Timer Component
**Type:** Story | **Priority:** P1 | **Points:** 3

**Description:**
Create countdown component showing time remaining to pay.

**Acceptance Criteria:**
- [ ] Shows hours:minutes remaining
- [ ] Changes color when < 2 hours remaining
- [ ] Shows "Expired" when deadline passed

---

### MPAY-033: Payment History for Renters
**Type:** Story | **Priority:** P2 | **Points:** 3

**Description:**
Show renters their payment history and receipts.

**Acceptance Criteria:**
- [ ] List of all payments made
- [ ] Payment method used
- [ ] Receipt download option
- [ ] Link to associated booking

---

## EPIC 5: Mobile Money Integration (Ooze)

### MPAY-040: Ooze API Integration Research
**Type:** Spike | **Priority:** P1 | **Points:** 3

**Description:**
Research Ooze Botswana API documentation and integration requirements.

**Acceptance Criteria:**
- [ ] Document API endpoints and auth method
- [ ] Understand webhook/callback structure
- [ ] Document test credentials process
- [ ] Create integration architecture document

---

### MPAY-041: OrangeMoney Payment Edge Function
**Type:** Story | **Priority:** P1 | **Points:** 8

**Description:**
Create edge function to initiate OrangeMoney payments via Ooze.

**Acceptance Criteria:**
- [ ] Accepts mobile number and booking details
- [ ] Initiates Ooze OrangeMoney payment request
- [ ] Creates pending payment_transaction
- [ ] Returns transaction reference for tracking

---

### MPAY-042: Ooze Webhook Handler
**Type:** Story | **Priority:** P1 | **Points:** 5

**Description:**
Handle Ooze payment confirmations/failures.

**Acceptance Criteria:**
- [ ] Validates webhook signature
- [ ] Updates payment_transaction status
- [ ] Triggers fund allocation on success
- [ ] Handles failure scenarios

---

### MPAY-043: MyZaka Integration (Q2)
**Type:** Story | **Priority:** P2 | **Points:** 5

**Description:**
Add MyZaka as payment option via Ooze (when available Q2 2026).

---

### MPAY-044: Smega Integration (Q2)
**Type:** Story | **Priority:** P2 | **Points:** 5

**Description:**
Add Smega as payment option via Ooze (when available Q2 2026).

---

## EPIC 6: Withdrawal System

### MPAY-050: Host Payout Details Setup
**Type:** Story | **Priority:** P0 | **Points:** 5

**Description:**
Allow hosts to add their payout details (bank account or mobile money).

**Acceptance Criteria:**
- [ ] Form to add bank account details
- [ ] Form to add mobile money number (OrangeMoney, etc.)
- [ ] Validate mobile money numbers
- [ ] Store encrypted in payout_details table
- [ ] Allow multiple payout methods with one default

**Component:** `src/components/wallet/PayoutDetailsForm.tsx`

---

### MPAY-051: Withdrawal Request UI
**Type:** Story | **Priority:** P0 | **Points:** 5

**Description:**
Create withdrawal request interface for hosts.

**Acceptance Criteria:**
- [ ] Show available balance (can withdraw)
- [ ] Enforce P200 minimum withdrawal
- [ ] Cannot exceed available balance
- [ ] Select payout method
- [ ] Confirm withdrawal request
- [ ] Show processing status

**Component:** `src/components/wallet/WithdrawalRequestForm.tsx`

---

### MPAY-052: Automated Payout Edge Function
**Type:** Story | **Priority:** P0 | **Points:** 8

**Description:**
Process withdrawal requests automatically via PayGate/Ooze.

**Acceptance Criteria:**
- [ ] Validates withdrawal request
- [ ] Deducts from available balance immediately
- [ ] Initiates payout via appropriate provider
- [ ] Updates withdrawal_request status
- [ ] Handles failures with retry logic

**Edge Function:** `supabase/functions/process-withdrawal/index.ts`

---

### MPAY-053: Withdrawal History Component
**Type:** Story | **Priority:** P1 | **Points:** 3

**Description:**
Show hosts their withdrawal history.

**Acceptance Criteria:**
- [ ] List all withdrawal requests
- [ ] Show status (pending, processing, completed, failed)
- [ ] Show payout method and destination
- [ ] Filter by date range

---

## EPIC 7: Admin Payment Management

### MPAY-060: Admin Transaction Dashboard
**Type:** Story | **Priority:** P1 | **Points:** 5

**Description:**
Enhance admin dashboard with payment transaction visibility.

**Acceptance Criteria:**
- [ ] List all payment_transactions
- [ ] Filter by status, date, payment method
- [ ] Show transaction details
- [ ] Manual status update capability (with audit log)

---

### MPAY-061: Admin Withdrawal Management
**Type:** Story | **Priority:** P1 | **Points:** 5

**Description:**
Admin interface to monitor and manage withdrawals.

**Acceptance Criteria:**
- [ ] List all withdrawal requests
- [ ] Filter by status
- [ ] Manual approval option (for edge cases)
- [ ] Retry failed withdrawals
- [ ] Cancel/refund capability

---

### MPAY-062: Payment Configuration Admin
**Type:** Story | **Priority:** P2 | **Points:** 3

**Description:**
Admin UI to manage payment_config settings.

**Acceptance Criteria:**
- [ ] View/edit all payment config values
- [ ] Enable/disable payment methods
- [ ] Adjust commission rates
- [ ] Update withdrawal minimums

---

## EPIC 8: Reporting & Reconciliation

### MPAY-070: Revenue Dashboard
**Type:** Story | **Priority:** P2 | **Points:** 5

**Description:**
Admin dashboard showing platform revenue metrics.

**Acceptance Criteria:**
- [ ] Total revenue (commission collected)
- [ ] Revenue by time period
- [ ] Revenue by payment method
- [ ] Pending vs. collected commission
- [ ] Export to CSV

---

### MPAY-071: Host Earnings Report
**Type:** Story | **Priority:** P2 | **Points:** 3

**Description:**
Generate earnings reports for hosts.

**Acceptance Criteria:**
- [ ] Earnings by time period
- [ ] Breakdown by booking
- [ ] Commission deducted
- [ ] Withdrawals made
- [ ] PDF export for tax purposes

---

### MPAY-072: Daily Reconciliation Job
**Type:** Story | **Priority:** P2 | **Points:** 5

**Description:**
Automated job to reconcile payments with providers.

**Acceptance Criteria:**
- [ ] Query PayGate for all transactions
- [ ] Compare with local records
- [ ] Flag discrepancies
- [ ] Alert admin of issues

---

## Implementation Timeline

| Week | Sprint Focus | Key Deliverables |
|------|--------------|------------------|
| 1-2 | Infrastructure | Database schema, secrets config, payment_config |
| 2-3 | PayGate Core | Initiate payment, webhook handler |
| 3-4 | PayGate Complete | Return handling, status query, testing |
| 4-5 | Wallet Enhancement | Split payments, earnings release, balance UI |
| 5-6 | Renter Payment UI | Payment selection, booking status updates |
| 6-7 | Ooze Integration | OrangeMoney via Ooze |
| 7-8 | Withdrawals | Payout details, withdrawal requests, automation |
| 8-9 | Admin Tools | Transaction dashboard, withdrawal management |
| 9-10 | Reporting | Revenue dashboard, reconciliation |
| 10-11 | Polish & QA | End-to-end testing, edge cases, documentation |

---

## Technical Architecture Summary

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EDGE FUNCTIONS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   initiate-payment          payment-webhook           process-withdrawal   │
│   ├─ Validate booking       ├─ Verify checksum       ├─ Validate request   │
│   ├─ Create transaction     ├─ Update transaction    ├─ Deduct balance     │
│   ├─ Call PayGate/Ooze      ├─ Credit host wallet    ├─ Call payout API    │
│   └─ Return redirect URL    ├─ Update booking        └─ Update status      │
│                             └─ Send notifications                          │
│                                                                             │
│   query-payment             release-earnings          expire-bookings      │
│   ├─ Query provider         ├─ Move pending→available├─ Check deadlines    │
│   └─ Update if changed      └─ Notify host           └─ Cancel unpaid      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE TABLES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   payment_transactions      withdrawal_requests       payment_config       │
│   ├─ All payment attempts   ├─ Host payout requests   ├─ System settings   │
│   ├─ Provider references    ├─ Status tracking        └─ Admin editable    │
│   └─ Commission tracking    └─ Payout details                              │
│                                                                             │
│   host_wallets (enhanced)   payout_details            bookings (enhanced)  │
│   ├─ balance (available)    ├─ Bank accounts          ├─ payment_status    │
│   └─ pending_balance        └─ Mobile money           ├─ payment_deadline  │
│                                                       └─ payment_tx_id     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| PayGate integration delays | Start with sandbox testing immediately; have manual fallback |
| Ooze API availability | Begin spike early; document alternative mobile money providers |
| Webhook failures | Implement query-payment as backup; cron job for stuck transactions |
| Withdrawal fraud | P200 minimum; verified payout details; velocity checks |
| Reconciliation errors | Daily automated reconciliation; admin alerts |

---

## Dependencies

**External:**
- PayGate merchant account from DVLP Botswana (FNB)
- Ooze Botswana API credentials
- Bank account for receiving payments

**Internal:**
- Handover system completion triggers earnings release
- Notification service for payment events
- Commission rates table (already exists)

---

## Success Metrics

- Payment success rate > 95%
- Webhook processing time < 5 seconds
- Withdrawal processing < 24 hours
- Zero fund discrepancies in reconciliation
- Host satisfaction with earnings visibility

