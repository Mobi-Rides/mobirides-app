# 🔧 **TECHNICAL DEBT TRACKER**

**Last Updated:** February 15, 2026  
**Total Debt Items:** 47 (4 resolved)  
**Critical:** 10 | **High:** 19 | **Medium:** 14

---

## 📌 **RECENT PROGRESS (Payment Flow)**

**RentalDetails payment wiring (3b) — DONE**
- **Pay Now** in `RentalActions` calls `onPayNow` (passed from `RentalDetailsRefactored`).
- **RenterPaymentModal** opens when Pay Now is clicked; modal uses **useBookingPayment** hook.
- On successful payment, booking transitions **awaiting_payment → confirmed** (and `payment_status: 'paid'`) via `useBookingPayment` / mock flow.
- **24h deadline** is set when moving to `awaiting_payment` in `BookingRequestDetails`, `useBookingActions`, and `HostBookings` (`payment_deadline: now + 24h`).

**Still to do (per payment architecture):**
- **3a.** Use real **booking.payment_deadline** in UI (add to `BookingWithRelations`, use in `PaymentDeadlineTimer` in modal and on rental details page).
- **3c.** **Payment deadline enforcement:** extend `handleExpiredBookings` to auto-expire `awaiting_payment` bookings past `payment_deadline`; ensure it is called from RentalDetails and/or booking flows.

---

## 🚨 **CRITICAL DEBT (Must Fix Immediately)**

### **1. Mock Payment System**
- **File:** `src/services/mockPaymentService.ts`
- **Issue:** Production system using mock payment processor
- **Impact:** 🔥 Cannot process real transactions
- **Effort:** 4 days
- **Owner:** Backend Team

### **2. File Upload Simulation** ✅ RESOLVED (February 2026)
- **Files:** `src/components/verification/steps/SelfieVerificationStep.tsx` (and other upload flows)
- **Issue:** Selfie step showed "uploaded" but did not persist to storage; other flows already used Supabase Storage.
- **Impact:** 🟢 RESOLVED - Selfie now uploaded to `verification-selfies` via `VerificationService.uploadSelfie()` before completing step.
- **Resolution:** On submit, selfie blob is converted to `File`, uploaded via `VerificationService.uploadSelfie(userId, file)`, then `completeDocumentUpload(userId)` is called. DocumentUploadStep, handover photos, claims, car images, avatars already used real storage.
- **Owner:** Full-stack Team
- **Resolved Date:** February 2026

### **3. Dual Message Systems** ✅ RESOLVED (December 2025)
- **Files:** `messages` table vs `conversation_messages`
- **Issue:** Two competing messaging architectures
- **Impact:** 🟢 RESOLVED - Legacy tables archived to `archive` schema
- **Resolution:** Legacy `message_operations` dropped, `messages_with_replies` view dropped, legacy tables archived
- **Owner:** Backend Team
- **Resolved Date:** December 4, 2025

### **4. Broken Push Notifications**
- **File:** `src/utils/pushNotifications.ts`
- **Issue:** Hardcoded VAPID keys, no real server
- **Impact:** 🔥 No push notification delivery
- **Effort:** 3 days
- **Owner:** DevOps Team

### **5. No Transaction Atomicity**
- **Files:** All wallet and booking operations
- **Issue:** Database operations not wrapped in transactions
- **Impact:** 🔥 Data corruption possible on failures
- **Effort:** 3 days
- **Owner:** Backend Team

### **6. Missing Admin Review UI** ✅ RESOLVED (February 2026)
- **Issue:** Verification system admin interface was previously missing.
- **Impact:** 🟢 RESOLVED — Admin has Verifications tab (`/admin/verifications`), VerificationManagementTable, KYCVerificationTable, and VerificationReviewDialog for document review and approve/reject.
- **Resolution:** User/KYC verification review and approval flow is implemented; car listing approval exists on dashboard as "Car Verification Queue" (CarVerificationTable).
- **Owner:** Frontend Team
- **Resolved Date:** February 2026

### **7. Earnings vs Balance Confusion**
- **Files:** Wallet-related services
- **Issue:** Dual tracking of money with unclear relationship
- **Impact:** 🔥 Financial reporting inaccuracies
- **Effort:** 2 days
- **Owner:** Backend Team

### **8. Duplicate Car Creation Routes**
- **Files:** `AddCar.tsx` vs `CreateCar.tsx`
- **Issue:** Two components doing same thing
- **Impact:** 🔥 Code maintenance nightmare
- **Effort:** 1 day
- **Owner:** Frontend Team

