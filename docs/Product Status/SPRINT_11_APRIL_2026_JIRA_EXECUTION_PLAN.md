# Sprint 11 Jira-Style Execution Plan
## MobiRides Application — April 13–20, 2026

**Prepared by:** Modisa Maphanyane  
**Sprint:** Sprint 11  
**Date:** April 10, 2026  
**Status:** ✅ COMPLETE

---

## 📊 Executive Summary

Sprint 11 is anchored by **BUG-008 / MOB-712** — the critical discovery that **18 of 20 email templates are non-functional** due to an architectural routing failure in the notification service. This is the highest-priority work item. Secondary focus includes Sprint 10 carry-overs that are blocked or incomplete, continued security remediation, and test coverage uplift.

| Epic | Current | Target |
|------|---------|--------|
| Email Notification System Fix (MOB-712) | 0% | 100% |
| Security Hardening (MOB-700) | 25% | 80% |
| DB Pull Fix (BUG-003) | 0% | 100% |
| Admin Settings Service Wiring | 60% | 100% |
| Auth Compliance P3 (MOB-614/615) | 85% | 100% |
| Anonymize-on-Delete (MOB-110) | 40% | 70% |
| Test Coverage | 62% | 72% |

---

## 🏛️ Past Sprint Reviews

| Sprint | Date | Focus | Review Link |
|--------|------|-------|-------------|
| Sprint 8 | Mar 24-31 | Bugfixes & Payment P0 | [View Review](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/docs/Product%20Status/SPRINT_8_MARCH_2026_JIRA_EXECUTION_PLAN.md#%F0%9F%8F%81-sprint-review) |
| Sprint 9 | Mar 30 - Apr 5 | Infrastructure & Compliance | [View Review](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/docs/Product%20Status/SPRINT_9_APRIL_2026_JIRA_EXECUTION_PLAN.md#%F0%9F%8F%81-sprint-review) |
| Sprint 10 | Apr 6-12 | Security & Standardization | [View Review](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/docs/Product%20Status/SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md#%F0%9F%8F%81-sprint-review) |


---

## 👥 Team Assignments

| Owner | Module Focus | Primary Responsibilities |
|-------|-------------|-------------------------|
| **Arnold (Snr Engineer)** | Email system fix + Security | MOB-712 (S11-001 to S11-004), S10 security carry-overs, MOB-13 (Native Integration) |
| **Modisa (CEO)** | Service wiring, crons, PRD alignment, sign-offs | S10 carry-overs (platform_settings, crons), sprint oversight, status reporting |

---

## 🎯 Sprint Backlog Summary

| Category | Total Tickets | Arnold | Tapologo | Modisa |
|----------|:------------:|:------:|:--------:|:------:|
| Email System Fix (MOB-712) | 4 | 4 | — | — |
| Security Carry-over (MOB-700) | 5 | 5 | — | — |
| BUG-003 Fix (MOB-801/802) | 2 | 2 | — | — |
| Service Wiring Carry-over (S10) | 7 | — | — | 7 |
| Type Alignment Fix (BUG-006) | 1 | — | 1 | — |
| Test Coverage Carry-over (S10) | 5 | — | 5 | — |
| Sprint Sign-off & Reporting | 1 | — | — | 1 |
| Partner Onboarding Strategy (S11-028) | 1 | — | — | 1 |
| Beta & Investor Prep (S11-026/027) | 2 | — | — | 2 |
| PRD Audit (S11-029) | 1 | — | — | 1 |
| **Google Native Integration (S11-031)** | 1 | 1 | — | — |
| **TOTAL** | **31** | **12** | **6** | **12** |

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

## 📋 Module 3: Service Wiring & Compliance — P1 (Modisa)

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
| S11-028 | Partner Onboarding: Dumba Rentals / Trillo rentals traction metrics | — |

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
| **Status** | ✅ COMPLETE (April 17, 2026) |
| **Progress** | 37/38 Tasks Verified (97%) |
| **Velocity** | 102 Story Points |
| **Summary** | Weekly oversight, PR review, and generation of Week 4 April status report |

---

### S11-026 — Beta Launch Program (Prep)

| Field | Value |
|-------|-------|
| **Ticket** | S11-026 |
| **Owner** | Modisa |
| **Priority** | P1 |
| **Summary** | Define criteria for the 50-user Beta pilot and map Gaborone operational boundaries |

---

### S11-027 — Pre-Seed Funding Prep

| Field | Value |
|-------|-------|
| **Ticket** | S11-027 |
| **Owner** | Modisa |
| **Priority** | P1 |
| **Summary** | Update investor pitch materials with latest traction metrics (247 users / 76 vehicles) |

---

### S11-028 — Partner Onboarding Strategy

| Field | Value |
|-------|-------|
| **Ticket** | S11-028 |
| **Owner** | Modisa |
| **Priority** | P2 |
| **Summary** | Finalize the Fleet Partner onboarding flow for Dumba Rentals integration |

---

### S11-029 — PRD Audit: Onboarding & Consent

| Field | Value |
|-------|-------|
| **Ticket** | S11-029 |
| **Owner** | Modisa |
| **Priority** | P1 |
| **Summary** | Verify that S11-016 (Consent recording) aligns with the Auth Compliance PRD |

---

### S11-028 — Partner Onboarding Traction Metrics

| Field | Value |
|-------|-------|
| **Ticket** | S11-028 |
| **Owner** | Modisa |
| **Priority** | P1 — Day 1 |
| **Summary** | Check "Dumba Rentals or Trillo rentals" traction metrics against current analytics |

---

## 📅 Suggested Day-by-Day Schedule

| Day | Arnold | Tapologo | Modisa |
|-----|--------|----------|--------|
| Mon Apr 13 | S11-001 (routing fix) | S11-019 (BUG-006 type fixes) | S11-012, S11-028, Sprint kickoff |
| Tue Apr 14 | S11-002 (missing templates) | S11-020 (handover tests) | S11-013, S11-026, Review PRs |
| Wed Apr 15 | S11-003 (wire callers) | S11-021 (insurance tests) | S11-014, S11-015, S11-027 |
| Thu Apr 16 | S11-004 (cleanup), S11-005/006 (BUG-003) | S11-022, S11-023 (admin + booking tests) | S11-016, S11-017, S11-029 |
| Fri Apr 17 | S11-007–S11-011 (security) | S11-024 (Android CI) | S11-018, S11-025 (sign-off) |

---

## 📊 Sprint 11 Completion Status

| Task ID | Member | Status | Notes |
|---------|--------|--------|-------|
| S11-001 | Arnold | ✅ Done | MOB-712 Phase 1: [Joint Work: Arnold+Modisa] Fix email routing |
| S11-002 | Arnold | ✅ Done | MOB-712 Phase 2: [Joint Work: Arnold+Modisa] Add 3 missing HTML templates |
| S11-003 | Arnold | ✅ Done | MOB-712 Phase 3: [Joint Work: Arnold+Modisa] Wire callers |
| S11-004 | Arnold | ✅ Done | MOB-712 Phase 4: Deprecate old API route (Audit: Verified done) |
| S11-005 | Arnold | ✅ Done | MOB-801: Drop enum-dependent functions (Carry-over S10-001) |
| S11-006 | Arnold | ✅ Done | MOB-802: Remove redundant enum block (Carry-over S10-002) |
| S11-007 | Arnold | ✅ Done | MOB-702: Auth-gate add-admin (Carry-over S10-004) |
| S11-008 | Arnold | ✅ Done | MOB-703: Notifications RLS (Carry-over S10-005) |
| S11-009 | Arnold | ✅ Done | MOB-704: Financial tables RLS (Carry-over S10-006) |
| S11-010 | Modisa | ✅ Done | MOB-705: Edge function validation (Linear: Done by Modisa) |
| S11-011 | Arnold | ✅ Done | MOB-706/MOB-15: search_path fixes — Codebase verified |
| S11-012 | Modisa | ✅ Done | Commission → platform_settings (Carry-over S10-009) |
| S11-013 | Modisa | ✅ Done | Dynamic pricing → DB (Carry-over S10-010) |
| S11-014 | Modisa | ✅ Done | Insurance fee → platform_settings (Carry-over S10-011) |
| S11-015 | Modisa | ✅ Done | delete-user-with-transfer refactor (Carry-over S10-012) |
| S11-016 | Modisa | ✅ Done | Consent on signup (Carry-over S10-013) |
| S11-017 | Modisa | ✅ Done | Rental-reminder cron (Carry-over S10-014) |
| S11-018 | Modisa | ✅ Done | Return-reminder cron (Carry-over S10-015) |
| S11-019 | Tapologo | ✅ Done | BUG-006: (MOB-16) Fix build errors (Linear: Done) |
| S11-020 | Tapologo | ✅ Done | (MOB-39) Handover lifecycle tests (Linear: Done) |
| S11-021 | Tapologo | ✅ Done | (MOB-40) Insurance claim tests (Linear: Done) |
| S11-022 | Tapologo | ✅ Done | (MOB-41) Admin portal tests (Linear: Done) |
| S11-023 | Tapologo | ✅ Done | (MOB-42) Booking extension tests (Linear: Done) |
| S11-024 | Modisa | ✅ Done | (MOB-12) Android gradle verification (Verified manually + script added) |
| S11-025 | Modisa | ✅ Done | Sprint sign-off + reporting |
| S11-026 | Modisa | ✅ Done | Beta pilot preparation |
| S11-027 | Modisa | ✅ Done | Pre-seed funding materials |
| S11-028 | Modisa | ✅ Done | Partner onboarding: Traction metrics |
| S11-029 | Modisa | ✅ Done | PRD Audit: Onboarding & Consent |
| S11-030 | Modisa | ✅ Done | MOB-811: Admin bulk notification broadcast UI (Linear: Done) |
| S11-031 | Modisa | 🔵 Backlog | MOB-13: Google Native Integration (Added 2026-04-17) |

### 🚩 Flagged for Review (Linear Discrepancies)

- **Owner Mismatch (S11-010)**: Document lists Arnold, Linear shows Modisa (Status: Done).
- **Owner Mismatch (S11-024)**: Document lists Tapologo, Linear shows Modisa (Status: In Progress).
- **In Review Tasks**: None (MOB-21 and MOB-15 verified Done).
- **Untracked Done Tasks**: 
    - **By Tapologo**: 
        - **MOB-14**: Return Handover Status Edge Cases
        - **MOB-34**: Admin Portal Detailed Views
        - **MOB-36**: Anonymize-on-Delete
        - **MOB-13**: Chat Hub Read Receipts
        - **MOB-17**: Revenue Analytics
    - **By Arnold**:
        - **MOB-21**: Missing SuperAdmin RPCs (Suspend/Ban)

### Summary

| Member | Completed | In Progress | Not Started / Reverted | Total |
|--------|-----------|-------------|-------------------------|-------|
| Arnold | 11 | 0 | 1 | 12 |
| Tapologo | 10 | 0 | 0 | 10 |
| Modisa | 15 | 0 | 1 | 16 |
| **TOTAL** | **36** | **0** | **2** | **38** |

---

## 🏁 Sprint Review (April 17, 2026)

### 📈 Final Metrics
- **Completion Rate**: 97% (37 of 38 tasks verified).
- **Major Blockers Resolved**: 3 (Email routing failure, Gradle lockups, search_path security vulnerabilities).
- **Carry-overs**: 1 (Google Native Integration - deferred).

### 🏆 Key Technical Achievements

#### 1. Notification Infrastructure Recovery (Arnold + Modisa)
Successfully repointed the entire notification architecture to Supabase Edge Functions.
- **Outcome**: Restored 18/20 non-functional email templates.
- **Evidence**: Verified working flows for verification approval, welcome emails, and wallet notifications.
- **Security**: Added Zod schema validation to all notification Edge Functions.

#### 2. SQL Security & Hardening (Arnold)
Completed a full audit of the database function layer.
- **Enforcement**: Applied `SET search_path = public` to all `SECURITY DEFINER` functions to prevent search-path hijacking.
- **Access Control**: Hardened the `add_admin` flow and verified RLS policies on financial logs.
- **Sanitization**: Removed legacy hardcoded service-role secrets from the codebase.

#### 3. Android Development Environment Stabilization (Modisa)
Resolved the "RedHat Language Support" lockup in the IDE that was blocking mobile development.
- **Automation**: Created `scripts/verify-android-gradle.cjs` to handle environment pre-checks.
- **Status**: Successfully verified `app:assembleDebug` build process.

#### 4. Administrative & Partner Feature Uplift (Tapologo + Arnold + Modisa)
- **Tests**: 100% pass rate on new Handover Lifecycle and Booking Extension test suites.
- **Features**: Implemented SuperAdmin RPCs for `suspend_user` and `ban_user`, fully integrated with Supabase Auth ban windows.
- **Partner Metrics**: Successfully onboarded Dumba Rentals with 10 additional vehicles, bringing the verified fleet total to 76.

### 🚥 Carry-overs to Sprint 12
- **MOB-13 (Google Native Integration)**: Moved to Sprint 12. Implementation is plan-ready but requires the production `google-services.json` file.

### 📝 Final Sign-off
Sprint 11 has successfully stabilized the core communication and security infrastructure, clearing the path for the Gaborone Beta Launch.

*Signed off by: Modisa Maphanyane (April 17, 2026)*
