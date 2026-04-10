# Sprint 11 Jira-Style Execution Plan
## MobiRides Application — April 21–27, 2026

**Prepared by:** Modisa Maphanyane  
**Sprint:** Sprint 11  
**Date:** April 10, 2026  
**Status:** PLANNED

---

## 📊 Executive Summary

Sprint 11 is anchored by **BUG-008 / MOB-712** — the critical discovery that **18 of 20 email templates are non-functional** due to an architectural routing failure in the notification service. This is the highest-priority work item. Secondary focus includes Sprint 10 carry-overs that are blocked or incomplete, continued security remediation, and test coverage uplift.

| Epic | Current | Target |
|------|---------|--------|
| Email Notification System Fix (MOB-712) | 0% | 100% |
| Security Hardening (MOB-700) | 25% | 80% |
| DB Pull Fix (BUG-003) | 0% | 100% |
| Admin Settings Service Wiring | 60% | 100% |
| Test Coverage | 62% | 72% |

---

## 👥 Team Assignments

| Owner | Module Focus | Primary Responsibilities |
|-------|-------------|-------------------------|
| **Arnold (Snr Engineer)** | Email system fix + Security | MOB-712 (S11-001 to S11-004), S10 security carry-overs |
| **Duma (Technical Advisor)** | Service wiring + crons | S10 carry-overs (platform_settings, crons, compliance) |
| **Tapologo (Testing & QA Intern)** | Test coverage + BUG-006 | S10-024 (type fixes), test suite carry-overs |
| **Modisa (CEO)** | PRD alignment + sign-offs | Sprint oversight, status reporting, audit verification |

---

## 🎯 Sprint Backlog Summary

| Category | Total Tickets | Arnold | Duma | Tapologo | Modisa |
|----------|:------------:|:------:|:----:|:--------:|:------:|
| Email System Fix (MOB-712) | 4 | 4 | — | — | — |
| Security Carry-over (MOB-700) | 5 | 5 | — | — | — |
| BUG-003 Fix (MOB-801/802) | 2 | 2 | — | — | — |
| Service Wiring Carry-over (S10) | 7 | — | 7 | — | — |
| Type Alignment Fix (BUG-006) | 1 | — | — | 1 | — |
| Test Coverage Carry-over (S10) | 5 | — | — | 5 | — |
| Sprint Sign-off & Reporting | 1 | — | — | — | 1 |
| **TOTAL** | **25** | **11** | **7** | **6** | **1** |

---

## 📋 Module 1: Email Notification System Fix — P0 (Arnold)

> [!CAUTION]
> This is the sprint's highest priority. 18/20 email templates are non-functional due to an architectural routing failure. Users receive no cancellation, payment, verification, welcome, reminder, insurance, or wallet emails.

### S11-001 — MOB-712 Phase 1: Fix Email Routing Architecture

| Field | Value |
|-------|-------|
| **Ticket** | S11-001 / MOB-712 |
| **Owner** | Arnold |
| **Priority** | P0 — Day 1 |
| **Ref** | `docs/plans/20260410_S10_028_EMAIL_NOTIFICATION_SYSTEM_EXPANSION.md` |
| **Summary** | Repoint `ResendEmailService.sendEmail()` from the broken `/api/notifications/booking-confirmation` route to the Supabase Edge Function (`resend-service`) |

**Tasks:**
- [ ] Modify `src/services/notificationService.ts` — replace `fetch('/api/notifications/booking-confirmation')` with `supabase.functions.invoke('resend-service', { body: { to, templateId, dynamicData, subject } })`
- [ ] Verify all 13 previously "dead — route mismatch" templates now resolve correctly
- [ ] Update `src/config/resend-templates.ts` — add missing keys (`verification_rejected`, `wallet_notification`, `early_return_notification`), mark `password_reset` and `email_confirmation` as Supabase Auth-managed

**Acceptance Criteria:** All 20 existing templates return 200 when invoked via the Edge Function. Edge Function logs confirm successful Resend API calls for at least 5 different template IDs.

---

### S11-002 — MOB-712 Phase 2: Add Missing HTML Templates

| Field | Value |
|-------|-------|
| **Ticket** | S11-002 / MOB-712 |
| **Owner** | Arnold |
| **Priority** | P0 — Day 1–2 |
| **Summary** | Create HTML templates for 3 template IDs that are referenced in code but have no HTML definition in the Edge Function |

