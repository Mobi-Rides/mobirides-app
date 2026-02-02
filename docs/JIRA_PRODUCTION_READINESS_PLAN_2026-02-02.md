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
| 14 | **Host Management** | **70%** | **90%** | **20%** | **Medium** |

*Insurance backend is 100% complete; 52% reflects UI/UX integration and claim workflow testing.

**New Items Added (Feb 2, 2026):** Based on Feedback Triage Board review, the following gaps were identified and added: HOST-001 (car deletion), BOOK-001/002 (booking filtering/insurance info), MSG-003/004 (self-messaging/sounds), UI-001/002 (receipts/dashboard).

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

### EPIC 3: BOOKING SYSTEM

**Current:** 78% | **Target:** 90% | **Gap:** 12%

---

#### BOOK-001: Booking Request Filtering & Sorting
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 3

**Description:** Add filtering and sorting options for booking requests (host view).

**Source:** Feedback Triage Board (October 2025) - Hosts cannot filter or sort booking requests.

**Deliverables:**
- [ ] Filter by status (pending, confirmed, completed, cancelled)
- [ ] Filter by date range
- [ ] Sort by date, price, status
- [ ] Search by renter name or car
- [ ] Save filter preferences

**Files:**
- `src/pages/HostBookings.tsx`
- `src/components/host-bookings/BookingFilters.tsx` (new)

---

#### BOOK-002: Insurance Info on Booking Pages
**Type:** Story | **Priority:** P2 | **Points:** 2 | **Sprint:** 3

**Description:** Display insurance package information on booking detail pages.

**Source:** Feedback Triage Board - Insurance info not visible in booking details.

**Deliverables:**
- [ ] Show selected insurance package name and coverage
- [ ] Display policy number after booking confirmed
- [ ] Link to full policy details
- [ ] Show coverage summary

**Files:**
- `src/components/booking/BookingDetails.tsx`
- `src/components/insurance/InsuranceSummaryCard.tsx` (new)

---

### EPIC 4: HANDOVER MANAGEMENT (MAJOR OVERHAUL)

**Current:** 75% | **Target:** 90% | **Gap:** 15%

**References:** 
- `docs/INTERACTIVE_HANDOVER_SYSTEM_2026-02-02.md` (Primary specification)
- `.trae/documents/handover-module-analysis.md`

> **Critical Rewrite:** The current handover system is a single-party linear checklist. This epic implements a **ride-hailing style interactive UX** with alternating host/renter steps, real-time synchronization, and session persistence. See specification document for full architecture.

---

#### HAND-010: Database Schema for Interactive Handover
**Type:** Task | **Priority:** P0 | **Points:** 5 | **Sprint:** 3

**Description:** Update database schema to support turn-based handover with dual-party completion tracking.

**Deliverables:**
- [ ] Add `step_owner` column to `handover_step_completion` (enum: 'host', 'renter', 'both')
- [ ] Add `host_completed`, `renter_completed` boolean flags
- [ ] Add `host_completed_at`, `renter_completed_at` timestamps
- [ ] Add `current_step_order`, `waiting_for` to `handover_sessions`
- [ ] Add `handover_location_*` columns for flexible location selection
- [ ] Create `advance_handover_step()` SQL function
- [ ] Update RLS policies for dual-party access
- [ ] Migrate existing handover data to new format

**Files:**
- `supabase/migrations/[ts]_interactive_handover_schema.sql`

---

#### HAND-011: Location Selection for Handover
**Type:** Story | **Priority:** P0 | **Points:** 5 | **Sprint:** 3

