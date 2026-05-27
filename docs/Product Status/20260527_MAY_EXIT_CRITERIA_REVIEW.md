# May Exit Criteria Review & Payment Scoping Document
**Date:** May 27, 2026  
**Status:** FINALIZED  
**Author:** Modisa Maphanyane (CEO / AI-Assisted)  
**Sprint:** Sprint 15 Gaps Alignment  

---

## 1. Executive Summary

This document serves as the formal **May Exit Criteria Review** and technical scoping plan to resolve the strategic alignment gaps between the **H1 2026 Roadmap** and **Sprint 15**. Specifically, it addresses three critical May exit criteria:

1. **Payment Provider Integration:** Scopes *both* **DPO/PayGate** (Credit Cards) and **Ooze Botswana** (Mobile Money), implements a custodial ledger model, deprecates mock dependencies, and formally assigns implementation to **Modisa Maphanyane** in the Sprint 15 plan.
2. **Security at 100% (MOB-700 Series):** Pulls the remaining and unverified security tickets (MOB-702 to MOB-708b) into Sprint 15 to ensure 100% remediation of vulnerability findings before launch.
3. **Test Coverage Audit:** Documents the findings of a comprehensive Jest coverage audit, revealing that actual coverage stands at **65.56%** (vs. the stated 74% and target of 80%+), identifies key Jest/TS-compile blockers, and outlines remediation paths.

---

## 2. Payment Provider Integration Scoping (PayGate & Ooze)

To move away from the mock/stub payment flows, MobiRides is transitioning to a **Production Custodial Model**. Under this model:
- Renter payments are collected in full into a MobiRides custodial account.
- The platform retains a **15% commission** upon booking confirmation.
- The host is credited **85%** of the rental earnings as a ledger entry (`pending_balance` inside `host_wallets`).
- Earnings are released to the host's `available_balance` **24 hours after rental completion** (triggered by `handover_in` completion).
- Hosts must maintain a **P50 minimum available balance** to remain active and accept new bookings.

### A. PayGate (PayWeb3) Credit Card Integration
PayGate PayWeb3 provides standard card payments (Visa, Mastercard, AMEX) via secure redirection.

* **Endpoints:**
  - Payment Initiation: `POST https://secure.paygate.co.za/payweb3/initiate.trans`
  - Query Status: `POST https://secure.paygate.co.za/payweb3/query.trans`
  - Webhook Notification: `POST https://<supabase-domain>/functions/v1/payment-webhook`
* **Initiation Parameters & Checksum:**
  Requires generating an MD5 checksum of concatenated values:
  `MD5(PAYGATE_ID + REFERENCE + AMOUNT + CURRENCY + RETURN_URL + TRANSACTION_DATE + LOCALE + COUNTRY + EMAIL + NOTIFY_URL + USER1 + PAYGATE_ENCRYPTION_KEY)`
* **Sandbox Testing Protocol:**
  - Success Card: `4000000000000002` (Visa, expiry in future, any CVV)
  - Amount Triggers: P1.00 = Approved; P2.00 = Declined; P4.00 = Cancelled.

### B. Ooze Botswana (Mobile Money) Integration
Ooze acts as a mobile money gateway for local telecommunications.
* **Supported Wallets:** OrangeMoney (Phase 1), with MyZaka & Smega (Phase 2 - Q2 2026).
* **Initiation:** Invokes the Ooze API with `mobile_number` and `amount` to send a USSD push (STK push) to the user's mobile device.
* **Callback Handling:** Secure webhook callback verified via custom signature `X-Ooze-Signature` using `OOZE_WEBHOOK_SECRET`.

### C. Database Schema & Migration Path
The following tables are configured in the `supabase/migrations` folder:

1. **`payment_transactions`**: Logs all card and mobile money payment attempts.
   - Columns: `id` (UUID), `booking_id` (UUID), `user_id` (UUID), `amount` (numeric), `payment_method` (varchar: 'card'|'orange_money'), `payment_provider` (varchar: 'paygate'|'ooze'), `provider_transaction_id` (varchar), `status` (varchar: 'initiated'|'pending'|'completed'|'failed'), `platform_commission` (numeric), `host_earnings` (numeric), `created_at` (timestamptz), etc.
