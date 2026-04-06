# Sprint 10 Jira-Style Execution Plan
## MobiRides Application — April 14–20, 2026

**Prepared by:** Modisa Maphanyane  
**Sprint:** Sprint 10  
**Date:** April 10, 2026  
**Status:** PLANNED

---

## 📊 Executive Summary

Sprint 10 focuses on **security remediation, BUG-003 resolution, Sprint 9 carry-overs, and test coverage uplift**. Arnold shifts to the MOB-700 security series. Duma completes outstanding service wiring and compliance tickets. Tapologo delivers the first unit test suite and verifies Android CI. Modisa oversees sprint execution, PRD alignment, and sign-offs.

| Epic | Current | Target |
|------|---------|--------|
| Security Hardening (MOB-700) | 25% | 70% |
| DB Pull Fix (BUG-003) | 0% | 100% |
| Admin Settings Service Wiring | 60% | 100% |
| Anonymize-on-Delete (MOB-110) | 40% | 70% |
| Auth Compliance P3 (MOB-614/615) | 85% | 100% |
| Notification Enhancement (MOB-800) | 65% | 85% |
| Test Coverage | 62% | 70% |

---

## 👥 Team Assignments

| Owner | Module Focus | Primary Responsibilities |
|-------|-------------|-------------------------|
| **Arnold (Snr Engineer)** | Security remediation + BUG-003 | MOB-701–706, MOB-801/802, search_path fixes |
| **Duma (Technical Advisor)** | Service wiring + compliance + crons | S9-005–008, S9-012–014 carry-overs |
| **Tapologo (Testing & QA Intern)** | Test coverage + Android CI | S9-016–020 carry-overs |
| **Modisa (CEO)** | PRD alignment + sign-offs | Sprint oversight, status reporting, plan review |

---

## 🎯 Sprint Backlog Summary

| Category | Total Tickets | Arnold | Duma | Tapologo | Modisa |
|----------|:------------:|:------:|:----:|:--------:|:------:|
| Security Remediation (MOB-700) | 6 | 6 | — | — | — |
| BUG-003 Fix (MOB-801/802) | 2 | 2 | — | — | — |
| Service Wiring Carry-over (S9) | 3 | — | 3 | — | — |
| Anonymize-on-Delete (S9-008) | 1 | — | 1 | — | — |
| Auth Compliance (S9-012) | 1 | — | 1 | — | — |
| Notification Crons (S9-013/014) | 2 | — | 2 | — | — |
| Test Coverage (S9-016–019) | 4 | — | — | 4 | — |
| Android Verification (S9-020) | 1 | — | — | 1 | — |
| Sprint Sign-off & Reporting | 1 | — | — | — | 1 |
| SSRF Endpoint Validation (MOB-710) | 1 | 1 | — | — | — |
| **TOTAL** | **22** | **9** | **7** | **5** | **1** |

---

## 📋 Module 1: BUG-003 Fix (Arnold)

### S10-001 — MOB-801: Drop old enum-dependent function overloads

| Field | Value |
|-------|-------|
| **Ticket** | S10-001 / MOB-801 |
| **Owner** | Arnold |
| **Priority** | P0 — Day 1 |
| **Ref** | `docs/hotfixes/HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md` |
| **Summary** | Insert `DROP FUNCTION IF EXISTS` for 7 functions in `20260319212624_remote_schema.sql` before the `DROP TYPE notification_type__old_version_to_be_dropped` statement |

**Tasks:**
- [ ] Add 7 `DROP FUNCTION IF EXISTS` statements before line 1226 of `20260319212624_remote_schema.sql`
- [ ] Functions: `create_booking_notification` (2 overloads), `create_notification_with_expiration`, `create_wallet_notification`, `get_notification_expiration_info`, `get_user_notifications`, `update_notification_expiration_policy`
- [ ] Verify `supabase db pull` completes without `SQLSTATE 2BP01`

**Acceptance Criteria:** `supabase db pull` succeeds; no `notification_type__old_version_to_be_dropped` errors.

---

### S10-002 — MOB-802: Remove redundant enum block from second migration

| Field | Value |
|-------|-------|
| **Ticket** | S10-002 / MOB-802 |
| **Owner** | Arnold |
| **Priority** | P0 — Day 1 |
| **Ref** | `docs/hotfixes/HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md` |
| **Summary** | Remove the redundant `notification_type` rename/recreate/drop block (lines 131-139) from `20260328135949_remote_schema.sql` |