### **9. No File Validation**
- **Files:** All upload components
- **Issue:** No size, type, or security validation
- **Impact:** 🔥 Security vulnerability
- **Effort:** 2 days
- **Owner:** Security Team

### **10. Mock Document Verification**
- **File:** `DocumentUploadStep.tsx`
- **Issue:** Documents marked as uploaded without storage
- **Impact:** 🔥 KYC compliance failure
- **Effort:** 3 days
- **Owner:** Compliance Team

---

## ⚡ **HIGH PRIORITY DEBT**

### **11. Type Safety Issues (18 instances)**
- **Files:** Throughout codebase
- **Issue:** 50+ instances of `any` types
- **Impact:** Runtime errors, poor developer experience
- **Effort:** 7 days
- **Owner:** Development Team

### **12. Error Handling Gaps**
- **Files:** Service layers
- **Issue:** Silent failures, generic error messages
- **Impact:** Poor debugging, user experience
- **Effort:** 5 days
- **Owner:** Development Team

### **13. No Email Service Integration**
- **File:** `NotificationService.ts`
- **Issue:** Email notifications configured but not implemented
- **Impact:** Missing critical user communications
- **Effort:** 2 days
- **Owner:** Backend Team

### **14. SMS Service Missing**
- **Files:** Phone verification components
- **Issue:** SMS preferences exist but no sending capability
- **Impact:** Cannot verify phone numbers
- **Effort:** 2 days
- **Owner:** Backend Team

### **15. Incomplete Message Migration** ✅ RESOLVED (December 2025)
- **Files:** Messaging hooks and components
- **Issue:** Legacy message handling still present
- **Impact:** 🟢 RESOLVED - Migration to conversation system complete
- **Resolution:** Legacy messaging tables archived, `message_operations` table dropped
- **Owner:** Backend Team
- **Resolved Date:** December 4, 2025

### **16. 24-hour payment deadline not used in UI (per payment architecture)**
- **Files:** `src/types/booking.ts`, `src/components/booking/RenterPaymentModal.tsx`, rental details page
- **Issue:** `payment_deadline` is set when booking goes to `awaiting_payment` but is missing from `BookingWithRelations`; `PaymentDeadlineTimer` in RenterPaymentModal uses hardcoded `Date.now() + 24h` instead of `booking.payment_deadline`; rental details page does not show countdown for awaiting_payment.
- **Impact:** Users may see wrong deadline; no single source of truth from DB.
- **Effort:** 0.5 day
- **Owner:** Frontend Team

### **17. Payment deadline enforcement (awaiting_payment auto-expire)**
- **Files:** `src/services/bookingService.ts` (`handleExpiredBookings`), `RentalDetailsRefactored.tsx` (or equivalent entry points)
- **Issue:** `handleExpiredBookings` only expires `pending` bookings with `start_date` in the past. It does not expire `awaiting_payment` bookings whose `payment_deadline` has passed. RentalDetails does not call expiry check when viewing an awaiting_payment booking.
- **Impact:** Bookings can stay in awaiting_payment indefinitely after 24h; inventory not released.
- **Effort:** 0.5 day
- **Owner:** Backend / Full-stack Team

---

## 📊 **DETAILED DEBT INVENTORY**

### **By Component:**

#### **Authentication & Users (3 items)**
- [ ] Missing 2FA implementation (Medium)
- [ ] No password strength validation (High)
- [ ] Session management improvements needed (Medium)

#### **Car Management (4 items)**
- [ ] Duplicate route components (Critical)
- [ ] Missing image validation (Critical)
- [ ] Location validation gaps (High)
- [ ] Car approval only on dashboard; add Pending approval tab to /admin/cars (Medium)

#### **Booking System (7 items)**
- [ ] Mock payment integration (Critical)
- [ ] No transaction atomicity (Critical)
- [ ] Booking expiry logic incomplete (High)
- [ ] **Payment deadline not in UI / PaymentDeadlineTimer hardcoded (High)** — see §16
- [ ] **awaiting_payment auto-expire past payment_deadline (High)** — see §17
- [ ] Location data inconsistency (High)
- [ ] Missing booking analytics (Medium)

#### **Messaging (4 items)**
- [ ] Dual message systems (Critical)
- [ ] Incomplete migration (High)
- [ ] No typing indicators (Medium)
- [ ] Message status incomplete (Medium)

