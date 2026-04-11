# Email & Push Notification System Enhancement Plan

**Date:** March 24, 2026  
**Status:** Draft  
**Priority:** High  
**Epic:** MOB-800 (Notification System Enhancement)  
**Reference:** Week 4 Status Report + Resend Template Gap Analysis

---

## 🎯 Executive Summary

The current notification system has ~45% template coverage (9 of 20 intended templates). This plan outlines implementation of missing email and push notifications to achieve full coverage and improve user engagement across booking, payment, verification, messaging, and promotional flows.

---

## 📊 Current State Analysis

### Existing Templates (Implemented)

| Template ID | Type | Location |
|-------------|------|----------|
| `welcome-renter` | Email | Resend Service ✅ |
| `welcome-host` | Email | Resend Service ✅ |
| `password-reset` | Email | Resend Service ✅ |
| `booking-confirmation` | Email | Resend Service ✅ |
| `owner-booking-notification` | Email | Resend Service ✅ |
| `insurance-policy-confirmation` | Email | Resend Service ✅ |
| `insurance-claim-received` | Email | Resend Service ✅ |
| `insurance-claim-update` | Email | Resend Service ✅ |
| `insurance-host-claim-notification` | Email | Resend Service ✅ |
| `booking` | Push | PushNotificationService ✅ |
| `message` | Push | PushNotificationService ✅ |

### Missing Templates (11 Email + Features)

| # | Template | Config Key | Trigger | Priority |
|---|----------|------------|---------|----------|
| 1 | Booking Cancelled | `booking_cancelled` | Booking status → cancelled | P0 |
| 2 | Payment Received | `payment_received` | Payment webhook success | P0 |
| 3 | Payment Failed | `payment_failed` | Payment webhook failure | P0 |
| 4 | Wallet Top-up | `wallet_topup` | Wallet transaction insert | P1 |
| 5 | Handover Ready | `handover_ready` | Handover session created | P1 |
| 6 | Rental Reminder | `rental_reminder` | Cron: 24h before start_date | P1 |
| 7 | Return Reminder | `return_reminder` | Cron: 4h before end_date | P1 |
| 8 | Verification Complete | `verification_complete` | Verification approved | P2 |
| 9 | Email Confirmation | `email_confirmation` | User signup | P2 |
| 10 | System Notification | `system_notification` | Admin triggered | P3 |
| 11 | Unverified Reminder | *(new)* | Cron: 7 days post-signup | P2 |

---

## 🎯 Goals & Success Criteria

- **Goal 1:** Implement all 11 missing email templates in Resend service
- **Goal 2:** Add scheduled notification cron jobs for reminders
- **Goal 3:** Implement new notification types (listing alerts, messages, promos, app updates)
- **Goal 4:** Achieve 100% template coverage (20/20)

**Success Metrics:**
- Template coverage: 45% → 100%
- Email delivery rate > 95%
- Push notification click-through rate > 20%

---

## 📋 Implementation Phases

### Phase 0: Foundation (Quick Wins)

**Tasks:**
- [ ] Add remaining booking status templates to Resend service
- [ ] Add payment status templates
- [ ] Test email delivery for all new templates

**Dependencies:** None  
**Estimate:** 2 hours  
**Owner:** Arnold

---

### Phase 1: Core Notifications (P0-P1)

#### Task 1: Booking Status Emails (MOB-801)

**Description:** Send emails when booking status changes

**Subtasks:**
- [ ] MOB-801.1: Add `booking-cancelled` template to Resend service
- [ ] MOB-801.2: Add trigger in `bookingLifecycle.ts` to send on cancellation
- [ ] MOB-801.3: Add `booking-completed` template (renter + host)
- [ ] MOB-801.4: Add trigger for booking completion (post-return)

**Reference:** [`src/services/bookingLifecycle.ts`](src/services/bookingLifecycle.ts)  
**Estimate:** 3 hours

---

#### Task 2: Payment Emails (MOB-802)

**Description:** Send emails for payment events

**Subtasks:**
- [ ] MOB-802.1: Add `payment-received` template
- [ ] MOB-802.2: Add `payment-failed` template
- [ ] MOB-802.3: Add webhook handler in payment edge function
- [ ] MOB-802.4: Add `wallet-topup` template

**Reference:** [`src/components/dashboard/TopUpModal.tsx`](src/components/dashboard/TopUpModal.tsx)  
**Estimate:** 4 hours

---

#### Task 3: Handover Notifications (MOB-803)

**Description:** Send emails for handover events

**Subtasks:**
- [ ] MOB-803.1: Add `handover-ready` template
- [ ] MOB-803.2: Add trigger in handover service
- [ ] MOB-803.3: Add `handover-complete` (pickup + return) templates

**Reference:** [`src/services/handoverService.ts`](src/services/handoverService.ts)  
**Estimate:** 3 hours

---

### Phase 2: Scheduled Notifications (P1)

#### Task 4: Rental & Return Reminders (MOB-804)

**Description:** Implement cron jobs for scheduled reminders