**Tasks:**
- [ ] Delete lines 131-139 of `20260328135949_remote_schema.sql` (rename + recreate + migrate + drop)
- [ ] Verify block removal does not affect any other statements in the file
- [ ] Run `supabase db pull` end-to-end

**Acceptance Criteria:** File is shorter; `db pull` completes clean.

---

## 📋 Module 2: Security Remediation — P0 (Arnold)

### S10-003 — MOB-701: Remove hardcoded secrets from scripts

| Field | Value |
|-------|-------|
| **Ticket** | S10-003 / MOB-701 |
| **Owner** | Arnold |
| **Priority** | P0 — Day 1 |
| **Ref** | `docs/hotfixes/SECURITY_REMEDIATION_2026_04_04.md` |
| **Summary** | Delete `scripts/check-restrictions-by-phone.cjs` (contains service role key, admin email, admin password). Rotate credentials. |

**Tasks:**
- [ ] Delete `scripts/check-restrictions-by-phone.cjs`
- [ ] Verify no other scripts contain hardcoded secrets (`grep -r "service_role" scripts/`)
- [ ] Rotate service role key in Supabase Dashboard (Settings > API)
- [ ] Rotate admin password referenced in script

**Acceptance Criteria:** No hardcoded secrets in git-tracked files; credentials rotated.

---

### S10-004 — MOB-702: Auth-gate `add-admin` edge function

| Field | Value |
|-------|-------|
| **Ticket** | S10-004 / MOB-702 |
| **Owner** | Arnold |
| **Priority** | P0 — Day 1 |
| **Ref** | `docs/hotfixes/SECURITY_REMEDIATION_2026_04_04.md` |
| **Summary** | Add authentication + super_admin authorization to `add-admin` edge function |

**Tasks:**
- [ ] Extract and verify Bearer token via `supabaseClient.auth.getUser()`
- [ ] Lookup caller in `admins` table; reject if not `is_super_admin`
- [ ] Return 401 for missing/invalid token, 403 for non-admin callers
- [ ] Add Zod validation for request body
- [ ] Verify existing admin creation flow works end-to-end

**Acceptance Criteria:** Unauthenticated requests return 401; non-super-admin requests return 403; valid requests succeed.

---

### S10-005 — MOB-703: Drop blanket notifications read policy

| Field | Value |
|-------|-------|
| **Ticket** | S10-005 / MOB-703 |
| **Owner** | Arnold |
| **Priority** | P0 — Day 2 |
| **Ref** | `docs/hotfixes/SECURITY_REMEDIATION_2026_04_04.md` |
| **Summary** | Replace blanket `SELECT` on `notifications` with `user_id = auth.uid()` policy |

**Tasks:**
- [ ] Create migration `YYYYMMDDHHMMSS_drop_blanket_notifications_policy.sql`
- [ ] Drop existing blanket policy
- [ ] Create `user_id = auth.uid()` policy for authenticated users
- [ ] Create admin-only policy for admin reads
- [ ] Verify notification queries still work in app

**Acceptance Criteria:** Users can only read their own notifications; admin can read all.

---

### S10-006 — MOB-704: Add RLS to financial tables

| Field | Value |
|-------|-------|
| **Ticket** | S10-006 / MOB-704 |
| **Owner** | Arnold |
| **Priority** | P1 — Day 2 |
| **Ref** | `docs/hotfixes/SECURITY_REMEDIATION_2026_04_04.md` |
| **Summary** | Enable RLS + add policies on `commission_rates`, `insurance_commission_rates`, `wallet_transactions` (if missing) |