**Tasks:**
- [ ] Add `verification-rejected` template to `EMAIL_TEMPLATES` in `resend-service/index.ts` — include dynamic `reason` field, re-submission instructions, support contact link
- [ ] Add `wallet-notification` template — generic wallet event (topup/deduction/payment received) with dynamic `type`, `amount`, `description` fields
- [ ] Add `early-return-notification` template — includes dynamic booking reference, car details, actual vs. original return dates
- [ ] All templates must use existing MobiRides branding (`#E2EE0D` accents, gradient headers, standard footer)

**Acceptance Criteria:** Calling the Edge Function with each new template ID returns rendered HTML with correct dynamic data substitution.

---

### S11-003 — MOB-712 Phase 3: Wire Up Uncalled Templates

| Field | Value |
|-------|-------|
| **Ticket** | S11-003 / MOB-712 |
| **Owner** | Arnold |
| **Priority** | P1 — Day 2–3 |
| **Summary** | Connect the 3 templates that have full HTML but zero callers: `verification-complete`, `welcome-renter`, `welcome-host` |

**Tasks:**
- [ ] Wire `verification-complete` into the admin verification approval flow (where `user_verifications.status` is set to `approved`)
- [ ] Wire `verification-rejected` into the admin verification rejection flow
- [ ] Wire `welcome-renter` into the signup flow for users with `role = 'renter'`
- [ ] Wire `welcome-host` into the host registration flow (first car listing or role switch to host)
- [ ] Verify all 4 emails fire correctly in staging with developer test addresses

**Acceptance Criteria:** New user signup triggers welcome email. Admin verification approve/reject triggers appropriate email. All deliveries confirmed in Resend dashboard.

---

### S11-004 — MOB-712 Phase 4: Cleanup & Deprecation

| Field | Value |
|-------|-------|
| **Ticket** | S11-004 / MOB-712 |
| **Owner** | Arnold |
| **Priority** | P2 — Day 4 |
| **Summary** | Remove deprecated routing code now that all emails route through the Edge Function |

**Tasks:**
- [ ] Deprecate `api/notifications/booking-confirmation.js` (add deprecation notice, then delete)
- [ ] Deprecate `api/resend-templates.js` (duplicate of Edge Function templates)
- [ ] Verify no remaining code references the old `/api/notifications/booking-confirmation` endpoint
- [ ] Update `notificationService.ts` to remove any legacy comments referencing the old route

**Acceptance Criteria:** No code references the deprecated API route. `booking-confirmation` and `owner-booking-notification` emails continue to work through the Edge Function route.

---

## 📋 Module 2: Security Remediation Carry-over — P1 (Arnold)

> Carried over from Sprint 10. See Sprint 10 plan for full ticket details.

| Ticket | Summary | Carry-over From |
|--------|---------|-----------------|
| S11-005 | MOB-801: Drop old enum-dependent function overloads | S10-001 |
| S11-006 | MOB-802: Remove redundant enum block | S10-002 |
| S11-007 | MOB-702: Auth-gate admin creation endpoint | S10-004 |
| S11-008 | MOB-703: Notifications RLS policies | S10-005 |
| S11-009 | MOB-704: Financial tables RLS policies | S10-006 |
| S11-010 | MOB-705: Edge function input validation | S10-007 |
| S11-011 | MOB-706: search_path fixes | S10-008 |

---

## 📋 Module 3: Service Wiring & Compliance — P1 (Duma)

> Carried over from Sprint 10. See Sprint 10 plan for full ticket details.

| Ticket | Summary | Carry-over From |
|--------|---------|-----------------|
| S11-012 | Commission → platform_settings | S10-009 |
| S11-013 | Dynamic pricing → DB | S10-010 |
| S11-014 | Insurance fee → platform_settings | S10-011 |
| S11-015 | delete-user-with-transfer refactor | S10-012 |
| S11-016 | Consent on signup | S10-013 |
| S11-017 | Rental-reminder cron | S10-014 |
| S11-018 | Return-reminder cron | S10-015 |

---

## 📋 Module 4: Test Coverage & QA — P1 (Tapologo)

> Carried over from Sprint 10. See Sprint 10 plan for full ticket details.

| Ticket | Summary | Carry-over From |
|--------|---------|-----------------|
| S11-019 | BUG-006: Fix Supabase `RejectExcessProperties` build errors | S10-024 |
| S11-020 | Handover lifecycle tests | S10-016 |
| S11-021 | Insurance claim tests | S10-017 |
| S11-022 | Admin portal tests | S10-018 |
| S11-023 | Booking extension tests | S10-019 |
| S11-024 | Android gradle verification | S10-020 |

---

## 📋 Module 5: Sprint Oversight (Modisa)

### S11-025 — Sprint Sign-off & Reporting