**Subtasks:**
- [ ] MOB-804.1: Create pg_cron job for `rental_reminder` (24h before)
- [ ] MOB-804.2: Create pg_cron job for `return_reminder` (4h before)
- [ ] MOB-804.3: Add edge function to query and send reminders
- [ ] MOB-804.4: Test cron execution

**Database:** `supabase/migrations/`  
**Estimate:** 4 hours

---

#### Task 5: Verification Follow-up (MOB-805)

**Description:** Send reminders for unverified users

**Subtasks:**
- [ ] MOB-805.1: Create pg_cron job for `verification_reminder` (7 days post-signup)
- [ ] MOB-805.2: Add edge function to query unverified users
- [ ] MOB-805.3: Add verification email template
- [ ] MOB-805.4: Add admin toggle for reminder frequency

**Reference:** [`src/services/verificationService.ts`](src/services/verificationService.ts)  
**Estimate:** 3 hours

---

### Phase 3: Engagement Features (P2-P3)

#### Task 6: Listing Alerts (MOB-806)

**Description:** Notify renters of new cars in their area

**Subtasks:**
- [ ] MOB-806.1: Add `new_listing_alert` template
- [ ] MOB-806.2: Add trigger on `cars` table insert
- [ ] MOB-806.3: Add location matching logic
- [ ] MOB-806.4: Add user preference for alert frequency

**Database:** `supabase/migrations/`  
**Estimate:** 5 hours

---

#### Task 7: Message Notifications (MOB-807)

**Description:** Email notifications for inbox messages

**Subtasks:**
- [ ] MOB-807.1: Add `new_message` email template
- [ ] MOB-807.2: Add trigger in messaging service
- [ ] MOB-807.3: Add batch option for high-volume senders

**Reference:** [`src/services/completeNotificationService.ts`](src/services/completeNotificationService.ts)  
**Estimate:** 2 hours

---

#### Task 8: Promocode Notifications (MOB-808)

**Description:** Notify admins/users of promo code events

**Subtasks:**
- [ ] MOB-808.1: Add `promocode_generated` template
- [ ] MOB-808.2: Add trigger on `promo_codes` insert (admin)
- [ ] MOB-808.3: Add `promocode_used` template (optional)

**Reference:** [`src/services/promoCodeService.ts`](src/services/promoCodeService.ts)  
**Estimate:** 2 hours

---

#### Task 9: App Update Notifications (MOB-809)

**Description:** Notify users of app updates

**Subtasks:**
- [ ] MOB-809.1: Add `app_update` template
- [ ] MOB-809.2: Create admin trigger in settings table
- [ ] MOB-809.3: Add push + email dual delivery

**Estimate:** 2 hours

---

### Phase 4: System Improvements (P3)

#### Task 10: Email Confirmation (MOB-810)

**Description:** Implement email verification flow

**Subtasks:**
- [ ] MOB-810.1: Add `email_confirmation` template
- [ ] MOB-810.2: Update signup flow to send confirmation
- [ ] MOB-810.3: Add resend confirmation option

**Reference:** [`api/auth/signup.js`](api/auth/signup.js)  
**Estimate:** 3 hours

---

#### Task 11: System Notifications (MOB-811)

**Description:** Admin-triggered system-wide notifications

**Subtasks:**
- [ ] MOB-811.1: Add `system_notification` template
- [ ] MOB-811.2: Create admin UI for sending bulk notifications
- [ ] MOB-811.3: Add rate limiting

**Estimate:** 4 hours

---

## 🔗 Related Documentation

- Resend Service: [`supabase/functions/resend-service/index.ts`](supabase/functions/resend-service/index.ts)
- Template Config: [`src/config/resend-templates.ts`](src/config/resend-templates.ts)
- Push Notification Service: [`src/services/pushNotificationService.ts`](src/services/pushNotificationService.ts)
- Booking Lifecycle: [`src/services/bookingLifecycle.ts`](src/services/bookingLifecycle.ts)
- Handover Service: [`src/services/handoverService.ts`](src/services/handoverService.ts)
- Week 4 Status: [`WEEK_4_MARCH_2026_STATUS_REPORT.md`](docs/Product Status/WEEK_4_MARCH_2026_STATUS_REPORT.md)

---

## 📅 Timeline

| Phase | Tasks | Estimate | Sprint |
|-------|-------|----------|--------|
| Phase 0 | Foundation | 2h | Sprint 8 |
| Phase 1 | Core Notifications | 10h | Sprint 8 |
| Phase 2 | Scheduled | 7h | Sprint 9 |
| Phase 3 | Engagement | 11h | Sprint 9 |
| Phase 4 | System | 7h | Sprint 10 |

**Total Estimate:** ~37 hours across 3 sprints

---

## ✅ Definition of Done

- [ ] All 20 templates defined in config have corresponding implementation
- [ ] Email delivery tested for all templates
- [ ] Cron jobs executing without errors
- [ ] Admin UI for bulk notifications functional
- [ ] Documentation updated
- [ ] Week 4 report references this plan