#### **Payments & Wallet (6 items)**
- [ ] Mock payment service (Critical)
- [ ] Earnings vs balance confusion (Critical)
- [ ] No payout system (High)
- [ ] Float precision issues (High)
- [ ] No audit trail (High)
- [ ] Missing transaction reconciliation (Medium)
- **Note:** RentalDetails Pay Now → RenterPaymentModal → useBookingPayment → confirmed is wired (§ Recent progress).

#### **Notifications (5 items)**
- [ ] Broken push notifications (Critical)
- [ ] No email integration (High)
- [ ] SMS service missing (High)
- [ ] No real-time delivery (High)
- [ ] Notification preferences incomplete (Medium)

#### **File Storage (4 items)**
- [x] ~~Mock file uploads~~ (Critical) ✅ RESOLVED — Selfie and other flows use real Supabase Storage
- [ ] No file validation (Critical)
- [ ] Missing CDN integration (High)
- [ ] No image optimization (Medium)

#### **Admin System (3 items)**
- [x] ~~No verification review UI~~ (Critical) ✅ RESOLVED — Verifications tab + KYC review/approve flow implemented
- [ ] Missing audit logging (High)
- [ ] No analytics dashboard (Medium)

#### **Verification (6 items)**
- [ ] Mock document uploads (Critical)
- [ ] No OCR validation (High)
- [ ] Incomplete selfie verification (High)
- [ ] Missing admin workflow (High)
- [ ] No document expiry checking (Medium)
- [ ] Incomplete phone verification (Medium)

#### **Handover (4 items)**
- [ ] No photo storage (Critical)
- [ ] Missing GPS verification (High)
- [ ] No timeout handling (High)
- [ ] Signature validation missing (Medium)

#### **Performance (3 items)**
- [ ] No caching implementation (High)
- [ ] Large data loads (High)
- [ ] Memory leak potential (Medium)

#### **Security (6 items)**
- [ ] No file validation (Critical)
- [ ] Missing rate limiting (High)
- [ ] No security headers (High)
- [ ] Insufficient input validation (High)
- [ ] Missing CSRF protection (Medium)
- [ ] No audit logging (Medium)

---

## 📈 **DEBT METRICS**

### **Technical Debt Ratio**
- **Critical Issues:** 10/47 (21%)
- **High Priority:** 19/47 (40%)
- **Medium Priority:** 14/47 (30%)
- **Resolved:** 4

### **By Effort Estimation**
- **1-2 days:** 8 items
- **3-4 days:** 21 items
- **5-7 days:** 12 items
- **1-2 weeks:** 6 items

### **By Team Ownership**
- **Backend Team:** 18 items
- **Frontend Team:** 12 items
- **Full-stack Team:** 8 items
- **DevOps Team:** 5 items
- **Security Team:** 4 items

---

## 🎯 **DEBT REDUCTION PLAN**

### **Phase 1: Critical Debt (Weeks 1-2)**
Target: Eliminate all critical debt items  
**Focus:** Payment system, file storage, data integrity

### **Phase 2: High Priority Debt (Weeks 3-4)**
Target: Reduce high priority items by 80%  
**Focus:** Type safety, error handling, notifications

### **Phase 3: Medium Priority Debt (Month 2)**
Target: Address medium priority technical debt  
**Focus:** Performance, security, user experience

---

## 📋 **TRACKING TEMPLATE**

For each debt item, track:
```markdown
### **[PRIORITY] Debt Item Name**
- **ID:** TD-001
- **File(s):** path/to/file.ts
- **Issue:** Brief description
- **Impact:** Business/technical impact
- **Effort:** Time estimate
- **Owner:** Team responsible
- **Status:** Not Started | In Progress | Complete
- **Due Date:** Target completion
- **Dependencies:** Other items blocking this
```

---

## 🔄 **REGULAR REVIEW PROCESS**

### **Weekly Debt Review**
- Review progress on critical items
- Adjust priorities based on business needs
- Identify new debt accumulation

### **Monthly Debt Assessment**
- Calculate debt ratio changes
- Review team performance
- Plan next month's debt reduction

### **Quarterly Debt Audit**
- Comprehensive codebase review
- Update debt categorization
- Strategic planning for debt reduction

---

**Debt Tracker Maintained By:** Technical Lead  
**Next Review:** Weekly (Mondays)  
**Goal:** Reduce critical debt to zero by end of month 