| Field | Value |
|-------|-------|
| **Ticket** | S11-025 |
| **Owner** | Modisa |
| **Priority** | P2 — End of Sprint |
| **Summary** | Verify all deliverables, update status reports, confirm email system operational |

---

## 📅 Suggested Day-by-Day Schedule

| Day | Arnold | Duma | Tapologo | Modisa |
|-----|--------|------|----------|--------|
| Mon Apr 21 | S11-001 (routing fix) | S11-012 (commission) | S11-019 (BUG-006 type fixes) | Sprint kickoff |
| Tue Apr 22 | S11-002 (missing templates) | S11-013 (pricing) | S11-020 (handover tests) | Review PRs |
| Wed Apr 23 | S11-003 (wire callers) | S11-014 (insurance), S11-015 (delete) | S11-021 (insurance tests) | Review PRs |
| Thu Apr 24 | S11-004 (cleanup), S11-005/006 (BUG-003) | S11-016 (consent), S11-017 (rental cron) | S11-022, S11-023 (admin + booking tests) | Email system verification |
| Fri Apr 25 | S11-007–S11-011 (security) | S11-018 (return cron) | S11-024 (Android CI) | S11-025 (sign-off) |

---

## 📊 Sprint 11 Completion Status

| Task ID | Member | Status | Notes |
|---------|--------|--------|-------|
| S11-001 | Arnold | ❌ Not Started | MOB-712 Phase 1: Fix email routing architecture |
| S11-002 | Arnold | ❌ Not Started | MOB-712 Phase 2: Add 3 missing HTML templates |
| S11-003 | Arnold | ❌ Not Started | MOB-712 Phase 3: Wire callers for verification + welcome emails |
| S11-004 | Arnold | ❌ Not Started | MOB-712 Phase 4: Deprecate old API route |
| S11-005 | Arnold | ❌ Not Started | MOB-801: Drop enum-dependent functions (carry-over S10-001) |
| S11-006 | Arnold | ❌ Not Started | MOB-802: Remove redundant enum block (carry-over S10-002) |
| S11-007 | Arnold | ❌ Not Started | MOB-702: Auth-gate add-admin (carry-over S10-004) |
| S11-008 | Arnold | ❌ Not Started | MOB-703: Notifications RLS (carry-over S10-005) |
| S11-009 | Arnold | ❌ Not Started | MOB-704: Financial tables RLS (carry-over S10-006) |
| S11-010 | Arnold | ❌ Not Started | MOB-705: Edge function validation (carry-over S10-007) |
| S11-011 | Arnold | ❌ Not Started | MOB-706: search_path fixes (carry-over S10-008) |
| S11-012 | Duma | ❌ Not Started | Commission → platform_settings (carry-over S10-009) |
| S11-013 | Duma | ❌ Not Started | Dynamic pricing → DB (carry-over S10-010) |
| S11-014 | Duma | ❌ Not Started | Insurance fee → platform_settings (carry-over S10-011) |
| S11-015 | Duma | ❌ Not Started | delete-user-with-transfer refactor (carry-over S10-012) |
| S11-016 | Duma | ❌ Not Started | Consent on signup (carry-over S10-013) |
| S11-017 | Duma | ❌ Not Started | Rental-reminder cron (carry-over S10-014) |
| S11-018 | Duma | ❌ Not Started | Return-reminder cron (carry-over S10-015) |
| S11-019 | Tapologo | ❌ Not Started | BUG-006: Fix RejectExcessProperties build errors (carry-over S10-024) |
| S11-020 | Tapologo | ❌ Not Started | Handover lifecycle tests (carry-over S10-016) |
| S11-021 | Tapologo | ❌ Not Started | Insurance claim tests (carry-over S10-017) |
| S11-022 | Tapologo | ❌ Not Started | Admin portal tests (carry-over S10-018) |
| S11-023 | Tapologo | ❌ Not Started | Booking extension tests (carry-over S10-019) |
| S11-024 | Tapologo | ❌ Not Started | Android gradle verification (carry-over S10-020) |
| S11-025 | Modisa | ❌ Not Started | Sprint sign-off + reporting |

### Summary

| Member | Completed | In Progress | Not Started | Total |
|--------|-----------|-------------|-------------|-------|
| Arnold | 0 | 0 | 11 | 11 |
| Duma | 0 | 0 | 7 | 7 |
| Tapologo | 0 | 0 | 6 | 6 |
| Modisa | 0 | 0 | 1 | 1 |
| **TOTAL** | **0** | **0** | **25** | **25** |

---

*Signed off by: Modisa Maphanyane*
