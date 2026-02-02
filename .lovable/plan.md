
# Update Payment Implementation Document

## Overview

Update the `docs/PAYMENT_INTEGRATION_IMPLEMENTATION.md` to incorporate the P50 minimum wallet balance requirement and add three new sections requested by stakeholders.

## Changes Summary

### 1. Update Executive Summary - Key Design Decisions Table

Add the P50 minimum wallet balance as a key design decision:

| Decision | Chosen Approach | Rationale |
|----------|-----------------|-----------|
| **Host Wallet Minimum** | P50 minimum balance to accept bookings | Platform cashflow buffer; foundation for future subscription model |

### 2. New Section: Legacy Mock Logic Migration

Insert after the Risk Assessment section (line ~1042). This section will document:

**Components to Deprecate:**
- `src/services/commission/commissionDeduction.ts` - Remove upfront commission deduction from wallet
- `src/services/commission/walletValidation.ts` - Refactor to check P50 minimum only (not commission amount)
- `src/components/booking-request/WalletCommissionSection.tsx` - Update messaging to reflect new flow

**Components to Refactor:**
- `src/components/dashboard/WalletBalanceIndicator.tsx` - Show available + pending, not pre-funded balance
- `src/components/dashboard/WalletBalanceCard.tsx` - Add pending balance display
- `HostBookingCard.tsx` - Keep earnings display but clarify it's credited after renter pays

**Logic Changes:**

| Current Mock Behavior | New Production Behavior |
|-----------------------|-------------------------|
| Host must pre-fund wallet with commission + P50 to accept | Host needs P50 minimum to accept (cashflow buffer) |
| Commission deducted immediately from host wallet on approval | Commission retained from renter's payment |
| Host sees net amount (85%) as "what they'll earn" | Host sees gross amount credited, commission shown as "already deducted" |
| `deductCommissionFromEarnings()` takes from wallet balance | `credit_pending_earnings()` adds 85% to pending_balance |

**Migration Steps:**
1. Add `pending_balance` column to `host_wallets`
2. Update `walletValidation.ts` to check only P50 minimum (remove commission check)
3. Disable `commissionDeduction.ts` logic (or feature-flag for rollback)
4. Update all UI components showing commission flow
5. Deploy new payment webhook to handle real commission split

### 3. New Section: Payment Flow Comparison

Visual comparison of current mock vs new custodial architecture:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ CURRENT MOCK FLOW (Pre-payment Commission Model)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   HOST accepts booking                                                      │
│     └─► Check: wallet >= P50 + commission?                                  │
│           └─► YES: Deduct commission from host wallet                       │
│                 └─► Booking status: confirmed                               │
│                       └─► (No actual payment collected from renter)         │
│                                                                             │
│   PROBLEM: Commission taken from host before any payment received           │
│   PROBLEM: No real payment collection from renter                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│ NEW CUSTODIAL FLOW (Production Payment Model)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   HOST accepts booking                                                      │
│     └─► Check: wallet >= P50? (cashflow buffer only)                        │
│           └─► YES: Booking status: awaiting_payment                         │
│                 └─► Renter pays via PayGate/Ooze                            │
│                       └─► MobiRides receives full amount (P1000)            │
│                             └─► Split: P150 (15%) retained as commission    │
│                                   └─► P850 (85%) credited to host wallet    │
│                                         (as pending_balance)                │
│                                                                             │
│   RESULT: Platform holds funds, host sees their share in wallet             │
│   RESULT: Commission collected from actual payment, not host wallet         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Money Flow Comparison:**

```text
MOCK FLOW (Current):
┌──────────┐      P150 (commission)      ┌──────────────┐
│   HOST   │ ──────────────────────────► │   PLATFORM   │
│  WALLET  │                             │   (nowhere)  │
└──────────┘                             └──────────────┘
     No actual renter payment occurs


NEW CUSTODIAL FLOW (Production):
┌──────────┐                             ┌──────────────┐
│  RENTER  │ ─────── P1000 ────────────► │  MOBIRIDES   │
└──────────┘                             │   MERCHANT   │
                                         │   ACCOUNT    │
                                         └──────┬───────┘
                                                │
                               ┌────────────────┼────────────────┐
                               │                                 │
                               ▼                                 ▼
                        ┌──────────────┐                 ┌──────────────┐
                        │   PLATFORM   │                 │     HOST     │
                        │  COMMISSION  │                 │   WALLET     │
                        │    (15%)     │                 │  (85% held)  │
                        │    P150      │                 │    P850      │
                        └──────────────┘                 └──────────────┘
```

