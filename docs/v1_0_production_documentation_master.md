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
- **Tiers**: No Coverage (P0/day), Basic (P80/day), Standard (P150/day), Premium (P250/day).
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

## 4. Legal & Policies (Commercial V1.0)

| Document | UI Route | Markdown Asset |
| :--- | :--- | :--- |
| **General Terms of Service** | `/terms` | `docs/production_assets/legal/TermsOfService.md` |
| **Renter Specific Terms** | `/terms/renter` | `docs/production_assets/legal/RenterTerms.md` |
| **Host Specific Terms** | `/terms/host` | `docs/production_assets/legal/HostTerms.md` |
| **Privacy Policy** | `/privacy` | `docs/production_assets/legal/PrivacyPolicy.md` |
| **Community Guidelines** | `/community-guidelines` | `docs/production_assets/legal/CommunityGuidelines.md` |
| **Insurance Policies** | `/insurance-policies` | `docs/production_assets/legal/InsuranceTerms.md` |

### 4.2 Help Center & Instructional Assets

| Document | UI Route | Markdown Asset |
| :--- | :--- | :--- |
| **Tutorial System Steps** | N/A (Mobi AI) | `docs/production_assets/instructional/TutorialSteps.md` |
| **ToS Guide** | `/help/:role/terms` | `docs/production_assets/help_center/TermsOfServiceGuide.md` |
| **Cancellation Policy** | `/help/:role/cancellation` | `docs/production_assets/help_center/CancellationPolicyGuide.md` |
| **Safety Guidelines** | `/help/renter/safety` | `docs/production_assets/help_center/SafetyGuidelinesGuide.md` |
| **Handover Process** | `/help/host/handover` | `docs/production_assets/help_center/HandoverProcessGuide.md` |
| **Refer a Friend** | `/help/:role/referral` | `docs/production_assets/help_center/ReferAFriendGuide.md` |
| **Loyalty Program** | `/help/:role/rewards` | `docs/production_assets/help_center/LoyaltyProgramGuide.md` |

---

## 5. Known Launch Blockers (P0)
1. **Payment Credentials**: Integration with PayGate/Ooze production sandbox is pending receipt of credentials.
2. **Native Push Provisioning**: `google-services.json` setup (MOB-122) blocked pending Google Cloud console access.

---

## 6. Deployment Info
- **Production URL**: [app.mobirides.com](https://app.mobirides.com)
- **Frontend**: React + Vite + Tailwind (Inter/Outfit fonts).
- **Backend**: Supabase (PostgreSQL + Edge Functions).
- **Hosting**: Vercel.

---
*Verified by Antigravity AI on behalf of the MobiRides Engineering Team.*
