# MobiRides Production Readiness - Complete Jira Implementation Plan

**Document Date:** February 2, 2026  
**Target Deadline:** February 28, 2026 (27 days)  
**Goal:** Achieve 90% production readiness across all modules

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Epic Status](#current-epic-status-from-week-4-report)
3. [Sprint Structure](#sprint-structure-feb-3---feb-28-2026)
4. [Epic Breakdown by Priority](#epic-breakdown-by-priority)
   - [Epic 7: Wallet & Payments (Critical)](#epic-7-wallet--payments-critical-path)
   - [Epic 8: Notification System](#epic-8-notification-system)
   - [Epic 4: Handover Management](#epic-4-handover-management)
   - [Epic 5: Messaging System](#epic-5-messaging-system)
   - [Epic 9: Admin Dashboard](#epic-9-admin-dashboard)
   - [Epic 6: Review System](#epic-6-review-system)
   - [Epic 10: Verification System](#epic-10-verification-system)
   - [Epic 11: Insurance System](#epic-11-insurance-system)
   - [Epic 12: Map & Location](#epic-12-map--location)
   - [Epic 1: User Auth & Onboarding](#epic-1-user-auth--onboarding)
   - [Epic 2: Car Listing & Discovery](#epic-2-car-listing--discovery)
   - [Epic 13: Help & Support](#epic-13-help--support)
5. [Technical Debt Items](#technical-debt-items-to-address)
6. [Testing Phase](#testing-phase-feb-24-28)
7. [Summary by Sprint](#summary-by-sprint)
8. [Risk Mitigation](#risk-mitigation)
9. [Success Criteria](#success-criteria)
10. [Document References](#document-references)

---

## Executive Summary

This plan consolidates all remaining development work from 15+ documentation sources to achieve 90% production readiness by February 28, 2026. Based on the Week 4 January 2026 Status Report, current production readiness is at **72%** with an 18% gap to close.

**Key Sources Reviewed:**
- `docs/Product Status/WEEK_4_JANUARY_2026_STATUS_REPORT.md`
- `docs/Product Status/WEEK_1_JANUARY_2026_STATUS_REPORT.md`
- `ROADMAP.md`, `TECHNICAL_DEBT.md`, `TODO.md`
- `docs/PAYMENT_INTEGRATION_IMPLEMENTATION.md`
- `docs/JIRA_TASKS_V2.4.0.md`
- `docs/testing/PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md`
- `.trae/documents/` folder (25+ planning documents)
- `docs/INSURANCE_README.md`
- User Stories PRD Inputs

**Note:** Security and optimization issues will be addressed last as per stakeholder direction.

---

## Current Epic Status (From Week 4 Report)

| Epic | Name | Current % | Target 90% | Gap | Priority |
|------|------|-----------|------------|-----|----------|
| 1 | User Auth & Onboarding | 88% | 90% | 2% | Low |
| 2 | Car Listing & Discovery | 82% | 90% | 8% | Medium |
| 3 | Booking System | 78% | 90% | 12% | High |
| 4 | Handover Management | 75% | 90% | 15% | High |
| 5 | Messaging System | 72% | 90% | 18% | High |
| 6 | Review System | 65% | 90% | 25% | Medium |
| 7 | **Wallet & Payments** | **45%** | **90%** | **45%** | **CRITICAL** |
| 8 | Notification System | 75% | 90% | 15% | High |
| 9 | Admin Dashboard | 58% | 90% | 32% | Medium |
| 10 | Verification System | 70% | 90% | 20% | Medium |
| 11 | Insurance System | 52%* | 90% | 38%* | Medium |
| 12 | Map & Location | 65% | 90% | 25% | Medium |
| 13 | Help & Support | 58% | 90% | 32% | Low |

*Insurance backend is 100% complete; 52% reflects UI/UX integration and claim workflow testing.

---

## Sprint Structure (Feb 3 - Feb 28, 2026)

| Sprint | Dates | Focus | Story Points |
|--------|-------|-------|--------------|
| Sprint 1 | Feb 3-9 | Payment Infrastructure | 55 SP |
| Sprint 2 | Feb 10-16 | Payment UI + Notifications | 50 SP |
| Sprint 3 | Feb 17-23 | Handover, Messaging, Admin | 45 SP |
| Sprint 4 | Feb 24-28 | Polish, Testing, Launch Prep | 35 SP |

---

## EPIC BREAKDOWN BY PRIORITY

---

### EPIC 7: WALLET & PAYMENTS (CRITICAL PATH)

**Current:** 45% | **Target:** 90% | **Gap:** 45% | **Deadline:** Feb 16

This is the #1 production blocker. Payment integration plan exists in `docs/PAYMENT_INTEGRATION_IMPLEMENTATION.md`.

---

#### MPAY-001: Database Schema for Payments
**Type:** Task | **Priority:** P0 | **Points:** 8 | **Sprint:** 1

**Description:** Create payment infrastructure database schema.

**Deliverables:**
- [ ] Create `payment_transactions` table with audit trail
- [ ] Create `withdrawal_requests` table
- [ ] Create `payout_details` table for host bank/mobile info
- [ ] Create `payment_config` table for admin settings
- [ ] Add `payment_status`, `payment_deadline` to bookings
- [ ] Add `pending_balance` to `host_wallets`
- [ ] RLS policies for all new tables

**Files:**
- `supabase/migrations/[ts]_create_payment_schema.sql`

---

#### MPAY-002: PayGate Secrets Configuration
**Type:** Task | **Priority:** P0 | **Points:** 2 | **Sprint:** 1

**Description:** Configure PayGate credentials as Edge Function secrets.

**Deliverables:**
- [ ] Configure PAYGATE_ID secret
- [ ] Configure PAYGATE_ENCRYPTION_KEY secret
- [ ] Configure PAYGATE_MODE (sandbox/production)
- [ ] Document secret management process

---

#### MPAY-010: Payment Initiation Edge Function
**Type:** Story | **Priority:** P0 | **Points:** 8 | **Sprint:** 1

**Description:** Create edge function to initiate PayGate PayWeb3 transactions.

**Deliverables:**
- [ ] Validate booking exists and is awaiting_payment
- [ ] Generate MD5 checksum per PayGate specs
- [ ] Return PAY_REQUEST_ID and redirect URL
- [ ] Create payment_transaction with 'initiated' status
- [ ] Handle errors gracefully

**Files:**
- `supabase/functions/initiate-payment/index.ts`

---

#### MPAY-011: Payment Webhook Handler
**Type:** Story | **Priority:** P0 | **Points:** 8 | **Sprint:** 1

**Description:** Handle PayGate NOTIFY_URL callbacks.

**Deliverables:**
- [ ] Validate checksum to prevent fraud
- [ ] Update payment_transaction status
- [ ] If successful: update booking, credit host wallet (pending), send notifications
- [ ] If failed: notify renter, allow retry
- [ ] Idempotent handling for duplicate notifications

**Files:**
- `supabase/functions/payment-webhook/index.ts`

---

#### MPAY-020: Split Payment Processing
**Type:** Story | **Priority:** P0 | **Points:** 5 | **Sprint:** 1

**Description:** Auto-split funds between platform commission and host earnings.

**Deliverables:**
- [ ] Calculate 15% commission using commission_rates table
- [ ] Credit host wallet with pending_balance
- [ ] Record wallet_transaction (type: rental_earnings_pending)
- [ ] Update booking with commission_amount

---

#### MPAY-021: Earnings Release on Rental Completion
**Type:** Story | **Priority:** P0 | **Points:** 5 | **Sprint:** 1

**Description:** Move earnings from pending to available when rental completes.

**Deliverables:**
- [ ] Trigger on handover_in completion
- [ ] Or auto-trigger 24h after rental end_date
- [ ] Move from pending_balance to balance
- [ ] Create wallet_transaction (type: earnings_released)
- [ ] Notify host of available funds

**Files:**
- `supabase/functions/release-earnings/index.ts`

---

#### MPAY-030: Payment Selection Page
**Type:** Story | **Priority:** P0 | **Points:** 5 | **Sprint:** 2

**Description:** Create payment method selection UI for renters.

**Deliverables:**
- [ ] Show available payment methods (card, OrangeMoney)
- [ ] Display booking summary and total
- [ ] "Pay Now" initiates payment flow
- [ ] Loading states during payment initiation

**Files:**
- `src/pages/BookingPayment.tsx`
- `src/components/payment/PaymentMethodSelector.tsx`

---

#### MPAY-031: Booking Status Flow Update
**Type:** Story | **Priority:** P0 | **Points:** 5 | **Sprint:** 2

**Description:** Update booking status handling for payment states.

**Deliverables:**
- [ ] Add awaiting_payment status
- [ ] Show payment deadline countdown
- [ ] Allow payment retry on failure
- [ ] Auto-expire bookings past deadline

**Files:**
- Update `src/components/booking/` components
- Create cron job for expiration

---

#### MPAY-022: Wallet Balance Display Enhancement
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 2

**Description:** Show available vs pending balances in wallet UI.

**Deliverables:**
- [ ] Display available balance prominently
- [ ] Show pending balance separately
- [ ] Show total (available + pending)
- [ ] Tooltip explaining pending release

**Files:**
- `src/components/dashboard/WalletBalanceCard.tsx`
- `src/components/dashboard/WalletBalanceIndicator.tsx`

---

#### MPAY-050: Host Payout Details Setup
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 2

**Description:** Allow hosts to add payout details.

**Deliverables:**
- [ ] Form for bank account details
- [ ] Form for mobile money number
- [ ] Validate mobile numbers
- [ ] Allow multiple methods with default

**Files:**
- `src/components/wallet/PayoutDetailsForm.tsx`

---

#### MPAY-051: Withdrawal Request UI
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 2

**Description:** Create withdrawal interface for hosts.

**Deliverables:**
- [ ] Show available balance
- [ ] Enforce P200 minimum withdrawal
- [ ] Select payout method
- [ ] Confirm and track status

**Files:**
- `src/components/wallet/WithdrawalRequestForm.tsx`

---

#### MPAY-052: Automated Payout Edge Function
**Type:** Story | **Priority:** P1 | **Points:** 8 | **Sprint:** 2

**Description:** Process withdrawal requests automatically.

**Deliverables:**
- [ ] Validate withdrawal request
- [ ] Deduct from available balance
- [ ] Initiate payout via provider
- [ ] Handle failures with retry logic

**Files:**
- `supabase/functions/process-withdrawal/index.ts`

---

### EPIC 8: NOTIFICATION SYSTEM

**Current:** 75% | **Target:** 90% | **Gap:** 15%

---

#### NOTIF-001: Push Notification Implementation
**Type:** Story | **Priority:** P1 | **Points:** 8 | **Sprint:** 2

**Description:** Implement actual push notification delivery.

**Deliverables:**
- [ ] Set up Firebase Cloud Messaging
- [ ] Implement service worker registration
- [ ] Create push subscription flow
- [ ] Send push for critical events (booking, handover, payment)

**Files:**
- `public/push-sw.js` (update)
- `src/utils/pushNotifications.ts` (fix hardcoded VAPID)
- `supabase/functions/send-push/index.ts`

---

#### NOTIF-002: Email Template Completion
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 2

**Description:** Complete email notification templates.

**Deliverables:**
- [ ] Booking confirmation template
- [ ] Payment receipt template
- [ ] Handover reminder template
- [ ] Verification status template
- [ ] Welcome email template

**Files:**
- `src/templates/email/` (new folder)
- Update email edge function

---

#### NOTIF-003: SMS Service Integration
**Type:** Story | **Priority:** P2 | **Points:** 5 | **Sprint:** 3

**Description:** Integrate local SMS provider for Botswana.

**Deliverables:**
- [ ] Research/select Botswana SMS provider
- [ ] Implement SMS sending edge function
- [ ] Send OTP for phone verification
- [ ] Send critical booking alerts

---

### EPIC 4: HANDOVER MANAGEMENT

**Current:** 75% | **Target:** 90% | **Gap:** 15%

Reference: `.trae/documents/handover-module-analysis.md`

---

#### HAND-001: GPS Fallback Mechanism
**Type:** Story | **Priority:** P0 | **Points:** 5 | **Sprint:** 3

**Description:** Allow handover to proceed when GPS permission denied.

**Deliverables:**
- [ ] Add manual location entry option
- [ ] Implement location verification via photos
- [ ] Create admin override for location validation
- [ ] Improve permission request UX

**Files:**
- `src/components/handover/GPSVerificationStep.tsx`
- `src/components/handover/ManualLocationEntry.tsx` (new)

---

#### HAND-002: API Resilience for Mapbox
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 3

**Description:** Add fallback for Mapbox API failures.

**Deliverables:**
- [ ] Implement retry with exponential backoff
- [ ] Add circuit breaker pattern
- [ ] Fallback to static map on failure
- [ ] Cache map tiles for offline

---

#### HAND-003: Handover Offline Support
**Type:** Story | **Priority:** P2 | **Points:** 8 | **Sprint:** 3

**Description:** Enable handover in poor connectivity areas.

**Deliverables:**
- [ ] Local data persistence with IndexedDB
- [ ] Queue handover steps for sync
- [ ] Offline photo storage
- [ ] Sync when connection restored

---

### EPIC 5: MESSAGING SYSTEM

**Current:** 72% | **Target:** 90% | **Gap:** 18%

---

#### MSG-001: Message Search Enhancement
**Type:** Story | **Priority:** P2 | **Points:** 3 | **Sprint:** 3

**Description:** Improve message search functionality.

**Deliverables:**
- [ ] Full-text search across conversations
- [ ] Search by participant name
- [ ] Highlight search results
- [ ] Recent searches

---

#### MSG-002: Typing Indicators
**Type:** Story | **Priority:** P3 | **Points:** 3 | **Sprint:** 4

**Description:** Show when other party is typing.

**Deliverables:**
- [ ] Broadcast typing events via Supabase
- [ ] Display typing indicator in chat
- [ ] Debounce typing events

---

### EPIC 9: ADMIN DASHBOARD

**Current:** 58% | **Target:** 90% | **Gap:** 32%

---

#### ADMIN-001: Transaction Dashboard
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 3

**Description:** Admin interface for payment transactions.

**Deliverables:**
- [ ] List all payment_transactions
- [ ] Filter by status, date, method
- [ ] View transaction details
- [ ] Manual status update (with audit)

**Files:**
- `src/components/admin/AdminTransactionsDashboard.tsx` (new)

---

#### ADMIN-002: Withdrawal Management
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 3

**Description:** Admin interface for host withdrawals.

**Deliverables:**
- [ ] List all withdrawal requests
- [ ] Filter by status
- [ ] Manual approval option
- [ ] Retry failed withdrawals

---

#### ADMIN-003: SuperAdmin Analytics Completion
**Type:** Story | **Priority:** P2 | **Points:** 5 | **Sprint:** 3

**Description:** Complete analytics dashboard.

Reference: `docs/JIRA_TASKS_V2.4.0.md` (MOBI-702)

**Deliverables:**
- [ ] Implement Recharts charts
- [ ] Add CSV export
- [ ] Real-time data updates
- [ ] Platform health metrics

**Files:**
- `src/pages/SuperAdminAnalytics.tsx`
- `src/components/admin/superadmin/AnalyticsCharts.tsx`

---

### EPIC 6: REVIEW SYSTEM

**Current:** 65% → **85%** (after REV-003 to REV-007 completion) | **Target:** 95% | **Gap:** 10%

**Note:** The following tasks (REV-003 to REV-007) were previously flagged in `.trae/documents/MOBIRIDES_FEEDBACK_TRIAGE_BOARD.md` (October 2025) and have now been completed.

**Detailed Category Ratings:** Tasks REV-008 to REV-014 implement the detailed category rating system per Epic 8 PRD requirements. The database `category_ratings` JSONB column and `calculate_category_ratings()` function already exist. Public car views show aggregate ratings only; individual hosts/renters can view their detailed category ratings from their profile.

---

#### REV-003: Admin Reviews Management Page ✅ COMPLETED
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 3 | **Status:** DONE

**Description:** Create admin interface for viewing and moderating all reviews.

**Completed Deliverables:**
- [x] Created `src/pages/admin/AdminReviews.tsx`
- [x] Created `src/components/admin/ReviewManagementTable.tsx`
- [x] Created `src/components/admin/ReviewDetailsDialog.tsx`
- [x] Created `src/components/admin/ReviewStatsCards.tsx`
- [x] Filter by type, status, rating, date
- [x] Moderation actions: approve, flag, hide, delete
- [x] Review analytics (total, average, pending, flagged, review rate)

---

#### REV-004: Duplicate Review Prevention ✅ COMPLETED
**Type:** Story | **Priority:** P1 | **Points:** 2 | **Sprint:** 3 | **Status:** DONE

**Description:** Prevent users from submitting duplicate reviews.

**Completed Deliverables:**
- [x] Updated `src/pages/RentalReview.tsx` to check for existing review
- [x] Show "You've already reviewed this rental" with existing review display
- [x] Redirect to view-only mode for already-reviewed bookings

---

#### REV-005: Review Prompt Improvements ✅ COMPLETED
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 3 | **Status:** DONE

**Description:** Add review prompts to completed bookings.

**Completed Deliverables:**
- [x] Updated `src/components/renter-bookings/RenterBookingCard.tsx`
- [x] Added "Review" button for completed bookings without reviews
- [x] Visual indicator for review-pending status

---

#### REV-006: Clean Up CarReviews.tsx ✅ COMPLETED
**Type:** Task | **Priority:** P2 | **Points:** 1 | **Sprint:** 3 | **Status:** DONE

**Description:** Remove debugging artifacts from CarReviews component.

**Completed Deliverables:**
- [x] Removed excessive console.log statements
- [x] Cleaned up debugging code

---

#### REV-007: Admin Sidebar Reviews Link ✅ COMPLETED
**Type:** Task | **Priority:** P1 | **Points:** 1 | **Sprint:** 3 | **Status:** DONE

**Description:** Add Reviews to admin sidebar and routing.

**Completed Deliverables:**
- [x] Updated `src/components/admin/AdminSidebar.tsx` with Reviews menu item
- [x] Added route `/admin/reviews` in `src/App.tsx`

---

#### REV-008: Category Rating Input Component
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 3

**Description:** Create star rating inputs for individual categories (cleanliness, punctuality, etc.).

**Deliverables:**
- [ ] Create `src/components/reviews/CategoryRatingInput.tsx`
- [ ] Create `src/components/reviews/RatingCategories.ts` (constants)
- [ ] Individual star rating for each category
- [ ] Visual grouping with clear labels
- [ ] Progressive disclosure after overall rating

---

#### REV-009: Update RentalReview with Category Inputs
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 3

**Description:** Integrate category ratings into the review submission form.

**Deliverables:**
- [ ] Add `categoryRatings` state to `src/pages/RentalReview.tsx`
- [ ] Role-based categories: Renter rates (cleanliness, car_condition, responsiveness, rental_experience)
- [ ] Role-based categories: Host rates (punctuality, communication, car_care, adherence_to_rules)
- [ ] Update insert to include `category_ratings` JSONB
- [ ] Overall rating required, category ratings encouraged

---

#### REV-010: Category Rating Display Component
**Type:** Story | **Priority:** P1 | **Points:** 2 | **Sprint:** 3

**Description:** Create component to display aggregated category ratings.

**Deliverables:**
- [ ] Create `src/components/reviews/CategoryRatingDisplay.tsx`
- [ ] Show breakdown with star/bar visualization
- [ ] Call `calculate_category_ratings(car_id)` RPC function
- [ ] Handle empty category data gracefully

---

#### REV-011: Update CarReviews with Category Breakdown
**Type:** Story | **Priority:** P1 | **Points:** 2 | **Sprint:** 3

**Description:** Display category rating breakdown on car detail pages (aggregate only for public view).

**Deliverables:**
- [ ] Update `src/components/car-details/CarReviews.tsx`
- [ ] Show aggregated category ratings (not individual reviews)
- [ ] Use CategoryRatingDisplay component
- [ ] Only show categories with sufficient data (3+ reviews)

---

#### REV-012: Profile Rating Details Page
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 3

**Description:** Allow hosts and renters to view their detailed ratings from their profile.

**Deliverables:**
- [ ] Create `src/pages/MyRatings.tsx` (or add section to profile)
- [ ] Show all category ratings user has received
- [ ] Filter by: review type (as host / as renter), date range
- [ ] Clickable from profile summary rating
- [ ] Show trends over time
- [ ] Comparison to platform average (optional)

---

#### REV-013: Backfill Existing Reviews
**Type:** Task | **Priority:** P2 | **Points:** 2 | **Sprint:** 3

**Description:** Backfill category_ratings for existing reviews with overall rating value.

**Deliverables:**
- [ ] Create migration to populate empty `category_ratings`
- [ ] Set all categories to the existing `rating` value
- [ ] Only affect reviews with empty/null `category_ratings`
- [ ] Document backfill in migration comments

**SQL Migration:**
```sql
UPDATE reviews 
SET category_ratings = jsonb_build_object(
  'cleanliness', rating,
  'punctuality', rating,
  'responsiveness', rating,
  'car_condition', rating,
  'rental_experience', rating
)
WHERE category_ratings IS NULL OR category_ratings = '{}'::jsonb;
```

---

#### REV-014: Admin Review Details - Category Ratings
**Type:** Task | **Priority:** P2 | **Points:** 1 | **Sprint:** 3

**Description:** Display category ratings in admin review detail dialog.

**Deliverables:**
- [ ] Update `src/components/admin/ReviewDetailsDialog.tsx`
- [ ] Show category ratings if populated
- [ ] Flag reviews with significantly deviant category ratings (potential gaming)

---

#### REV-001: Review Analytics (Remaining)
**Type:** Story | **Priority:** P2 | **Points:** 3 | **Sprint:** 3

**Description:** Add review analytics for hosts.

**Deliverables:**
- [ ] Rating trends over time
- [ ] Category breakdown charts
- [ ] Comparison to platform average

---

#### REV-002: Review Moderation Enhancement (Remaining)
**Type:** Story | **Priority:** P2 | **Points:** 3 | **Sprint:** 3

**Description:** Improve admin review moderation with additional features.

**Deliverables:**
- [ ] Moderation history/audit log
- [ ] Bulk moderation actions
- [ ] Review response on behalf of hosts

---

### EPIC 10: VERIFICATION SYSTEM

**Current:** 70% | **Target:** 90% | **Gap:** 20%

---

#### VER-001: Document Expiry Checking
**Type:** Story | **Priority:** P2 | **Points:** 3 | **Sprint:** 4

**Description:** Auto-check for expired documents.

**Deliverables:**
- [ ] Cron job to check expiry dates
- [ ] Notify users of upcoming expiry
- [ ] Block bookings with expired docs

---

#### VER-002: Complete Phone Verification
**Type:** Story | **Priority:** P2 | **Points:** 3 | **Sprint:** 4

**Description:** SMS OTP for phone verification.

**Deliverables:**
- [ ] Integrate with SMS service (NOTIF-003)
- [ ] Send verification code
- [ ] Validate code entry
- [ ] Retry/resend logic

---

### EPIC 11: INSURANCE SYSTEM

**Current:** 52% (UI) | **Target:** 90% | **Gap:** 38%

Backend is 100% complete per `docs/INSURANCE_README.md`.

---

#### INS-001: Insurance UI Integration Testing
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 2

**Description:** End-to-end testing of insurance flow.

**Deliverables:**
- [ ] Test package selection in BookingDialog
- [ ] Verify policy PDF generation
- [ ] Test claim submission flow
- [ ] Verify wallet payout integration

---

#### INS-002: Claims Workflow Enhancement
**Type:** Story | **Priority:** P2 | **Points:** 5 | **Sprint:** 3

**Description:** Improve claims user experience.

**Deliverables:**
- [ ] Better claim status visibility
- [ ] Claims timeline view
- [ ] Evidence upload progress
- [ ] Admin response notifications

---

### EPIC 12: MAP & LOCATION

**Current:** 65% | **Target:** 90% | **Gap:** 25%

---

#### MAP-001: Location Privacy Controls
**Type:** Story | **Priority:** P2 | **Points:** 3 | **Sprint:** 4

**Description:** Add location privacy settings.

**Deliverables:**
- [ ] Approximate vs exact location toggle
- [ ] Hide exact address until booking confirmed
- [ ] Privacy settings in profile

---

#### MAP-002: Offline Maps
**Type:** Story | **Priority:** P3 | **Points:** 5 | **Sprint:** 4

**Description:** Enable offline map access.

**Deliverables:**
- [ ] Cache frequently used map areas
- [ ] Show cached maps when offline
- [ ] Indicate offline status

---

### EPIC 1: USER AUTH & ONBOARDING

**Current:** 88% | **Target:** 90% | **Gap:** 2%

---

#### AUTH-001: Password Strength Validation
**Type:** Story | **Priority:** P2 | **Points:** 2 | **Sprint:** 4

**Description:** Implement password strength indicator.

**Deliverables:**
- [ ] Visual strength meter
- [ ] Requirements checklist
- [ ] Block weak passwords

---

#### AUTH-002: Account Deletion Flow
**Type:** Story | **Priority:** P2 | **Points:** 3 | **Sprint:** 4

**Description:** Complete account deletion UI.

Reference: `.trae/documents/user-deletion-implementation-plan.md`

**Deliverables:**
- [ ] Deletion confirmation modal
- [ ] Data export before deletion
- [ ] 30-day recovery period
- [ ] Full data purge after grace period

---

### EPIC 2: CAR LISTING & DISCOVERY

**Current:** 82% | **Target:** 90% | **Gap:** 8%

---

#### CAR-001: Image Optimization
**Type:** Story | **Priority:** P2 | **Points:** 5 | **Sprint:** 4

**Description:** Optimize car images for performance.

**Deliverables:**
- [ ] Automatic compression on upload
- [ ] Generate multiple sizes (thumbnail, medium, full)
- [ ] WebP format conversion
- [ ] Lazy loading implementation

---

### EPIC 13: HELP & SUPPORT

**Current:** 58% | **Target:** 90% | **Gap:** 32%

---

#### HELP-001: FAQ System
**Type:** Story | **Priority:** P2 | **Points:** 5 | **Sprint:** 4

**Description:** Create searchable FAQ system.

**Deliverables:**
- [ ] FAQ data structure
- [ ] Search functionality
- [ ] Category organization
- [ ] Admin FAQ management

---

#### HELP-002: In-App Support Chat
**Type:** Story | **Priority:** P3 | **Points:** 8 | **Sprint:** 4

**Description:** Direct support messaging.

**Deliverables:**
- [ ] Support conversation type
- [ ] Route to support team
- [ ] Ticket tracking

---

## TECHNICAL DEBT ITEMS (To Address)

From `TECHNICAL_DEBT.md`, these are resolved via the above epics:

| ID | Item | Resolved By |
|----|------|-------------|
| TD-001 | Mock Payment System | MPAY-010/011 |
| TD-004 | Broken Push Notifications | NOTIF-001 |
| TD-007 | Earnings vs Balance Confusion | MPAY-022 |
| TD-013 | No Email Integration | NOTIF-002 |
| TD-014 | SMS Service Missing | NOTIF-003 |

**Deferred to Post-Launch (Security/Optimization):**
- TD-005: Transaction Atomicity
- TD-009: File Validation
- Function search_path warnings (9 remaining)
- RLS policy review

---

## TESTING PHASE (Feb 24-28)

Per `docs/testing/PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md`:

---

#### TEST-001: Phase 3 Beta Testing Completion
**Type:** Task | **Priority:** P0 | **Points:** 10 | **Sprint:** 4

**Description:** Complete beta group testing with 50+ users.

**Deliverables:**
- [ ] All critical bugs resolved
- [ ] Performance validated at scale
- [ ] User feedback incorporated
- [ ] Sign-off from beta testers

---

#### TEST-002: Payment Flow E2E Testing
**Type:** Task | **Priority:** P0 | **Points:** 5 | **Sprint:** 4

**Description:** End-to-end payment flow testing.

**Deliverables:**
- [ ] Card payment success/failure
- [ ] Mobile money payment success/failure
- [ ] Webhook handling verified
- [ ] Wallet credits verified
- [ ] Withdrawal payout verified

---

#### TEST-003: Route & Navigation Audit
**Type:** Task | **Priority:** P1 | **Points:** 3 | **Sprint:** 4

**Description:** Verify all routes accessible.

**Deliverables:**
- [ ] No 404 errors on valid routes
- [ ] All protected routes redirect correctly
- [ ] Back button navigation works
- [ ] Deep linking works

---

## SUMMARY BY SPRINT

### Sprint 1 (Feb 3-9): Payment Infrastructure

| Story ID | Name | Points | Owner |
|----------|------|--------|-------|
| MPAY-001 | Database Schema | 8 | Backend |
| MPAY-002 | Secrets Config | 2 | DevOps |
| MPAY-010 | Payment Initiation | 8 | Backend |
| MPAY-011 | Payment Webhook | 8 | Backend |
| MPAY-020 | Split Processing | 5 | Backend |
| MPAY-021 | Earnings Release | 5 | Backend |
| **Total** | | **36** | |

### Sprint 2 (Feb 10-16): Payment UI + Notifications

| Story ID | Name | Points | Owner |
|----------|------|--------|-------|
| MPAY-030 | Payment Selection Page | 5 | Frontend |
| MPAY-031 | Booking Status Flow | 5 | Full-stack |
| MPAY-022 | Wallet Balance Display | 3 | Frontend |
| MPAY-050 | Payout Details Setup | 5 | Frontend |
| MPAY-051 | Withdrawal Request UI | 5 | Frontend |
| MPAY-052 | Automated Payout | 8 | Backend |
| NOTIF-001 | Push Notifications | 8 | Backend |
| NOTIF-002 | Email Templates | 5 | Full-stack |
| INS-001 | Insurance UI Testing | 5 | QA |
| **Total** | | **49** | |

### Sprint 3 (Feb 17-23): Handover, Messaging, Admin

| Story ID | Name | Points | Owner |
|----------|------|--------|-------|
| HAND-001 | GPS Fallback | 5 | Frontend |
| HAND-002 | API Resilience | 5 | Frontend |
| HAND-003 | Offline Support | 8 | Full-stack |
| NOTIF-003 | SMS Service | 5 | Backend |
| MSG-001 | Search Enhancement | 3 | Frontend |
| ADMIN-001 | Transaction Dashboard | 5 | Frontend |
| ADMIN-002 | Withdrawal Management | 5 | Frontend |
| ADMIN-003 | Analytics Completion | 5 | Frontend |
| REV-001 | Review Analytics | 3 | Frontend |
| REV-002 | Review Moderation | 3 | Frontend |
| INS-002 | Claims Workflow | 5 | Frontend |
| **Total** | | **52** | |

### Sprint 4 (Feb 24-28): Polish, Testing, Launch Prep

| Story ID | Name | Points | Owner |
|----------|------|--------|-------|
| VER-001 | Document Expiry | 3 | Backend |
| VER-002 | Phone Verification | 3 | Full-stack |
| MAP-001 | Location Privacy | 3 | Frontend |
| MAP-002 | Offline Maps | 5 | Frontend |
| AUTH-001 | Password Strength | 2 | Frontend |
| AUTH-002 | Account Deletion | 3 | Full-stack |
| CAR-001 | Image Optimization | 5 | Full-stack |
| MSG-002 | Typing Indicators | 3 | Frontend |
| HELP-001 | FAQ System | 5 | Frontend |
| TEST-001 | Beta Testing Complete | 10 | All |
| TEST-002 | Payment E2E Testing | 5 | QA |
| TEST-003 | Route Audit | 3 | QA |
| **Total** | | **50** | |

---

## RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PayGate integration delays | Medium | Critical | Start sandbox testing Day 1; have manual payment fallback |
| Beta tester dropout | Low | Medium | Over-recruit to 75; incentive program |
| Sprint overrun | Medium | High | Daily standups; scope adjustment authority |
| Payment security issues | Low | Critical | Code review for all payment code; no secrets in client |

---

## SUCCESS CRITERIA

**By February 28, 2026:**
- [ ] All P0 stories completed
- [ ] 90%+ P1 stories completed
- [ ] Payment integration live in sandbox
- [ ] Push notifications functional
- [ ] Zero critical bugs
- [ ] <5 high-priority bugs with workarounds
- [ ] 100% route accessibility
- [ ] Beta tester sign-off

**Post-Launch (March):**
- Move PayGate to production
- Integrate Ooze for mobile money
- Address deferred security items
- Android app submission

---

## DOCUMENT REFERENCES

| Document | Path | Purpose |
|----------|------|---------|
| Payment Integration Plan | `docs/PAYMENT_INTEGRATION_IMPLEMENTATION.md` | Payment architecture |
| Week 4 Status Report | `docs/Product Status/WEEK_4_JANUARY_2026_STATUS_REPORT.md` | Current state baseline |
| Technical Debt Tracker | `TECHNICAL_DEBT.md` | Debt inventory |
| Testing Protocol | `docs/testing/PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md` | QA procedures |
| Handover Analysis | `.trae/documents/handover-module-analysis.md` | Handover gaps |
| Insurance README | `docs/INSURANCE_README.md` | Insurance implementation |
| Jira Tasks v2.4.0 | `docs/JIRA_TASKS_V2.4.0.md` | Prior sprint context |

---

**Document Version:** 1.0  
**Created:** February 2, 2026  
**Author:** Development Team  
**Status:** Ready for Team Review