### 4. New Section: Wallet UI Updates

Document the visual changes needed for the wallet interface:

**Current Wallet UI:**
```text
┌──────────────────────────────────┐
│ 💰 Wallet Balance                │
│                                  │
│ Balance: P850.00                 │
│                                  │
│ ⚠️ Need P50 + commission to      │
│    accept bookings               │
│                                  │
│ [Top Up Wallet]                  │
└──────────────────────────────────┘
```

**New Wallet UI:**
```text
┌──────────────────────────────────┐
│ 💰 Your Wallet                   │
│                                  │
│ Available Balance    P850.00     │
│ (can withdraw)                   │
│ ────────────────────────────     │
│ Pending Earnings     P450.00     │
│ (from 2 active rentals)          │
│ ℹ️ Released when rentals complete │
│ ────────────────────────────     │
│ Total               P1,300.00    │
│                                  │
│ ✓ Ready to accept bookings       │
│   (P50 minimum met)              │
│                                  │
│ [Withdraw Available Funds]       │
│ [View Earnings Breakdown]        │
└──────────────────────────────────┘
```

**Component Changes:**

| Component | Current State | New State |
|-----------|---------------|-----------|
| `WalletBalanceCard` | Shows single balance | Shows available + pending + total |
| `WalletBalanceIndicator` | Shows commission warning | Shows P50 minimum status only |
| `WalletCommissionSection` | "Commission will be deducted from wallet" | "15% commission is retained from payment" |
| `TopUpModal` | "Top up to accept bookings" | "Maintain P50 minimum for platform access" |
| `WalletTransactionHistory` | Shows commission deductions | Shows pending credits + releases |

**New Transaction Types Displayed:**

| Type | Display Label | Icon |
|------|---------------|------|
| `rental_earnings_pending` | "Earnings (Pending)" | 🕐 |
| `earnings_released` | "Earnings Released" | ✓ |
| `withdrawal` | "Withdrawal" | ↗️ |
| `topup` | "Top Up" | + |

### 5. Update: Host Wallet Minimum Business Logic

Add to the Executive Summary / Key Design Decisions section:

**P50 Minimum Wallet Balance:**

The P50 minimum wallet balance requirement serves multiple purposes:

1. **Platform Cashflow Buffer**: Ensures positive cash relationship between MobiRides and hosts
2. **Commitment Signal**: Demonstrates host commitment to the platform
3. **Future Subscription Foundation**: Provides infrastructure for planned monthly host subscription fee

**Future Enhancement (Post-MVP):**
- Monthly subscription fee (P50 or configurable) for hosts using the platform
- Automatic deduction from wallet balance
- Subscription status affects listing visibility
- Grace period handling for insufficient balance

### 6. Update payment_config Defaults

Add subscription-related config keys for future use:

```sql
-- Existing
('minimum_wallet_balance', '"50"', 'Minimum wallet balance to accept bookings'),

-- Future (disabled by default)
('host_subscription_enabled', 'false', 'Enable monthly host subscription'),
('host_subscription_amount', '"50"', 'Monthly subscription fee in BWP'),
('subscription_grace_days', '"7"', 'Grace period days for insufficient balance');
```

### 7. Update Document Revision History

```
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-02 | Dev Team | Initial document |
| 1.1 | 2026-02-02 | Dev Team | Added Legacy Migration, Flow Comparison, Wallet UI sections; P50 minimum requirement |
```

## Files to Modify

| File | Action |
|------|--------|
| `docs/PAYMENT_INTEGRATION_IMPLEMENTATION.md` | Add new sections and updates described above |

## New Sections Order (in document)

1. Executive Summary (updated)
2. Payment Flow Architecture
3. **Payment Flow Comparison** (NEW - insert after architecture)
4. Database Schema
5. Edge Functions
6. Frontend Components
7. **Wallet UI Updates** (NEW - insert after Frontend Components)
8. Integration Specifications
9. Security Considerations
10. Testing Strategy
11. Implementation Timeline
12. Risk Assessment
13. **Legacy Mock Logic Migration** (NEW - insert after Risk Assessment)
14. Dependencies
15. Success Metrics
16. Appendices
17. Document Revision History (updated)

## Technical Notes for Engineers

**Key Understanding:**
- The MobiRides business account is the **custodial account** that holds all renter payments
- Host wallets are **ledger entries** reflecting their share of funds held by MobiRides
- Withdrawals are actual payouts from the business account to hosts
- The P50 minimum ensures there's always a positive balance in the platform-host relationship
- This architecture supports future features like instant payouts, credit lines, or subscription billing