**Tasks:**
- [ ] Audit current RLS status on each table
- [ ] Create migration with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` where needed
- [ ] Add appropriate read/write policies per table
- [ ] Verify admin dashboard and host wallet views still function

**Acceptance Criteria:** All financial tables have RLS enabled with appropriate policies.

---

### S10-007 — MOB-705: Add input validation to edge functions

| Field | Value |
|-------|-------|
| **Ticket** | S10-007 / MOB-705 |
| **Owner** | Arnold |
| **Priority** | P1 — Day 3 |
| **Ref** | `docs/hotfixes/SECURITY_REMEDIATION_2026_04_04.md` |
| **Summary** | Add Zod validation to edge functions that accept user input without validation |

**Tasks:**
- [ ] Audit all edge functions for missing input validation
- [ ] Add Zod schemas to functions accepting user input
- [ ] Return 400 with validation errors for invalid input
- [ ] Deploy updated functions

**Acceptance Criteria:** All edge functions validate input; invalid payloads return 400.

---

### S10-008 — MOB-706: Fix mutable search_path on functions

| Field | Value |
|-------|-------|
| **Ticket** | S10-008 / MOB-706 |
| **Owner** | Arnold |
| **Priority** | P1 — Day 3 |
| **Ref** | `docs/hotfixes/SECURITY_REMEDIATION_2026_04_04.md` |
| **Summary** | Set immutable `search_path` on 11 functions flagged by Supabase linter |

**Tasks:**
- [ ] Create migration to `ALTER FUNCTION ... SET search_path = public`
- [ ] Apply to all 11 flagged functions
- [ ] Verify no runtime regressions

**Acceptance Criteria:** Supabase linter shows 0 `search_path` warnings for these functions.

---

## 📋 Module 3: Service Wiring Carry-overs (Duma)

### S10-009 — S9-005: Wire commission rates to platform_settings

| Field | Value |
|-------|-------|
| **Ticket** | S10-009 (carry from S9-005) |
| **Owner** | Duma |
| **Priority** | P0 — Day 1 |
| **Ref** | `src/services/commission/commissionRates.ts` |
| **Summary** | Verify `getDefaultCommissionRate()` reads from `platform_settings.commission_rate_default`; remove any `as any` casts |

**Tasks:**
- [ ] Verify `getDefaultCommissionRate()` works with platform_settings table
- [ ] Remove `as any` cast if present
- [ ] Confirm `getCurrentCommissionRate()` fallback logic
- [ ] `tsc --noEmit` must pass

---

### S10-010 — S9-006: Wire dynamic pricing service to DB

| Field | Value |
|-------|-------|
| **Ticket** | S10-010 (carry from S9-006) |
| **Owner** | Duma |
| **Priority** | P1 — Day 1 |
| **Ref** | `src/services/dynamicPricingService.ts` |
| **Summary** | Refactor dynamic pricing service to accept rules from DB rather than hardcoded arrays |

**Tasks:**
- [ ] Audit `dynamicPricingService.ts` for hardcoded rule arrays
- [ ] Refactor service to accept rules as parameter
- [ ] Ensure fallback to hardcoded defaults if DB fetch fails
- [ ] `tsc --noEmit` must pass

---

### S10-011 — S9-007: Wire insurance admin fee to platform_settings

| Field | Value |
|-------|-------|
| **Ticket** | S10-011 (carry from S9-007) |
| **Owner** | Duma |
| **Priority** | P1 — Day 1 |
| **Ref** | `src/services/insuranceService.ts:347` |
| **Summary** | Replace hardcoded `P 150` admin fee with `platform_settings.insurance_admin_fee` |

**Tasks:**
- [ ] Fetch `insurance_admin_fee` from `platform_settings` at claim processing time
- [ ] Fallback to 150 if fetch fails
- [ ] `tsc --noEmit` must pass

---

## 📋 Module 4: Compliance + Notifications Carry-overs (Duma)

### S10-012 — S9-008: Refactor `delete-user-with-transfer` edge function

| Field | Value |
|-------|-------|
| **Ticket** | S10-012 (carry from S9-008 / MOB-131) |
| **Owner** | Duma |
| **Priority** | P1 — Day 2 |
| **Ref** | `docs/plans/ANONYMIZE_ON_DELETE_2026_03_02.md` Phase 2 |
| **Summary** | Replace hard-delete with anonymize + soft-delete per data classification table |

**Tasks:**
- [ ] Hard-delete PII tables (conversations, notifications, verifications, device_tokens, etc.)
- [ ] Soft-delete `profiles`: scrub PII, set `is_deleted = true`
- [ ] Anonymize `reviews`: set text to `'[removed]'`, keep ratings
- [ ] Anonymize `cars`: set description/location to `'[removed]'`
- [ ] Preserve analytics tables untouched
- [ ] Hard-delete `auth.users` last

---

### S10-013 — S9-012: Store consent record on signup

| Field | Value |
|-------|-------|
| **Ticket** | S10-013 (carry from S9-012 / MOB-615) |
| **Owner** | Duma |
| **Priority** | P1 — Day 3 |
| **Ref** | `src/components/auth/SignUpForm.tsx` |
| **Summary** | Insert `user_consents` row on successful signup |

**Tasks:**
- [ ] After `supabase.auth.signUp()` succeeds, insert consent record
- [ ] Failure to insert must not block signup — log error only
- [ ] `tsc --noEmit` must pass

---

### S10-014 — S9-013: Rental-reminder cron job

| Field | Value |
|-------|-------|
| **Ticket** | S10-014 (carry from S9-013 / MOB-804) |
| **Owner** | Duma |
| **Priority** | P1 — Day 3 |
| **Ref** | `docs/20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md` |
| **Summary** | Send `rental-reminder` email 24h before booking start_date |

**Tasks:**
- [ ] Implement `booking-reminders` edge function
- [ ] Query bookings where `start_date = now() + 24h` and `status = 'confirmed'`
- [ ] Send email via Resend service
- [ ] Schedule daily at 08:00 UTC via `pg_cron`

---

### S10-015 — S9-014: Return-reminder cron job

| Field | Value |
|-------|-------|
| **Ticket** | S10-015 (carry from S9-014 / MOB-805) |
| **Owner** | Duma |
| **Priority** | P1 — Day 4 |
| **Ref** | `docs/20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md` |
| **Summary** | Send `return-reminder` email 4h before booking end_date |

**Tasks:**
- [ ] Extend `booking-reminders` edge function for return reminders
- [ ] Query bookings where `end_date = now() + 4h` and `status = 'in_progress'`
- [ ] Send email via Resend service

---

## 📋 Module 5: Test Coverage (Tapologo)

### S10-016 — S9-016: Unit tests — handover lifecycle transitions

| Field | Value |
|-------|-------|
| **Ticket** | S10-016 (carry from S9-016) |
| **Owner** | Tapologo |
| **Priority** | P1 — Day 1 |
| **Ref** | `src/services/handoverService.ts`, `src/hooks/useInteractiveHandover.ts` |
| **Summary** | Test pickup→in_progress and return→completed transitions, disconnect recovery |

**Tasks:**
- [ ] Add test: pickup handover sets booking status to `in_progress`
- [ ] Add test: return handover sets booking status to `completed`
- [ ] Add test: `visibilitychange` triggers session re-fetch
- [ ] All tests pass with `npm test`

---

### S10-017 — S9-017: Unit tests — insurance claim submission

| Field | Value |
|-------|-------|
| **Ticket** | S10-017 (carry from S9-017) |
| **Owner** | Tapologo |
| **Priority** | P1 — Day 2 |
| **Ref** | `src/components/insurance/ClaimsSubmissionForm.tsx` |
| **Summary** | Test evidence upload, claim status display, submit button logic |

**Tasks:**
- [ ] Add test: evidence upload advances to next step
- [ ] Add test: claim status fields render from DB aliases
- [ ] Add test: submit enabled when `rating > 0`

---

### S10-018 — S9-018: Unit tests — admin portal

| Field | Value |
|-------|-------|
| **Ticket** | S10-018 (carry from S9-018) |
| **Owner** | Tapologo |
| **Priority** | P2 — Day 3 |
| **Ref** | `src/components/admin/AuditLogViewer.tsx`, `src/components/admin/superadmin/CapabilityAssignment.tsx` |
| **Summary** | Test audit log rendering and capability toggles |

**Tasks:**
- [ ] Add test: `AuditLogViewer` renders rows from query data
- [ ] Add test: error state rendering
- [ ] Add test: capability toggle calls correct mutation

---

### S10-019 — S9-019: Unit tests — booking extension

| Field | Value |
|-------|-------|
| **Ticket** | S10-019 (carry from S9-019) |
| **Owner** | Tapologo |
| **Priority** | P2 — Day 3 |
| **Ref** | `src/components/rental-details/ExtensionRequestDialog.tsx` |
| **Summary** | Test day stepper, cost calculation, submit |

**Tasks:**
- [ ] Add test: cost = `extraDays × pricePerDay`
- [ ] Add test: new end date = `currentEndDate + extraDays`
- [ ] Add test: submit inserts `booking_extensions` row

---

### S10-020 — S9-020: Android gradle verification

| Field | Value |
|-------|-------|
| **Ticket** | S10-020 (carry from S9-020) |
| **Owner** | Tapologo |
| **Priority** | P1 — Day 1 |
| **Ref** | `android/gradle/wrapper/gradle-wrapper.properties` |
| **Summary** | Verify gradle 9.1.0 wrapper in local Android Studio + CI |

**Tasks:**
- [ ] Build Android APK locally
- [ ] Confirm CI pipeline passes Android build step
- [ ] Document result

---

## 📋 Module 6: Sprint Management (Modisa)

### S10-021 — Sprint sign-off and status reporting

| Field | Value |
|-------|-------|
| **Ticket** | S10-021 |
| **Owner** | Modisa |
| **Priority** | P0 |
| **Summary** | Review all PRs, update status documentation, prepare Week 3 April status report |

**Tasks:**
- [ ] Review and approve all Sprint 10 PRs
- [ ] Update BUG_REPORT.md with resolved items
- [ ] Prepare Week 3 April status report
- [ ] Update ROADMAP.md if milestones achieved

---

## 📊 Sprint 10 Definition of Done

A ticket is **Done** when:
1. Code is merged to `develop` via PR (human merges)
2. `tsc --noEmit` passes clean
3. If a migration was created: `npm run gen:types` was run and `types.ts` committed
4. Status report updated (doc PR raised)
5. No new regressions in existing tests

---

## 🗓️ Suggested Day-by-Day Schedule

| Day | Arnold | Duma | Tapologo | Modisa |
|-----|--------|------|----------|--------|
| Mon Apr 14 | S10-001/002 (BUG-003), S10-003 (secrets) | S10-009 (commission), S10-010 (pricing), S10-011 (insurance fee) | S10-020 (Android), S10-016 (handover tests) | Review PRs |
| Tue Apr 15 | S10-004 (add-admin auth), S10-005 (notifications RLS) | S10-012 (delete-user refactor) | S10-016 cont., S10-017 (insurance tests) | Review PRs |
| Wed Apr 16 | S10-006 (financial RLS), S10-007 (edge fn validation) | S10-013 (consent on signup), S10-014 (rental cron) | S10-017 cont., S10-018 (admin tests) | Review PRs |
| Thu Apr 17 | S10-008 (search_path) | S10-015 (return cron) | S10-018 cont., S10-019 (extension tests) | Review PRs |
| Fri Apr 18 | Buffer + review | Buffer + review | S10-019 cont. | S10-021 (sign-off + reporting) |

---

## 📊 Sprint 10 Completion Status

| Task ID | Member | Status | Notes |
|---------|--------|--------|-------|
| S10-001 | Arnold | ❌ Not Started | MOB-801: drop enum-dependent functions |
| S10-002 | Arnold | ❌ Not Started | MOB-802: remove redundant enum block |
| S10-003 | Arnold | 🟡 In Progress | MOB-701: 16 scripts deleted, `.env` cleaned, keys rotated (2026-04-06). Remaining: final grep verification + credential rotation confirmation |
| S10-004 | Arnold | ❌ Not Started | MOB-702: auth-gate add-admin |
| S10-005 | Arnold | ❌ Not Started | MOB-703: notifications RLS |
| S10-006 | Arnold | ❌ Not Started | MOB-704: financial tables RLS |
| S10-007 | Arnold | ❌ Not Started | MOB-705: edge function validation |
| S10-008 | Arnold | ❌ Not Started | MOB-706: search_path fixes |
| S10-009 | Duma | ❌ Not Started | Commission → platform_settings |
| S10-010 | Duma | ❌ Not Started | Dynamic pricing → DB |
| S10-011 | Duma | ❌ Not Started | Insurance fee → platform_settings |
| S10-012 | Duma | ❌ Not Started | delete-user-with-transfer refactor |
| S10-013 | Duma | ❌ Not Started | Consent on signup |
| S10-014 | Duma | ❌ Not Started | Rental-reminder cron |
| S10-015 | Duma | ❌ Not Started | Return-reminder cron |
| S10-016 | Tapologo | ❌ Not Started | Handover lifecycle tests |
| S10-017 | Tapologo | ❌ Not Started | Insurance claim tests |
| S10-018 | Tapologo | ❌ Not Started | Admin portal tests |
| S10-019 | Tapologo | ❌ Not Started | Booking extension tests |
| S10-020 | Tapologo | ❌ Not Started | Android gradle verification |
| S10-021 | Modisa | ❌ Not Started | Sprint sign-off + reporting |
| S10-022 | Arnold | ✅ Done | MOB-710: SSRF endpoint validation in `send-push-notification` (2026-04-06) |

### Summary

| Member | Completed | In Progress | Not Started | Total |
|--------|-----------|-------------|-------------|-------|
| Arnold | 1 | 1 | 6 | 8 |
| Duma | 0 | 0 | 7 | 7 |
| Tapologo | 0 | 0 | 5 | 5 |
| Modisa | 0 | 0 | 1 | 1 |
| **TOTAL** | **1** | **1** | **19** | **22** |

---

*Signed off by: Modisa Maphanyane*