2. **`withdrawal_requests`**: Tracks withdrawals from host wallets (minimum P200).
   - Columns: `id` (UUID), `host_id` (UUID), `wallet_id` (UUID), `amount` (numeric), `payout_method` (varchar: 'bank_transfer'|'orange_money'), `payout_details` (JSONB), `status` (varchar: 'pending'|'completed'|'failed'), `processed_at` (timestamptz).
3. **`payout_details`**: Encrypted bank details and mobile wallet numbers.
   - Columns: `id` (UUID), `host_id` (UUID), `payout_method` (varchar), `details_encrypted` (JSONB), `display_name` (varchar), `is_default` (boolean).
4. **`payment_config`**: KV store for administrative parameters (fees, thresholds, limits).

#### PostgreSQL Stored Procedures:
* **`credit_pending_earnings(p_booking_id, p_host_earnings, p_platform_commission)`**: Atomically adds `p_host_earnings` to the host's `pending_balance` and records a ledger transaction of type `rental_earnings_pending`.
* **`release_pending_earnings(p_booking_id)`**: Runs on rental completion (or 24h auto-expiry). Subtracts earnings from `pending_balance`, adds to `balance` (available), and logs transaction `earnings_released`.
* **`process_withdrawal_request(p_host_id, p_amount, p_payout_method, p_payout_details)`**: Checks available balance, locks wallet row `FOR UPDATE`, deducts `p_amount` immediately, and creates a `pending` withdrawal request.

### D. Edge Functions Architecture
- **`initiate-payment`**: Securely generates parameters, checksum, inserts a `payment_transactions` record, and returns the gateway redirect URL (for PayGate) or initiates USSD push (for Ooze).
- **`payment-webhook`**: Consumes callbacks, verifies signatures/checksums, updates transactional state, triggers splits, and transitions the booking status from `awaiting_payment` to `confirmed`.
- **`process-withdrawal`**: Auth-gated hook to execute payout transfers and mark requests as completed or failed (with automated rollback).

### E. Legacy Mock Deprecations
The following legacy modules will be removed or refactored:
1. **`commissionDeduction.ts`** -> 🚫 **Deprecate**: Completely remove the legacy model where commissions were upfront-deducted from host pre-funded accounts.
2. **`walletValidation.ts`** -> 🔧 **Refactor**: Remove the upfront commission value check. Only validate that `available_balance >= 50` (P50 buffer threshold).
3. **`mockBookingPaymentService.ts`** -> 🔧 **Dual-Mode Adapter**: Toggle backend handler via `PAYMENT_MODE=mock|production` to support seamless staging testing.

**Assignment:** Formally assigned to **Modisa Maphanyane** under the new **Category 8 (Payment Provider Integrations)** of Sprint 15 execution.

---

## 3. Security at 100% (MOB-700 Series Remediation)

To satisfy the "Security: MOB-700 at 100%" exit criterion, we have conducted an audit of the 9 security remediation findings. While several items were marked as complete in documentation, we have pulled **all remaining and unverified MOB-700 tickets** into Sprint 15 to ensure a 100% clean production security scan:

| Ticket | Scope | Priority | Assigned | Status |
|--------|-------|----------|----------|--------|
| **MOB-46** / **MOB-708** | Reduce exposure of sensitive PII in profiles | 🔴 P0 | Modisa | 🟡 TO DO |
| **S14-001** | Implement column-level RLS migrations for profile fields | 🔴 P0 | Modisa | 🟡 TO DO |
| **MOB-702** | Auth-gate the `add-admin` Edge Function via admin role lookup | 🔴 P0 | Modisa | 🟡 TO DO |
| **MOB-703** | Drop blanket read policy on `notifications`; restrict to owners/admins | 🔴 P0 | Modisa | 🟡 TO DO |
| **MOB-704** | Enable RLS on `insurance_commission_rates` and `premium_remittance_batches` | 🟡 P1 | Modisa | 🟡 TO DO |
| **MOB-705** | Enforce strict Zod schemas on administrative Edge Functions | 🟡 P1 | Modisa | 🟡 TO DO |
| **MOB-706** | Hardcoat `SET search_path = public` on 11 database RPC functions | 🟢 P2 | Modisa | 🟡 TO DO |
| **MOB-707** | Use `pgcrypto` to hash and verify plain passwords in `pending_confirmations` | 🔴 P0 | Modisa | 🟡 TO DO |
| **MOB-708b** | Implement `blog_posts_public` view and rewrite blog queries to hide author emails | 🟢 P2 | Modisa | 🟡 TO DO |

This ensures that security hardening is built directly into Sprint 15's core deliverables, closing the gap before the commercial launch.

---

## 4. Test Coverage Audit Findings & Remediation

A codebase-wide Jest coverage audit was successfully executed on **May 27, 2026**. 

### A. The Discrepancy
- **Stated Status Reports Coverage:** **74%+**
- **Actual Audited Coverage:** **65.56%** (Statement and Line coverage)
- **Target Exit Criteria:** **80%+**

**Finding:** The actual test coverage is **14.44% below target** and **8.44% below** what was reported in status reports. Stale status report numbers were propagated without automated verification pipeline checks.

### B. Core Blockers Identified in the Audit
The test execution returned **9 failed/crashed test suites out of 101 total suites**, which artificially deflated and blocked accurate coverage aggregation:
1. **Jest Worker Out-of-Memory (OOM):** `availabilityServiceCoverage`, `handoverOperations`, and `navigationLib` failed because Jest workers ran out of memory during massive TypeScript compilation sweeps.
2. **ESNext Module / SyntaxError:** `UnifiedUserTable.test.tsx` crashed with `SyntaxError: Cannot use 'import.meta' outside a module` on line 751 of `src/utils/sessionMonitor.ts`. Standard Jest/ts-jest fails to parse modern `import.meta.env` statements used for Vite configurations.
3. **Timeout Gaps:** `notificationDynamicHooksCoverage.test.tsx` threw async wait timeouts (exceeded 5000ms limit) and type verification mismatches on Supabase mocks.

### C. Test Coverage Remediation Action Plan (Assigned to Tapologo)
To bridge the gap to 80%+, the following items are scheduled for Sprint 15 QA remediation:
- **Remediate `import.meta` Parse Crashes:** Add standard Babel/Jest environment transformers or create a mock replacement configuration (`jest.config.js`) to intercept `import.meta` references and prevent parse errors in utility files.
- **Jest Memory Optimization:** Configure Jest to run in single-process mode in CI/CD, or optimize TS compilation settings via `tsconfig.test.json` to prevent TS-compiler memory exhaustion.
- **Mocks Re-Seeding:** Resolve the async wait times in mock hook hooks by wrapping them in proper act-wrapper scopes and utilizing standard manual wait increments.
- **Incremental Test Integration:** Push targeted tests for `DynamicPricingService`, `Resend-Service`, and new `paymentService` extensions to hit the 80% benchmark during the upcoming stabilization cycle.

---

## 5. Exit Criteria Verdict

- **Payment Provider Integration:** 🟡 **Awaiting Implementation** (Formally scoped, assigned to Modisa, and scheduled for Sprint 15).
- **Security (MOB-700 Series):** 🟡 **Awaiting Implementation** (Remaining and unverified tickets explicitly pulled into Sprint 15 backlog under Modisa).
- **Test Coverage (Target 80%+):** 🔴 **Failed Target** (Audited at 65.56%; remediation plan assigned to Tapologo to address crashes and raise coverage in Sprint 16).

*Report signed off by:*  
**Modisa Maphanyane (CEO)**  
**Antigravity AI (System Auditor)**