**Description:** Allow host to select handover location (renter's location, car location, or searchable landmark).

**Deliverables:**
- [ ] Create `HandoverLocationSelector.tsx` component with 3 options
- [ ] Integrate Mapbox search for landmarks (malls, petrol stations, etc.)
- [ ] Show distance/ETA from renter's current location
- [ ] Renter receives location and can confirm/negotiate
- [ ] Store selected location in handover session

**Files:**
- `src/components/handover/HandoverLocationSelector.tsx` (new)
- `src/components/handover/steps/LocationSelectionStep.tsx` (new)
- `src/components/handover/steps/LocationConfirmationStep.tsx` (new)

---

#### HAND-012: Interactive Handover Hook
**Type:** Story | **Priority:** P0 | **Points:** 8 | **Sprint:** 3

**Description:** Create core hook for managing turn-based handover state with real-time sync.

**Deliverables:**
- [ ] Create `useInteractiveHandover.ts` hook with role-aware state
- [ ] Expose: `currentStep`, `isMyTurn`, `waitingFor`, `canProceed`
- [ ] Subscribe to real-time step completion updates
- [ ] Auto-advance UI when other party completes their step
- [ ] Handle "both" steps requiring dual completion
- [ ] Session persistence for resume capability

**Files:**
- `src/hooks/useInteractiveHandover.ts` (new)
- `src/services/interactiveHandoverService.ts` (new)

---

#### HAND-013: Waiting State UI Component
**Type:** Story | **Priority:** P0 | **Points:** 3 | **Sprint:** 3

**Description:** Display waiting state when it's not the current user's turn.

**Deliverables:**
- [ ] Create `WaitingForPartyCard.tsx` with animated indicator
- [ ] Show other party's name and avatar
- [ ] Display current step description
- [ ] Contact button for messaging
- [ ] Refresh status option

**Files:**
- `src/components/handover/WaitingForPartyCard.tsx` (new)

---

#### HAND-014: Dual-Party Step UI Component
**Type:** Story | **Priority:** P0 | **Points:** 3 | **Sprint:** 3

**Description:** UI for steps requiring both parties to complete (e.g., arrival confirmation).

**Deliverables:**
- [ ] Create `DualPartyStepCard.tsx` with dual status display
- [ ] Show host completion status (✅/⏳)
- [ ] Show renter completion status (✅/⏳)
- [ ] Display action button for current user
- [ ] Real-time status updates

**Files:**
- `src/components/handover/DualPartyStepCard.tsx` (new)

---

#### HAND-015: Handover Progress Timeline
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 3

**Description:** Visual timeline showing all handover steps with ownership and status.

**Deliverables:**
- [ ] Create `HandoverProgressTimeline.tsx` component
- [ ] Show all 14 pickup steps (or 12 return steps)
- [ ] Indicate step owner (host/renter/both)
- [ ] Highlight current step with "YOUR TURN" badge
- [ ] Show completion status for past steps
- [ ] Collapse/expand future steps

**Files:**
- `src/components/handover/HandoverProgressTimeline.tsx` (new)

---

#### HAND-016: Refactor EnhancedHandoverSheet
**Type:** Story | **Priority:** P0 | **Points:** 8 | **Sprint:** 3

**Description:** Update main handover sheet for role-aware interactive flow.

**Deliverables:**
- [ ] Integrate `useInteractiveHandover` hook
- [ ] Show `WaitingForPartyCard` when not user's turn
- [ ] Show `DualPartyStepCard` for "both" steps
- [ ] Role-aware step rendering based on `step_owner`
- [ ] Auto-navigate to current step when other party completes
- [ ] Handle pickup (14 steps) vs return (12 steps) flows

**Files:**
- `src/components/handover/EnhancedHandoverSheet.tsx`

---

#### HAND-017: New Interactive Step Components
**Type:** Story | **Priority:** P0 | **Points:** 5 | **Sprint:** 3

**Description:** Create new step components for interactive handover flow.

**Deliverables:**
- [ ] `EnRouteConfirmationStep.tsx` - Renter confirms heading to location
- [ ] `ArrivalConfirmationStep.tsx` - Both parties confirm arrival
- [ ] `KeyReceiptStep.tsx` - Renter confirms key receipt
- [ ] `CompletionStep.tsx` - Both parties confirm handover complete

**Files:**
- `src/components/handover/steps/EnRouteConfirmationStep.tsx` (new)
- `src/components/handover/steps/ArrivalConfirmationStep.tsx` (new)
- `src/components/handover/steps/KeyReceiptStep.tsx` (new)
- `src/components/handover/steps/CompletionStep.tsx` (new)

---

#### HAND-018: Update Existing Step Components
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 3

**Description:** Add role-aware props and rendering to existing step components.

**Deliverables:**
- [ ] Add `StepProps` interface with role and completion status
- [ ] Update `IdentityVerificationStep.tsx` (host only)
- [ ] Update `VehicleInspectionStep.tsx` (renter only)
- [ ] Update `DamageDocumentationStep.tsx` (both parties)
- [ ] Update `FuelMileageStep.tsx` (renter only)
- [ ] Update `KeyTransferStep.tsx` (host only)
- [ ] Update `DigitalSignatureStep.tsx` (both parties)

**Files:**
- All files in `src/components/handover/steps/`

---

#### HAND-019: Turn-Based Notifications
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 3

**Description:** Send notifications when it becomes a party's turn in the handover.

**Deliverables:**
- [ ] Create `handover_your_turn` notification type
- [ ] Send push when other party completes their step
- [ ] Include step name and action description
- [ ] Deep link to handover screen

**Files:**
- `src/services/notificationService.ts`
- Update notification templates

---

#### HAND-020: Handover Session Resume Logic
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 3

**Description:** Enable either party to resume handover from last completed step.

**Deliverables:**
- [ ] Detect existing incomplete handover session on app load
- [ ] Show resume prompt on home page and booking details
- [ ] Navigate directly to current step
- [ ] Sync with other party's progress

**Files:**
- `src/components/handover/HandoverResumePrompt.tsx` (new)
- Update `src/hooks/useHandoverPrompts.ts`

---

#### HAND-021: Interactive Handover E2E Testing
**Type:** Task | **Priority:** P1 | **Points:** 5 | **Sprint:** 4

**Description:** End-to-end testing of the complete interactive handover flow.

**Deliverables:**
- [ ] Test full 14-step pickup flow with two devices
- [ ] Test full 12-step return flow
- [ ] Test session resume after app close
- [ ] Test edge cases (network loss, timeout)
- [ ] Verify real-time sync accuracy
- [ ] Load testing with concurrent handovers

---

#### HAND-001: GPS Fallback Mechanism (Deferred)
**Type:** Story | **Priority:** P2 | **Points:** 5 | **Sprint:** 4

**Description:** Allow handover to proceed when GPS permission denied.

**Note:** Deferred to Sprint 4 as interactive handover is higher priority.

**Deliverables:**
- [ ] Add manual location entry option
- [ ] Implement location verification via photos
- [ ] Create admin override for location validation
- [ ] Improve permission request UX

**Files:**
- `src/components/handover/GPSVerificationStep.tsx`
- `src/components/handover/ManualLocationEntry.tsx` (new)

---

#### HAND-002: API Resilience for Mapbox (Deferred)
**Type:** Story | **Priority:** P2 | **Points:** 5 | **Sprint:** 4

**Description:** Add fallback for Mapbox API failures.

**Deliverables:**
- [ ] Implement retry with exponential backoff
- [ ] Add circuit breaker pattern
- [ ] Fallback to static map on failure
- [ ] Cache map tiles for offline

---

#### HAND-003: Handover Offline Support (Deferred)
**Type:** Story | **Priority:** P3 | **Points:** 8 | **Sprint:** 4

**Description:** Enable handover in poor connectivity areas.

**Note:** Deferred to post-launch due to complexity. Interactive flow takes priority.

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

#### MSG-003: Self-Messaging Prevention
**Type:** Bug Fix | **Priority:** P1 | **Points:** 2 | **Sprint:** 3

**Description:** Prevent users from starting conversations with themselves.

**Source:** Feedback Triage Board (October 2025) - Users can currently message themselves which creates confusing UX.

**Deliverables:**
- [ ] Add validation in `useOptimizedConversations.createConversation()` to block self-messaging
- [ ] Hide "Contact Owner" button when viewing own car listing
- [ ] Add client-side validation in MessagingInterface
- [ ] Return user-friendly error message if attempted

**Files:**
- `src/hooks/useOptimizedConversations.ts`
- `src/components/car-details/CarHeader.tsx`
- `src/components/chat/MessagingInterface.tsx`

---

#### MSG-004: Notification Sounds
**Type:** Story | **Priority:** P3 | **Points:** 2 | **Sprint:** 4

**Description:** Add audio notifications for new messages and alerts.

**Source:** Feedback Triage Board - Users want audio feedback for critical events.

**Deliverables:**
- [ ] Add sound files for message received, booking alert
- [ ] User preference toggle in settings
- [ ] Respect system mute/volume settings
- [ ] Only play when app not in focus (optional)

**Files:**
- `public/sounds/` (new folder)
- `src/hooks/useNotificationSound.ts` (new)
- `src/pages/Settings.tsx` (add preference)

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

### EPIC 12: MAP & LOCATION (MAJOR UX OVERHAUL)

**Current:** 65% | **Target:** 90% | **Gap:** 25%

**References:**
- `docs/NAVIGATION_UX_IMPROVEMENT_PLAN_2026-02-02.md` (Primary specification)
- [Mapbox Navigation SDK](https://docs.mapbox.com/android/navigation/overview/)

> **Critical UX Upgrade:** Current navigation experience uses generic map styles, static camera, and basic voice guidance. This epic implements **Google Maps/Waze-style navigation** with 3D perspective, heading-locked camera, maneuver icons, lane guidance, and enhanced voice announcements. See specification document for full architecture.

---

#### NAV-001: Navigation Map Style Configuration
**Type:** Task | **Priority:** P0 | **Points:** 3 | **Sprint:** 4

**Description:** Switch from `streets-v12` to navigation-optimized Mapbox styles.

**Deliverables:**
- [ ] Configure `navigation-day-v1` and `navigation-night-v1` styles
- [ ] Create `src/utils/mapbox/navigationStyles.ts` with style constants
- [ ] Add automatic day/night switching based on time
- [ ] Fallback to custom layer overlay if navigation styles unavailable

**Files:**
- `src/utils/mapbox/navigationStyles.ts` (new)
- `src/components/map/CustomMapbox.tsx` (update)

---

#### NAV-002: Landmark & POI Layer Visibility
**Type:** Story | **Priority:** P0 | **Points:** 5 | **Sprint:** 4

**Description:** Enable landmark visibility (malls, gas stations, hospitals) at navigation zoom levels.

**Deliverables:**
- [ ] Configure POI layer visibility at zoom 10+
- [ ] Filter POI categories: fuel, hospital, police, mall, restaurant, hotel
- [ ] Add icon sprites for common Botswana categories
- [ ] Ensure landmarks visible during active navigation

**Files:**
- `src/components/map/CustomMapbox.tsx`

---

#### NAV-003: 3D Buildings Layer
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 4

**Description:** Enable 3D extruded buildings in urban areas for navigation context.

**Deliverables:**
- [ ] Add `fill-extrusion` layer for buildings
- [ ] Configure `minzoom: 14` for performance
- [ ] Match urban area styling to navigation context

---

#### NAV-004: Street Name Visibility Enhancement
**Type:** Story | **Priority:** P0 | **Points:** 3 | **Sprint:** 4

**Description:** Ensure street names always visible at navigation zoom levels (14+).

**Deliverables:**
- [ ] Override label layers for zoom 14+
- [ ] Use larger font sizes during active navigation
- [ ] Add street names to route geometry display

---

#### NAV-005: Maneuver Icon Library
**Type:** Task | **Priority:** P0 | **Points:** 5 | **Sprint:** 4

**Description:** Create comprehensive SVG icon library for all navigation maneuvers.

**Deliverables:**
- [ ] Create `src/components/navigation/icons/` folder
- [ ] Design 15+ icons: turn-left, turn-right, slight-left, slight-right, sharp-left, sharp-right
- [ ] U-turn icons (left/right), merge icons (left/right)
- [ ] Roundabout icons with exit numbers (1-8)
- [ ] Straight, arrive, arrive-left, arrive-right, fork icons
- [ ] Export all icons from `index.ts`

**Files:**
- `src/components/navigation/icons/*.svg` (new)
- `src/components/navigation/icons/index.ts` (new)

---

#### NAV-006: ManeuverIcon Component
**Type:** Story | **Priority:** P0 | **Points:** 3 | **Sprint:** 4

**Description:** Create dynamic component to display correct maneuver icon based on instruction type.

**Deliverables:**
- [ ] Create `ManeuverIcon.tsx` component
- [ ] Map Mapbox maneuver types to icon files
- [ ] Support sizing variants (small, medium, large)
- [ ] Animate on upcoming maneuver

**Files:**
- `src/components/navigation/ManeuverIcon.tsx` (new)

---

#### NAV-007: DriverModeNavigationView Shell
**Type:** Story | **Priority:** P0 | **Points:** 8 | **Sprint:** 4

**Description:** Create fullscreen immersive navigation view matching Google Maps/Waze UX.

**Deliverables:**
- [ ] Create `DriverModeNavigationView.tsx` with fullscreen layout
- [ ] Header bar: ETA, remaining time, remaining distance, exit button
- [ ] Main area: 3D map with route overlay
- [ ] Maneuver card: icon, distance countdown, street name
- [ ] Next-next preview card showing upcoming maneuver
- [ ] Bottom bar: mute, recenter, report, speed display

**Layout:**
```
┌─────────────────────────────────────────┐
│ [ETA] [Time] [Distance]        [× Exit] │
├─────────────────────────────────────────┤
│      ┌───────────────┐                  │
│      │ [→] 500m      │ ← Maneuver       │
│      │ Main Street   │                  │
│      └───────────────┘                  │
│                                         │
│        [ 3D Map View ]                  │
│        [ Pitch: 60° ]                   │
│                                         │
│   ┌─────────────────────────────┐       │
│   │ Then: Left onto Oak Ave     │       │
│   └─────────────────────────────┘       │
├─────────────────────────────────────────┤
│ [🔇] [📍] [⚠️]  │ 85 km/h │ Limit: 80  │
└─────────────────────────────────────────┘
```

**Files:**
- `src/components/navigation/DriverModeNavigationView.tsx` (new)
- `src/components/navigation/NavigationHeader.tsx` (new)
- `src/components/navigation/NavigationBottomBar.tsx` (new)

---

#### NAV-008: Heading-Locked Camera
**Type:** Story | **Priority:** P0 | **Points:** 5 | **Sprint:** 4

**Description:** Implement camera that follows user heading (not north-up) with 3D perspective.

**Deliverables:**
- [ ] Update `RouteLayer.tsx` with heading-locked bearing
- [ ] Set `pitch: 60` and `bearing: userLocation.heading`
- [ ] Smooth camera transitions (1000ms easing)
- [ ] Auto-zoom adjustment based on next maneuver distance

**Files:**
- `src/components/navigation/RouteLayer.tsx` (update)

---

#### NAV-009: LaneGuidance Component
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 5

**Description:** Display lane guidance showing which lane to be in for upcoming maneuver.

**Deliverables:**
- [ ] Create `LaneGuidance.tsx` component
- [ ] Parse lane data from Mapbox Directions API
- [ ] Visual lane diagram with active lane highlighted
- [ ] Hide when lane data unavailable (graceful degradation)

**Files:**
- `src/components/navigation/LaneGuidance.tsx` (new)

---

#### NAV-010: NextManeuverPreview Component
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 5

**Description:** Display next-next instruction card for advanced route awareness.

**Deliverables:**
- [ ] Create `NextManeuverPreview.tsx` component
- [ ] Show upcoming maneuver after current one
- [ ] Compact display with icon and street name

**Files:**
- `src/components/navigation/NextManeuverPreview.tsx` (new)

---

#### NAV-011: Voice Guidance Service Enhancement
**Type:** Story | **Priority:** P0 | **Points:** 5 | **Sprint:** 5

**Description:** Create enhanced voice guidance with distance-aware phrasing.

**Deliverables:**
- [ ] Create `src/services/voiceGuidanceService.ts`
- [ ] Distance-aware announcements: "In 500 meters, turn right onto Main Street"
- [ ] Progressive announcements: 1km, 500m, 100m, "now"
- [ ] Announcement queue for overlapping instructions

**Files:**
- `src/services/voiceGuidanceService.ts` (new)

---

#### NAV-012: Street Name Voice Announcements
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 5

**Description:** Add street names to voice announcements with proper pronunciation.

**Deliverables:**
- [ ] Include street name in turn announcements
- [ ] Handle abbreviations (St → Street, Ave → Avenue)
- [ ] Localization support for Botswana place names

---

#### NAV-013: SpeedDisplay Component
**Type:** Story | **Priority:** P2 | **Points:** 3 | **Sprint:** 5

**Description:** Display current speed with optional speed limit.

**Deliverables:**
- [ ] Create `SpeedDisplay.tsx` component
- [ ] Show current GPS speed in km/h
- [ ] Color coding (normal, warning, over limit)

**Files:**
- `src/components/navigation/SpeedDisplay.tsx` (new)

---

#### NAV-014: Speed Limit Data Integration
**Type:** Story | **Priority:** P2 | **Points:** 5 | **Sprint:** 5

**Description:** Query and display speed limit data from Mapbox.

**Deliverables:**
- [ ] Create `src/services/speedLimitService.ts`
- [ ] Query Mapbox Map Matching API for speed limits
- [ ] Display limit in SpeedDisplay component
- [ ] Optional overspeed warning

**Files:**
- `src/services/speedLimitService.ts` (new)

---

#### NAV-015: Traffic-Colored Route Segments
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 5

**Description:** Color route line based on real-time traffic conditions.

**Deliverables:**
- [ ] Enhance existing traffic layer in `RouteLayer.tsx`
- [ ] Apply traffic colors to route line (green/yellow/red)
- [ ] Add traffic delay to ETA calculation

---

#### NAV-016: Automatic Arrival Detection
**Type:** Story | **Priority:** P1 | **Points:** 5 | **Sprint:** 5

**Description:** Detect arrival at destination with parking guidance.

**Deliverables:**
- [ ] Auto-detect when user reaches destination (50m threshold)
- [ ] Display "You have arrived" announcement
- [ ] Show nearby parking options if available
- [ ] Transition from navigation to arrival state

---

#### NAV-017: Route Preview Fly-Along Animation
**Type:** Story | **Priority:** P2 | **Points:** 5 | **Sprint:** 5

**Description:** Animated camera fly-along route preview before starting navigation.

**Deliverables:**
- [ ] Animate camera along full route on navigation start
- [ ] Show key landmarks and turn points
- [ ] "Skip Preview" option

---

#### NAV-018: Navigation Integration Testing
**Type:** Task | **Priority:** P0 | **Points:** 8 | **Sprint:** 5

**Description:** End-to-end testing of complete navigation experience.

**Deliverables:**
- [ ] Test all maneuver icon types display correctly
- [ ] Verify voice announcements timing and content
- [ ] Test camera behavior during navigation
- [ ] Verify landmark/POI visibility
- [ ] Performance testing (60fps animations, battery usage)
- [ ] Cross-device testing

---

#### MAP-001: Location Privacy Controls
**Type:** Story | **Priority:** P2 | **Points:** 3 | **Sprint:** 5

**Description:** Add location privacy settings.

**Deliverables:**
- [ ] Approximate vs exact location toggle
- [ ] Hide exact address until booking confirmed
- [ ] Privacy settings in profile

---

#### MAP-002: Offline Maps
**Type:** Story | **Priority:** P3 | **Points:** 5 | **Sprint:** 5

**Description:** Enable offline map access.

**Deliverables:**
- [ ] Cache frequently used map areas
- [ ] Show cached maps when offline
- [ ] Indicate offline status

---

**Epic 12 Total Story Points:** 90 (Navigation: 82 + Privacy/Offline: 8)

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

#### HOST-001: Host Car Deletion
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 3

**Description:** Allow hosts to delete their own car listings.

**Source:** Feedback Triage Board (October 2025) - Hosts cannot delete a car, only edit.

**Deliverables:**
- [ ] Add "Delete Car" button to car edit page
- [ ] Confirmation dialog with warning about impact
- [ ] Check for active bookings before allowing deletion
- [ ] Soft delete (set `is_available = false`, add `deleted_at` column) or hard delete with cascade
- [ ] Admin notification of deletion (optional)
- [ ] Update host car list after deletion

**Business Rules:**
- Cannot delete car with active/confirmed bookings
- Pending bookings should be auto-cancelled with notification to renters
- Completed bookings history preserved for reviews

**Files:**
- `src/pages/EditCar.tsx` (add delete button)
- `src/components/host/DeleteCarDialog.tsx` (new)
- `src/services/carService.ts` (add delete function)

---

#### HOST-002: Add Car Visibility Improvement
**Type:** Task | **Priority:** P2 | **Points:** 2 | **Sprint:** 4

**Description:** Make "Add Car" functionality more discoverable for hosts.

**Source:** Feedback Triage Board - Poor visibility for "Add Car" feature.

**Deliverables:**
- [ ] Add prominent "Add Car" button on host dashboard
- [ ] Empty state with CTA when host has no cars
- [ ] Quick add from navigation menu

**Files:**
- `src/pages/HostDashboard.tsx`
- `src/components/Navigation.tsx`

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

### UI/UX IMPROVEMENTS

---

#### UI-001: Receipt Generation
**Type:** Story | **Priority:** P1 | **Points:** 3 | **Sprint:** 3

**Description:** Complete receipt generation functionality for completed rentals.

**Source:** Feedback Triage Board - Missing receipt generation after rental completion.

**Deliverables:**
- [ ] Generate PDF receipt with booking details
- [ ] Include payment breakdown (rental, insurance, fees)
- [ ] Add vehicle and host/renter information
- [ ] Email receipt option
- [ ] Download from booking history

**Files:**
- `src/components/shared/ReceiptModal.tsx` (update - implement PDF generation)
- `src/services/receiptService.ts` (new)
- `supabase/functions/generate-receipt/index.ts` (optional - server-side PDF)

**Technical Notes:**
- Use jsPDF library (already installed) for client-side generation
- Consider server-side for consistent formatting

---

#### UI-002: Dashboard Metrics Enhancement
**Type:** Story | **Priority:** P2 | **Points:** 3 | **Sprint:** 3

**Description:** Add comprehensive metrics to host and renter dashboards.

**Source:** Feedback Triage Board - Missing dashboard metrics.

**Deliverables:**
- [ ] Host: Total earnings, active bookings, car views
- [ ] Host: Earnings trend chart
- [ ] Renter: Total spent, upcoming bookings, saved cars count
- [ ] Both: Rating summary

**Files:**
- `src/pages/HostDashboard.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/MetricsCard.tsx` (new)

---

#### UI-003: Role Switching Improvement
**Type:** Task | **Priority:** P2 | **Points:** 2 | **Sprint:** 4

**Description:** Improve host/renter role switching experience.

**Source:** Feedback Triage Board - Role switching is not seamless.

**Deliverables:**
- [ ] Clear visual indicator of current role
- [ ] One-click role toggle in navigation
- [ ] Remember last used role per session
- [ ] Contextual navigation based on role

**Files:**
- `src/components/Navigation.tsx`
- `src/hooks/useUserRole.ts` (update or new)

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
- Type safety (50+ `any` types to fix)

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

### Sprint 3 (Feb 17-23): Handover, Messaging, Admin, UI

| Story ID | Name | Points | Owner |
|----------|------|--------|-------|
| HAND-001 | GPS Fallback | 5 | Frontend |
| HAND-002 | API Resilience | 5 | Frontend |
| HAND-003 | Offline Support | 8 | Full-stack |
| NOTIF-003 | SMS Service | 5 | Backend |
| MSG-001 | Search Enhancement | 3 | Frontend |
| MSG-003 | Self-Messaging Prevention | 2 | Frontend |
| ADMIN-001 | Transaction Dashboard | 5 | Frontend |
| ADMIN-002 | Withdrawal Management | 5 | Frontend |
| ADMIN-003 | Analytics Completion | 5 | Frontend |
| REV-001 | Review Analytics | 3 | Frontend |
| REV-002 | Review Moderation | 3 | Frontend |
| INS-002 | Claims Workflow | 5 | Frontend |
| BOOK-001 | Booking Request Filtering | 3 | Frontend |
| BOOK-002 | Insurance Info on Booking | 2 | Frontend |
| HOST-001 | Host Car Deletion | 3 | Frontend |
| UI-001 | Receipt Generation | 3 | Frontend |
| UI-002 | Dashboard Metrics | 3 | Frontend |
| **Total** | | **68** | |

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
| MSG-004 | Notification Sounds | 2 | Frontend |
| HOST-002 | Add Car Visibility | 2 | Frontend |
| UI-003 | Role Switching | 2 | Frontend |
| HELP-001 | FAQ System | 5 | Frontend |
| TEST-001 | Beta Testing Complete | 10 | All |
| TEST-002 | Payment E2E Testing | 5 | QA |
| TEST-003 | Route Audit | 3 | QA |
| **Total** | | **56** | |

---

## NEW ITEMS ADDED (Feb 2, 2026)

The following items were identified from the Feedback Triage Board and Status Reports as missing from the original plan:

| Story ID | Name | Points | Sprint | Source |
|----------|------|--------|--------|--------|
| HOST-001 | Host Car Deletion | 3 | Sprint 3 | Feedback Triage Board |
| HOST-002 | Add Car Visibility | 2 | Sprint 4 | Feedback Triage Board |
| BOOK-001 | Booking Request Filtering | 3 | Sprint 3 | Feedback Triage Board |
| BOOK-002 | Insurance Info on Booking | 2 | Sprint 3 | Feedback Triage Board |
| MSG-003 | Self-Messaging Prevention | 2 | Sprint 3 | Feedback Triage Board |
| MSG-004 | Notification Sounds | 2 | Sprint 4 | Feedback Triage Board |
| UI-001 | Receipt Generation | 3 | Sprint 3 | Feedback Triage Board |
| UI-002 | Dashboard Metrics | 3 | Sprint 3 | Feedback Triage Board |
| UI-003 | Role Switching | 2 | Sprint 4 | Feedback Triage Board |
| **Total** | | **22** | | |

---

## INTERACTIVE HANDOVER SYSTEM (Feb 2, 2026)

**Major Feature Overhaul:** The handover system is being completely rebuilt to support a ride-hailing style interactive UX.

**Full Specification:** [`docs/INTERACTIVE_HANDOVER_SYSTEM_2026-02-02.md`](./INTERACTIVE_HANDOVER_SYSTEM_2026-02-02.md)

### Key Changes:
- **Turn-based flow:** Alternating steps between host and renter (14 pickup steps, 12 return steps)
- **Real-time sync:** Both parties see updates instantly via Supabase subscriptions
- **Location selection:** Host can choose renter location, car location, or search landmarks
- **Session persistence:** Either party can resume from last completed step
- **Dual-party steps:** Some steps require both parties to complete before advancing

### New Tasks Added:

| Story ID | Name | Points | Sprint | Priority |
|----------|------|--------|--------|----------|
| HAND-010 | DB Schema for Interactive Handover | 5 | Sprint 3 | P0 |
| HAND-011 | Location Selection for Handover | 5 | Sprint 3 | P0 |
| HAND-012 | Interactive Handover Hook | 8 | Sprint 3 | P0 |
| HAND-013 | Waiting State UI Component | 3 | Sprint 3 | P0 |
| HAND-014 | Dual-Party Step UI Component | 3 | Sprint 3 | P0 |
| HAND-015 | Handover Progress Timeline | 5 | Sprint 3 | P1 |
| HAND-016 | Refactor EnhancedHandoverSheet | 8 | Sprint 3 | P0 |
| HAND-017 | New Interactive Step Components | 5 | Sprint 3 | P0 |
| HAND-018 | Update Existing Step Components | 5 | Sprint 3 | P1 |
| HAND-019 | Turn-Based Notifications | 3 | Sprint 3 | P1 |
| HAND-020 | Handover Session Resume Logic | 3 | Sprint 3 | P1 |
| HAND-021 | Interactive Handover E2E Testing | 5 | Sprint 4 | P1 |
| **Total** | | **58** | | |

### Deferred Tasks:
- HAND-001 (GPS Fallback) → Sprint 4
- HAND-002 (Mapbox Resilience) → Sprint 4
- HAND-003 (Offline Support) → Post-launch

---

## NAVIGATION UX IMPROVEMENT SYSTEM (Feb 2, 2026)

**Major UX Overhaul:** The handover navigation experience is being completely rebuilt to match Google Maps/Waze standards.

**Full Specification:** [`docs/NAVIGATION_UX_IMPROVEMENT_PLAN_2026-02-02.md`](./NAVIGATION_UX_IMPROVEMENT_PLAN_2026-02-02.md)

### Key Changes:
- **Map styles:** Switch from `streets-v12` to `navigation-day-v1`/`navigation-night-v1` for proper POI/landmark visibility
- **3D perspective:** Heading-locked camera with 60° pitch (vs current static top-down)
- **Maneuver icons:** 15+ distinct icons (turn-left, u-turn, roundabout, etc.) replacing single generic icon
- **Lane guidance:** Display lane diagrams showing which lane to be in
- **Voice guidance:** Distance-aware announcements with street names ("In 500m, turn right onto Main Street")
- **Driver mode:** Fullscreen immersive `DriverModeNavigationView` component

### Current Issues Addressed:
| Issue | Before | After |
|-------|--------|-------|
| Landmarks | Missing at navigation zoom | Visible at zoom 10+ (malls, gas stations, hospitals) |
| Street names | Inconsistent visibility | Always visible at zoom 14+ during navigation |
| Camera | Static north-up | 3D heading-locked with 60° pitch |
| Maneuver icons | Single `Navigation2` icon | 15+ contextual icons |
| Voice | Basic SpeechSynthesis | "In 500 meters, turn right onto [street]" |

### New Tasks Added:

| Story ID | Name | Points | Sprint | Priority |
|----------|------|--------|--------|----------|
| NAV-001 | Navigation Map Style Configuration | 3 | Sprint 4 | P0 |
| NAV-002 | Landmark & POI Layer Visibility | 5 | Sprint 4 | P0 |
| NAV-003 | 3D Buildings Layer | 3 | Sprint 4 | P1 |
| NAV-004 | Street Name Visibility Enhancement | 3 | Sprint 4 | P0 |
| NAV-005 | Maneuver Icon Library (15 icons) | 5 | Sprint 4 | P0 |
| NAV-006 | ManeuverIcon Component | 3 | Sprint 4 | P0 |
| NAV-007 | DriverModeNavigationView Shell | 8 | Sprint 4 | P0 |
| NAV-008 | Heading-Locked Camera | 5 | Sprint 4 | P0 |
| NAV-009 | LaneGuidance Component | 5 | Sprint 5 | P1 |
| NAV-010 | NextManeuverPreview Component | 3 | Sprint 5 | P1 |
| NAV-011 | Voice Guidance Service Enhancement | 5 | Sprint 5 | P0 |
| NAV-012 | Street Name Voice Announcements | 3 | Sprint 5 | P1 |
| NAV-013 | SpeedDisplay Component | 3 | Sprint 5 | P2 |
| NAV-014 | Speed Limit Data Integration | 5 | Sprint 5 | P2 |
| NAV-015 | Traffic-Colored Route Segments | 5 | Sprint 5 | P1 |
| NAV-016 | Automatic Arrival Detection | 5 | Sprint 5 | P1 |
| NAV-017 | Route Preview Fly-Along Animation | 5 | Sprint 5 | P2 |
| NAV-018 | Navigation Integration Testing | 8 | Sprint 5 | P0 |
| **Total** | | **82** | | |

### Deferred Tasks:
- MAP-001 (Location Privacy Controls) → Sprint 5
- MAP-002 (Offline Maps) → Sprint 5

---

## RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PayGate integration delays | Medium | Critical | Start sandbox testing Day 1; have manual payment fallback |
| Beta tester dropout | Low | Medium | Over-recruit to 75; incentive program |
| Sprint overrun | Medium | High | Daily standups; scope adjustment authority |
| Payment security issues | Low | Critical | Code review for all payment code; no secrets in client |
| Sprint 3 overload (68 SP) | Medium | High | Prioritize P0/P1 items; defer P2/P3 if needed |
| Navigation styles unavailable | Low | Medium | Use custom layer overlay fallback (documented in plan) |
| Lane guidance data missing for Botswana | Medium | Low | Hide component gracefully when data unavailable |

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
- [ ] Navigation UX matches Google Maps/Waze quality

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
| **Interactive Handover System** | **`docs/INTERACTIVE_HANDOVER_SYSTEM_2026-02-02.md`** | **Interactive handover specification** |
| **Navigation UX Improvement** | **`docs/NAVIGATION_UX_IMPROVEMENT_PLAN_2026-02-02.md`** | **Google Maps/Waze-style navigation spec** |
| Insurance README | `docs/INSURANCE_README.md` | Insurance implementation |
| Jira Tasks v2.4.0 | `docs/JIRA_TASKS_V2.4.0.md` | Prior sprint context |
| Feedback Triage Board | `.trae/documents/MOBIRIDES_FEEDBACK_TRIAGE_BOARD.md` | User feedback issues |

---

**Document Version:** 1.3  
**Created:** February 2, 2026  
**Updated:** February 2, 2026 (Added navigation UX tasks NAV-001 to NAV-018, Epic 12 overhaul)  
**Author:** Development Team  
**Status:** Ready for Team Review
