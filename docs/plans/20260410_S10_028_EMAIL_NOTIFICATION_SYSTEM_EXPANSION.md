# [S11-001 / MOB-712] Email Notification System — Architecture Fix & Template Expansion

## Objective
Fix the broken email notification routing architecture and restore all 20 email templates to full operational status. Add missing lifecycle templates (`verification-rejected`, `wallet-notification`, `early-return-notification`).

## Background
A comprehensive audit on 2026-04-10 revealed that **18 of 20** email templates in the `resend-service` Edge Function are completely non-functional. The root cause is an architectural routing failure:

- `ResendEmailService.sendEmail()` hardcodes ALL sends to `POST /api/notifications/booking-confirmation`
- That handler only resolves **2** template IDs (`booking-confirmation` and `owner-booking-notification`)
- The Edge Function (`supabase/functions/resend-service`) has 20 fully-built HTML templates but is **never invoked** from the frontend
- 3 template IDs are referenced in code but have no corresponding HTML template
- 3 templates (`verification-complete`, `welcome-renter`, `welcome-host`) have zero callers

> **Severity:** Critical — users receive no cancellation, payment, verification, welcome, reminder, insurance, or wallet emails

## Scope of Work

### Phase 1: Fix Routing Architecture (Critical)
**Goal:** Repoint all email sends from the broken `/api/notifications/booking-confirmation` route to the Supabase Edge Function.

#### [MODIFY] `src/services/notificationService.ts`
- Replace `fetch('/api/notifications/booking-confirmation', ...)` with `supabase.functions.invoke('resend-service', { body: { to, templateId, dynamicData, subject } })`
- This single change will restore all 13 "dead — route mismatch" templates to operational status
- Preserve the `ResendEmailService` singleton pattern and public API

#### [MODIFY] `src/config/resend-templates.ts`
- Add missing template keys: `verification-rejected`, `wallet-notification`, `early-return-notification`
- Remove orphaned keys (`password_reset`, `email_confirmation`) or mark them as Supabase Auth-managed

---

### Phase 2: Add Missing Templates in Edge Function
**Goal:** Create HTML templates for template IDs that are referenced in code but have no HTML definition.

#### [MODIFY] `supabase/functions/resend-service/index.ts`
Add new templates to `EMAIL_TEMPLATES`:
- `verification-rejected` — Explains why verification was denied, with re-submission instructions and support contact. Includes dynamic `reason` field.
- `wallet-notification` — Generic wallet event email (topup, deduction, payment received). Called by `wallet/notificationService.ts:42`.
- `early-return-notification` — Sent when a renter returns a vehicle before the scheduled end date. Called by `notificationService.ts:513`.

---

### Phase 3: Wire Up Uncalled Templates
**Goal:** Connect the 3 templates that have full HTML but zero callers.

#### `verification-complete`
- Wire into admin verification approval flow (wherever the admin sets `user_verifications.status = 'approved'`)
- Likely in an admin action handler or a database trigger

#### `welcome-renter`
- Wire into the signup flow or `onAuthStateChange` for new users with `role = 'renter'`
- Could also be triggered via a Supabase Auth hook or database trigger on `profiles` insert

#### `welcome-host`
- Wire into the host registration flow when a user first lists a vehicle or toggles to host mode
- Trigger on `profiles` role change or first car listing

---

### Phase 4: Cleanup & Consolidation
**Goal:** Remove dead code and duplicate template systems.

#### [DELETE or DEPRECATE] `api/notifications/booking-confirmation.js`
- Once Phase 1 is complete, this handler is redundant — all emails route through the Edge Function
- Can be deprecated immediately and removed after verification

#### [DELETE or DEPRECATE] `api/resend-templates.js`
- Duplicate template definitions that are no longer needed once the Edge Function handles all templates

---

## File Modifications Summary

| File | Action | Phase |
|------|--------|-------|
| `src/services/notificationService.ts` | Repoint `sendEmail()` to Edge Function | Phase 1 |
| `src/config/resend-templates.ts` | Add missing keys, cleanup orphaned keys | Phase 1 |
| `supabase/functions/resend-service/index.ts` | Add 3 missing HTML templates | Phase 2 |
| Admin verification flow (TBD) | Wire `verification-complete` caller | Phase 3 |
| Signup/Auth flow (TBD) | Wire `welcome-renter` caller | Phase 3 |
| Host registration flow (TBD) | Wire `welcome-host` caller | Phase 3 |
| `api/notifications/booking-confirmation.js` | Deprecate/Delete | Phase 4 |
| `api/resend-templates.js` | Deprecate/Delete | Phase 4 |

## Acceptance Criteria
- [ ] ALL 20 existing email templates deliver successfully when their trigger conditions are met
- [ ] 3 new templates (`verification-rejected`, `wallet-notification`, `early-return-notification`) render correctly with dynamic data
- [ ] `verification-complete`, `welcome-renter`, `welcome-host` have active trigger paths
- [ ] No emails route through `api/notifications/booking-confirmation.js`
- [ ] Edge Function logs show successful email sends for at least 5 different template IDs

## Verification Plan

### Automated Testing
- Invoke `supabase.functions.invoke('resend-service', ...)` directly with each of the 23 template IDs and verify 200 response
- Confirm the Edge Function logs show successful Resend API calls

### Manual Verification
- Trigger a booking confirmation, cancellation, and verification approval in staging
- Verify actual email delivery to a test inbox for each
- Confirm welcome emails fire on new user signup

## Notes & Risks
- **Testing safety:** All testing must use developer email addresses — do not send to real users during verification
- **Deployment order:** Phase 1 must deploy before Phase 4 (deprecation) — simultaneous deployment would break the 2 templates that currently work
- **Branding consistency:** New templates must use the existing MobiRides branding (`#E2EE0D` accents, gradient headers, standard footer)
- **Supabase Auth emails:** `password-reset` and `email-confirmation` are handled by Supabase Auth natively — do NOT attempt to send duplicates via Resend
