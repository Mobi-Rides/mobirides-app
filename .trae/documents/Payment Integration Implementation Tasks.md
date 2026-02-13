Based on the detailed review of `PAYMENT_INTEGRATION_IMPLEMENTATION.md`, here is the comprehensive implementation plan.

# Payment Integration Implementation Plan

## Phase 1: Database & Infrastructure (Foundation)
**Goal**: Establish the data schema for payments, wallets, and insurance.
1.  **Core Payment Tables**: Create `payment_transactions`, `withdrawal_requests`, `payout_details`, and `payment_config` with RLS policies.
2.  **Table Extensions**:
    *   `bookings`: Add payment status, deadline, transaction IDs, and price breakdown fields.
    *   `host_wallets`: Add `pending_balance` for custodial flow.
    *   `wallet_transactions`: Add new transaction types (rental earnings, releases).
3.  **Database Functions**: Implement `credit_pending_earnings`, `release_pending_earnings`, and `process_withdrawal_request` stored procedures.
4.  **Insurance Schema**: Create `insurance_commission_rates`, `premium_remittance_batches` and update `insurance_policies`/`insurance_claims`.

## Phase 2: Payment Flow Separation (Mock Services)
**Goal**: Enable frontend development and testing without live gateways.
1.  **Service Split**: Update `mockPaymentService.ts` documentation (Host Top-ups only).
2.  **Renter Mock Service**: Create `mockBookingPaymentService.ts` for renter booking payments with deterministic test triggers.
3.  **Payment Hook**: Implement `useBookingPayment` hook to abstract payment logic.
4.  **Types**: Update `BookingStatus` enum to include `awaiting_payment`.

## Phase 3: Renter Payment UI & Price Transparency
**Goal**: Allow renters to see clear pricing and pay for bookings.
1.  **Price Components**: Create `UnifiedPriceSummary` to standardize price display (Base + Dynamic + Insurance - Discount).
2.  **Booking Dialog**: Update to use `UnifiedPriceSummary` and save full price breakdown to DB.
3.  **Payment UI**: Implement `RenterPaymentModal`, `PaymentMethodSelector` (Card/Mobile Money), and `PaymentDeadlineTimer`.
4.  **Entry Points**: Add "Pay Now" button to `RenterBookingCard`.
5.  **Receipts**: Update `ReceiptModal` and `RentalPaymentDetails` to show correct commission (15%) and insurance.

## Phase 4: Host Wallet & Earnings UI
**Goal**: Give hosts visibility into pending vs. available earnings.
1.  **Wallet Cards**: Update `WalletBalanceCard` to show "Available" vs "Pending" balances.
2.  **Transaction History**: Update list to support new transaction types and filtering.
3.  **Withdrawals**: Create `WithdrawalForm` and `PayoutDetailsForm` (Bank/Mobile Money).
4.  **Booking Request**: Update host view to show gross earnings and commission deduction clearly.

## Phase 5: Edge Functions (Backend Logic)
**Goal**: Handle secure payment processing and automation.
1.  **Payment Processing**: Implement `initiate-payment` (PayGate/Ooze) and `payment-webhook`.
2.  **Payouts**: Implement `process-withdrawal` and `query-payment`.
3.  **Scheduled Tasks**: Implement `expire-bookings` (24h deadline) and `release-earnings` (post-rental).

## Phase 6: Insurance & Admin Tools
**Goal**: Manage premiums, claims, and remittances.
1.  **Remittance**: Build Admin Remittance Dashboard to batch and track Pay-U payments.
2.  **Claims**: Update Admin Claims Dashboard for Pay-U integration (submit, status tracking).
3.  **Excess Payments**: Implement flow for renters to pay insurance excess/liability.
