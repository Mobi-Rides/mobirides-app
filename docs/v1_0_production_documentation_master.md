# MobiRides V1.0 Production Documentation (Sprint 14 Master)

**Date:** 07 May 2026  
**Sprint:** Sprint 14 (Operations & Refinement)  
**Status:** LAUNCH READY (Internal Verified)

---

## 1. System Architecture & Core Services

### 1.1 Booking Lifecycle (MOB-PAY-003)
- **Canonical Engine**: `bookingLifecycle.updateStatus()` is the single entry point for all status transitions.
- **Status Flow**: `pending` → `approved` → `awaiting_payment` → `paid` → `ongoing` → `completed`.
- **Realtime Strategy**: All interfaces (`RenterBookings`, `HostBookings`) utilize Supabase `postgres_changes` subscriptions.
- **Payment Integration**: `RenterPaymentModal` replaces legacy redirects; `staleTime: 0` ensures UI immediate consistency.

### 1.2 Pricing & Financials
- **Dynamic Pricing**: `DynamicPricingService.ts` handles weekly/monthly discounts (Standardized at 10%/20% per Botswana platform rules).
- **Service Fees**: Admin fee (P150) and platform commission (15%) are hardcoded in the `UnifiedPriceSummary` and `InsuranceService`.
- **Currency**: All transactions are in Botswana Pula (BWP).

### 1.3 Insurance Module (Pay-U SLA)
- **Partner**: Pay-U Insurance Partners (Underwriter).
- **Tiers**: Basic (P80/day), Standard (P150/day), Premium (P250/day).
- **Claim Logic**: `InsuranceService.calculateClaimPayout()` enforces excess rates and P150 admin fee deductions.
- **UI**: `ClaimsSubmissionForm.tsx` handles multi-step filing and RLS-compliant document uploads.

---

## 2. Infrastructure & Notifications

### 2.1 Notification Pipeline
- **Dispatcher**: `completeNotificationService.ts` handles Email (Resend), Push (Supabase), and DB alerts.
- **Templates**: Centralized in `resend-service` Edge Function; strictly typed and sanitized.
- **Auto-Notifications**: Triggered on `updateStatus()` calls for all major lifecycle events (Booking Received, Payment Confirmed, Handover Reminder).

### 2.2 Security (BUG-004 Remediation)
- **API Keys**: All Supabase and Resend keys rotated following the Sprint 13 leakage.
- **PII Protection**: Email masking and data anonymization implemented in `analyticsService.ts`.
- **Audit Logging**: `audit_logs` table records all SuperAdmin and financial state changes.

---

## 3. SuperAdmin Management
- **User Controls**: `suspend_user`, `ban_user`, and `transfer_vehicle` RPCs are live and verified.
- **Analytics**: `useSuperAdminAnalytics.ts` provides real-time monitoring of system revenue, user growth, and security alerts.
- **Audit Trails**: Fully transparent audit view available in the SuperAdmin dashboard.

---

## 4. Known Launch Blockers (P0)
1. **Payment Credentials**: Integration with PayGate/Ooze production sandbox is pending receipt of credentials.
2. **User Documents**: Final verification of ID/License upload RLS policies for international users is ongoing.

---

## 5. Deployment Info
- **Production URL**: [app.mobirides.com](https://app.mobirides.com)
- **Frontend**: React + Vite + Tailwind (Inter/Outfit fonts).
- **Backend**: Supabase (PostgreSQL + Edge Functions).
- **hosting**: Vercel.

---
*Verified by Antigravity AI on behalf of the MobiRides Engineering Team.*
