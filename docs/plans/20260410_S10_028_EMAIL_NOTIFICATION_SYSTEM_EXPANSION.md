# [S11-001 / MOB-712] Email Notification System — Architecture Fix & Template Expansion

## Objective
Fix the broken email notification routing architecture and restore all 20+ email templates to full operational status. Standardize lifecycle communication by adding critical missing templates (e.g., `verification-rejected`, `payout-confirmation`, `review-request`).

## Background
A comprehensive audit on 2026-04-10 revealed that **18 of 20** email templates in the `resend-service` Edge Function are completely non-functional. The root cause is an architectural routing failure:

- `ResendEmailService.sendEmail()` hardcodes ALL sends to `POST /api/notifications/booking-confirmation`
- That handler only resolves **2** template IDs (`booking-confirmation` and `owner-booking-notification`)
- The Edge Function (`supabase/functions/resend-service`) has 20 fully-built HTML templates but is **never invoked** from the frontend
- Users currently receive no verification results (rejections), payouts, reviews, or listing updates.

> **Severity:** Critical — the majority of the platform's lifecycle communication is currently "Dead Code."

---

## Scope of Work

### Phase 1: Fix Routing Architecture (Critical)
**Goal:** Repoint all email sends from the broken legacy API to the Supabase Edge Function to unblock the existing 18 unreachable templates.

#### [MODIFY] `src/services/notificationService.ts`
- Replace `fetch('/api/notifications/booking-confirmation', ...)` with `supabase.functions.invoke('resend-service', { body: { to, templateId, dynamicData, subject } })`.
- This restores delivery for: Cancellation, Payment, Verification, Reminders, and Insurance emails.

#### [MODIFY] `src/config/resend-templates.ts`
- Synchronize all template IDs and dynamic data interfaces.

---

### Phase 2: Template Expansion (Add Missing MaaS Logic)
**Goal:** Create HTML templates for the operational gaps identified in both branches.

#### [MODIFY] `supabase/functions/resend-service/index.ts`
Add the following rich HTML templates (matching Mobi Rides branding):
- **`verification-rejected`**: Dynamic `reason` for denial, re-submission link.
- **`payout-confirmation`**: Notification for hosts when funds are released.
- **`review-request`**: Automated post-trip prompt for renter/host reviews.
- **`listing-status-update`**: Approval/rejection notification for new car listings.
- **`booking-modification`**: Alerts for changes to active bookings.
- **`wallet-notification`**: Balance changes, top-ups, and deductions.
- **`early-return-notification`**: Alerts for vehicle returns before the end date.

---

### Phase 3: Wiring & Triggers
**Goal:** Connect the expanded template library to the application flow.

- **Frontend Wiring**: Update `notificationService.ts` to export helper functions for the new templates.
- **Database Automations**: Implement SQL triggers where appropriate (e.g., triggering `verification-rejected` on `user_verifications` status update).
- **Orphaned Templates**: Connect `verification-complete`, `welcome-renter`, and `welcome-host` which currently have HTML but no callers.

---

### Phase 4: Cleanup & Deprecation
**Goal:** Safely remove redundant legacy infrastructure.

- **[DEPRECATE]** `api/notifications/booking-confirmation.js`
- **[DEPRECATE]** `api/resend-templates.js`
- Ensure all calls are successfully transitioned to the Edge Function before deletion.

---

## File Modifications Summary

| File | Action | Phase |
|------|--------|-------|
| `src/services/notificationService.ts` | Repoint `sendEmail()` + Add helpers | Phase 1-3 |
| `src/config/resend-templates.ts` | Sync template definitions | Phase 1 |
| `supabase/functions/resend-service/index.ts` | Add 7+ new HTML templates | Phase 2 |
| `api/notifications/booking-confirmation.js` | Deprecate/Delete | Phase 4 |

## Acceptance Criteria
- [ ] ALL 20+ templates deliver successfully when triggers fire.
- [ ] `verification-rejected` renders with dynamic reasoning context.
- [ ] Edge Function logs confirm 100% of emails route through the consolidated service.
- [ ] No emails route through legacy JS API handlers.

## Notes & Risks
- **Testing:** Use developer email addresses only for verification.
- **Branding:** Re-use the existing header/footer components (`#E2EE0D`) for consistency.
- **Deployment:** Phase 1 must deploy first to avoid breaking current functionality.
