# Sprint 9 Jira-Style Execution Plan
## MobiRides Application — April 7–13, 2026

**Prepared by:** Modisa Maphanyane  
**Sprint:** Sprint 9  
**Date:** April 4, 2026  
**Status:** IN PROGRESS — Arnold's 9 tickets complete (2026-03-28)

---

## 📊 Executive Summary

Sprint 9 focuses on **infrastructure stability, compliance, and test coverage**. The Sprint 8 bug backlog is fully closed. This sprint targets the remaining epics under 95% production readiness:

| Epic | Current | Target |
|------|---------|--------|
| Admin Settings & Business Logic | 20% | 60% |
| Dynamic Pricing | 25% | 60% |
| Anonymize-on-Delete (MOB-110/130–138) | 0% | 50% |
| Auth Compliance P3 (MOB-614/615) | 85% | 100% |
| Notification Enhancement (MOB-800) | 60% | 80% |
| Test Coverage | 62% | 70% |

---

## 👥 Team Assignments

| Owner | Module Focus | Primary Responsibilities |
|-------|-------------|-------------------------|
| **Arnold (Snr Engineer)** | DB migrations + schema | platform_settings migration, dynamic_pricing_rules migration, BUG-001 fix, anonymize-on-delete Phase 1 |
| **Duma (Technical Advisor)** | Service wiring + compliance | Admin settings service wiring, auth compliance P3, notification cron jobs |
| **Tapologo (Testing & QA Intern)** | Test coverage + UI verification | Unit tests for handover/insurance/admin flows, Android build verification |

---

## 🎯 Sprint Backlog Summary

| Category | Total Tickets | Arnold | Duma | Tapologo |
|----------|:------------:|:------:|:----:|:--------:|
| Infrastructure / DB (BUG-001 + migrations) | 4 | 4 ✅ | — | — |
| Admin Settings wiring | 3 | — | 3 | — |
| Anonymize-on-Delete | 5 | 3 ✅ | 2 | — |
| Auth Compliance P3 | 2 | 1 ✅ | 1 | — |
| Notification Enhancement | 3 | 1 ✅ | 2 | — |
| Test Coverage | 4 | — | — | 4 |
| Android Verification | 1 | — | — | 1 |
| **TOTAL** | **22** | **9 ✅ (all done)** | **8** | **5** |

---

## 📋 Module 1: Infrastructure / DB (Arnold)

### S9-001 — Fix BUG-001: Drop legacy `create_handover_notification` overload

| Field | Value |
|-------|-------|
| **Ticket** | S9-001 |
| **Owner** | Arnold |
| **Priority** | P0 — Day 1 |
| **Ref** | `docs/BUG_REPORT.md` |
| **Summary** | Drop the legacy 4-arg void-returning overload of `create_handover_notification` that conflicts with the current 8-arg bigint-returning version, blocking `supabase db pull` and `npm run gen:types` |
| **Status** | ✅ DONE — 2026-03-28 |

**Tasks:**
- [x] Create migration `20260319212623_drop_legacy_handover_notification_fn.sql`
- [x] Migration body drops legacy overloads and no-arg `is_admin()` conflict
- [x] Additional migration conflicts fixed (see `docs/hotfixes/HOTFIX_DB_PULL_FIX_2026_03_28.md`)
- [x] Run `npm run gen:types` — completed without error, `types.ts` updated
- [x] Verified `supabase db pull` completes without error

**Acceptance Criteria:** `supabase db pull` and `npm run gen:types` complete without `SQLSTATE 42P13` error. ✅

---

### S9-002 — Create `platform_settings` table migration

| Field | Value |
|-------|-------|
| **Ticket** | S9-002 |
| **Owner** | Arnold |
| **Priority** | P0 — Day 1 |
| **Ref** | `docs/20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md` |
| **Summary** | Create `platform_settings` key-value table with default rows mirroring current hardcoded values |
| **Status** | ✅ DONE — 2026-03-28 |

**Tasks:**
- [x] Create migration `20260328161800_create_platform_settings.sql`
- [x] Table: `id`, `setting_key` (unique), `setting_value`, `description`, `updated_by`, `updated_at`
- [x] Seeded defaults: `commission_rate_default` (0.15), `insurance_admin_fee` (150), `dynamic_pricing_enabled` (true)
- [x] RLS: super_admin read/write, admin read-only
- [x] `get_platform_settings` and `update_platform_setting` RPCs created and typed
- [x] Run `npm run gen:types` — `types.ts` updated

**Acceptance Criteria:** `platform_settings` table exists in DB with seeded defaults; `usePlatformSettings` hook returns values without `as any` cast. ✅

---

### S9-003 — Create `dynamic_pricing_rules` table migration

| Field | Value |
|-------|-------|
| **Ticket** | S9-003 |
| **Owner** | Arnold |
| **Priority** | P0 — Day 2 |
| **Ref** | `docs/20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md` |
| **Summary** | Create `dynamic_pricing_rules` table seeded with the 8 rules currently hardcoded in `dynamicPricingService.ts:91-197` |
| **Status** | ✅ DONE — 2026-03-28 |

**Tasks:**
- [x] Create migration `20260328162700_create_dynamic_pricing_rules.sql`
- [x] Table: `id`, `rule_name`, `multiplier`, `condition_type`, `condition_value`, `is_active`, `priority`, `created_at`
- [x] Seeded all 8 rules from `dynamicPricingService.ts`
- [x] RLS: super_admin read/write, admin read-only
- [x] `useDynamicPricingRules` hook — all `as any` casts removed
- [x] Run `npm run gen:types` — `types.ts` updated

**Acceptance Criteria:** `dynamic_pricing_rules` table exists with 8 seeded rows; `useDynamicPricingRules` hook returns rows without `as any` cast. ✅

---

### S9-004 — Anonymize-on-Delete Phase 1: `profiles` soft-delete columns

| Field | Value |
|-------|-------|
| **Ticket** | S9-004 / MOB-130 |
| **Owner** | Arnold |
| **Priority** | P1 — Day 2 |
| **Ref** | `docs/plans/ANONYMIZE_ON_DELETE_2026_03_02.md` Phase 1 |
| **Summary** | Add `is_deleted`, `deleted_at`, `deleted_by` columns to `profiles` table |
| **Status** | ✅ DONE — 2026-03-28 |

**Tasks:**
- [x] Create migration `20260328164500_profiles_soft_delete_columns.sql`
- [x] `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false`
- [x] `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`
- [x] `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_by UUID`
- [x] Updated RLS SELECT policies to filter `is_deleted = false` for non-admin queries
- [x] Run `npm run gen:types` — `types.ts` updated

**Acceptance Criteria:** Columns exist with correct defaults; existing queries unaffected; admin can query deleted profiles. ✅

---

## 📋 Module 2: Admin Settings Service Wiring (Duma)

### S9-005 — Wire `commissionRates.ts` to `platform_settings`

| Field | Value |
|-------|-------|
| **Ticket** | S9-005 |
| **Owner** | Duma |
| **Priority** | P0 — after S9-002 merged |
| **Ref** | `src/services/commission/commissionRates.ts`, `docs/20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md` |
| **Summary** | Replace hardcoded 15% fallback in `commissionRates.ts` with DB read from `platform_settings.commission_rate_default` |

**Tasks:**
- [ ] `getDefaultCommissionRate()` already reads from `platform_settings` — verify it works now that table exists
- [ ] Remove `as any` cast if present
- [ ] Confirm `getCurrentCommissionRate()` falls back to `platform_settings` correctly when `commission_rates` table has no active row
- [ ] `tsc --noEmit` must pass

---

### S9-006 — Wire `dynamicPricingService.ts` to `dynamic_pricing_rules`

| Field | Value |
|-------|-------|
| **Ticket** | S9-006 |
| **Owner** | Duma |
| **Priority** | P1 — after S9-003 merged |
| **Ref** | `src/services/dynamicPricingService.ts`, `src/hooks/useDynamicPricingRules.ts` |
| **Summary** | Replace hardcoded pricing rules array in `dynamicPricingService.ts` with DB read via `useDynamicPricingRules` hook |

**Tasks:**
- [ ] Audit `dynamicPricingService.ts` — identify all hardcoded rule arrays (lines 91–197)
- [ ] Refactor service to accept rules as a parameter (injected from hook) rather than hardcoded
- [ ] Ensure fallback to hardcoded defaults if DB fetch fails (non-breaking)
- [ ] Remove `as any` casts in `useDynamicPricingRules.ts`
- [ ] `tsc --noEmit` must pass

---

### S9-007 — Wire `insuranceService.ts` admin fee to `platform_settings`

| Field | Value |
|-------|-------|
| **Ticket** | S9-007 |
| **Owner** | Duma |
| **Priority** | P1 — after S9-002 merged |
| **Ref** | `src/services/insuranceService.ts:347` |
| **Summary** | Replace hardcoded `P 150` admin fee in `insuranceService.ts` with read from `platform_settings.insurance_admin_fee` |

**Tasks:**
- [ ] Fetch `insurance_admin_fee` from `platform_settings` at claim processing time
- [ ] Fallback to 150 if fetch fails
- [ ] `tsc --noEmit` must pass

---

## 📋 Module 3: Anonymize-on-Delete Phase 2 (Duma + Arnold)

### S9-008 — Refactor `delete-user-with-transfer` edge function (Duma)

| Field | Value |
|-------|-------|
| **Ticket** | S9-008 / MOB-131 |
| **Owner** | Duma |
| **Priority** | P1 — after S9-004 merged |
| **Ref** | `docs/plans/ANONYMIZE_ON_DELETE_2026_03_02.md` Phase 2, `supabase/functions/delete-user-with-transfer/` |
| **Summary** | Replace hard-delete logic with anonymize + soft-delete per the plan's data classification table |

**Tasks:**
- [ ] Hard-delete PII tables: `conversation_messages`, `conversation_participants`, `conversations`, `notifications`, `saved_cars`, `user_verifications`, `license_verifications`, `user_restrictions`, `user_roles`, `device_tokens`, `documents`
- [ ] Soft-delete `profiles`: scrub PII fields, set `is_deleted = true`, `deleted_at = now()`, `deleted_by = admin_id`
- [ ] Anonymize `reviews`: set free-text to `'[removed]'`, keep ratings
- [ ] Anonymize `cars`: set description/location to `'[removed]'`, keep brand/model/type/price/year
- [ ] Preserve analytics tables untouched: `bookings`, `wallet_transactions`, `payment_transactions`, `host_wallets`, `insurance_claims`
- [ ] Hard-delete `auth.users` via admin API last

---

### S9-009 — Refactor `bulk-delete-users` edge function (Arnold)

| Field | Value |
|-------|-------|
| **Ticket** | S9-009 / MOB-132 |
| **Owner** | Arnold |
| **Priority** | P1 — after S9-004 merged |
| **Ref** | `docs/plans/ANONYMIZE_ON_DELETE_2026_03_02.md` Phase 2, `supabase/functions/bulk-delete-users/` |
| **Summary** | Apply same anonymize + soft-delete logic to bulk delete edge function |
| **Status** | ✅ DONE — 2026-03-28 |

**Tasks:**
- [x] Hard-deletes PII tables (conversations, notifications, verifications, etc.)
- [x] Anonymizes reviews (`comment = '[removed]'`) and cars (`description/location = '[removed]'`)
- [x] Deletes car images (PII)
- [x] Preserves analytics tables (bookings, wallet_transactions, payment_transactions)
- [x] Soft-deletes profile (`is_deleted = true`, `full_name = 'Deleted User'`)
- [x] Hard-deletes auth user last
- [x] Per-user atomicity — logs failure and continues batch
- [x] Returns per-user success/failure in response

**Acceptance Criteria:** Anonymize + soft-delete applied per user; batch continues on individual failure. ✅

---

### S9-010 — Admin UI guard for deleted users (Arnold)

| Field | Value |
|-------|-------|
| **Ticket** | S9-010 / MOB-133 |
| **Owner** | Arnold |
| **Priority** | P2 |
| **Ref** | `docs/plans/ANONYMIZE_ON_DELETE_2026_03_02.md` Phase 3 |
| **Summary** | Filter `is_deleted = true` profiles from admin user lists; show `[Deleted User]` placeholder where needed |
| **Status** | ✅ DONE — 2026-03-28 |

**Tasks:**
- [x] Updated `get_admin_users_complete` RPC with `show_deleted` param (default false) — migration `20260328170100`
- [x] `useAdminUsersComplete` hook accepts `showDeleted` param, passes to RPC
- [x] `UnifiedUserTable` — "Show deleted users" toggle visible to super admins only
- [x] `[Deleted]` badge shown in status column for soft-deleted users
- [x] Run `npm run gen:types` — `types.ts` updated

**Acceptance Criteria:** Deleted users excluded by default; visible with toggle; `[Deleted]` badge shown. ✅

---

## 📋 Module 4: Auth Compliance P3 (Duma + Arnold)

### S9-011 — Create `user_consents` table (Arnold)

| Field | Value |
|-------|-------|
| **Ticket** | S9-011 / MOB-614 |
| **Owner** | Arnold |
| **Priority** | P1 |
| **Ref** | `docs/Product Status/2026-03-09_AUTH_COMPLIANCE_EPIC.md` |
| **Summary** | Create `user_consents` table to store GDPR-compliant consent records on signup |
| **Status** | ✅ DONE — 2026-03-28 |

**Tasks:**
- [x] Create migration `20260328171500_create_user_consents.sql`
- [x] Table: `id`, `user_id`, `terms_accepted`, `privacy_accepted`, `community_accepted`, `age_confirmed`, `marketing_opted_in`, `consent_version`, `ip_address`, `user_agent`, `created_at`
- [x] RLS: user can insert/read own record; admin can read all
- [x] Run `npm run gen:types` — `types.ts` updated

**Acceptance Criteria:** Table exists with correct schema; RLS enforced; `types.ts` updated. ✅

---

### S9-012 — Store consent record on signup (Duma)

| Field | Value |
|-------|-------|
| **Ticket** | S9-012 / MOB-615 |
| **Owner** | Duma |
| **Priority** | P1 — after S9-011 merged |
| **Ref** | `src/components/auth/SignUpForm.tsx`, `src/components/auth/SignUpConsents.tsx` |
| **Summary** | Insert a `user_consents` row on successful signup capturing all consent checkbox states |

**Tasks:**
- [ ] After `supabase.auth.signUp()` succeeds, insert consent record with all checkbox values
- [ ] Capture `ip_address` from request context if available, else null
- [ ] Failure to insert consent must not block signup — log error only
- [ ] `tsc --noEmit` must pass

---

## 📋 Module 5: Notification Enhancement (Duma)

### S9-013 — Implement rental-reminder cron job (Duma)

| Field | Value |
|-------|-------|
| **Ticket** | S9-013 / MOB-804 |
| **Owner** | Duma |
| **Priority** | P1 |
| **Ref** | `docs/20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`, `supabase/functions/booking-reminders/` |
| **Summary** | Schedule cron job to send `rental-reminder` email 24h before booking `start_date` |

**Tasks:**
- [ ] Implement `booking-reminders` edge function to query bookings with `start_date = now() + 24h` and `status = 'confirmed'`
- [ ] Send `rental-reminder` email via Resend service for each matching booking
- [ ] Schedule via `pg_cron` or Supabase scheduled function (daily at 08:00 UTC)
- [ ] Add migration for cron job registration

---

### S9-014 — Implement return-reminder cron job (Duma)

| Field | Value |
|-------|-------|
| **Ticket** | S9-014 / MOB-805 |
| **Owner** | Duma |
| **Priority** | P1 |
| **Ref** | `docs/20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md` |
| **Summary** | Schedule cron job to send `return-reminder` email 4h before booking `end_date` |

**Tasks:**
- [ ] Extend `booking-reminders` edge function to also handle return reminders
- [ ] Query bookings with `end_date = now() + 4h` and `status = 'in_progress'`
- [ ] Send `return-reminder` email via Resend service

---

### S9-015 — Implement unverified-user reminder cron job (Arnold)

| Field | Value |
|-------|-------|
| **Ticket** | S9-015 / MOB-806 |
| **Owner** | Arnold |
| **Priority** | P2 |
| **Ref** | `docs/20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md` |
| **Summary** | Send reminder email to users who signed up 7 days ago but haven't completed verification |
| **Status** | ✅ DONE — 2026-03-28 |

**Tasks:**
- [x] Deployed `supabase/functions/unverified-reminder/index.ts` edge function
- [x] Queries `profiles` where `created_at < now() - 7 days` AND `verification_status != completed` AND `is_deleted = false`
- [x] Sends `unverified-reminder` email via Resend service
- [x] Scheduled as daily cron job at 08:00 UTC — migration `20260328172900`
- [x] Fixed bug: enum value `verified` → `completed`

**Acceptance Criteria:** Function deployed; cron scheduled daily; emails sent to unverified users 7+ days old. ✅

---

## 📋 Module 6: Test Coverage (Tapologo)

### S9-016 — Unit tests: handover lifecycle transitions

| Field | Value |
|-------|-------|
| **Ticket** | S9-016 |
| **Owner** | Tapologo |
| **Priority** | P1 |
| **Ref** | `src/services/handoverService.ts`, `src/hooks/useInteractiveHandover.ts`, `__tests__/handoverService.test.ts` |
| **Summary** | Extend existing handover tests to cover pickup→in_progress and return→completed transitions, and disconnect/reconnect state recovery |

**Tasks:**
- [ ] Add test: pickup handover completion sets booking status to `in_progress`
- [ ] Add test: return handover completion sets booking status to `completed`
- [ ] Add test: `visibilitychange` event triggers re-fetch of session state
- [ ] All tests must pass with `npm test`

---

### S9-017 — Unit tests: insurance claim submission flow

| Field | Value |
|-------|-------|
| **Ticket** | S9-017 |
| **Owner** | Tapologo |
| **Priority** | P1 |
| **Ref** | `src/components/insurance/ClaimsSubmissionForm.tsx`, `src/components/insurance/UserClaimsList.tsx` |
| **Summary** | Unit tests for claim submission, evidence upload navigation, and claim status display |

**Tasks:**
- [ ] Add test: evidence upload on step 2 advances to step 3
- [ ] Add test: claim status fields (`incident_location`, `estimated_repair_cost`, `excess_amount`) render correctly from DB aliases
- [ ] Add test: submit button enabled when `rating > 0` regardless of category ratings

---

### S9-018 — Unit tests: admin portal (audit logs + capability assignment)

| Field | Value |
|-------|-------|
| **Ticket** | S9-018 |
| **Owner** | Tapologo |
| **Priority** | P2 |
| **Ref** | `src/components/admin/AuditLogViewer.tsx`, `src/components/admin/superadmin/CapabilityAssignment.tsx` |
| **Summary** | Unit tests for audit log rendering and capability toggle mutations |

**Tasks:**
- [ ] Add test: `AuditLogViewer` renders rows when query returns data
- [ ] Add test: `AuditLogViewer` shows error state when query fails
- [ ] Add test: capability checkbox toggle calls upsert/delete correctly

---

### S9-019 — Unit tests: booking extension request

| Field | Value |
|-------|-------|
| **Ticket** | S9-019 |
| **Owner** | Tapologo |
| **Priority** | P2 |
| **Ref** | `src/components/rental-details/ExtensionRequestDialog.tsx` |
| **Summary** | Unit tests for extension dialog day stepper, cost calculation, and submit |

**Tasks:**
- [ ] Add test: additional cost = `extraDays × pricePerDay`
- [ ] Add test: new end date = `currentEndDate + extraDays`
- [ ] Add test: submit inserts row in `booking_extensions` with correct fields

---

## 📋 Module 7: Android Build Verification (Tapologo)

### S9-020 — Verify Android gradle wrapper in CI

| Field | Value |
|-------|-------|
| **Ticket** | S9-020 |
| **Owner** | Tapologo |
| **Priority** | P1 |
| **Ref** | `android/gradle/wrapper/gradle-wrapper.properties` |
| **Summary** | Confirm the gradle 9.1.0 wrapper update works in both local Android Studio and CI pipeline |

**Tasks:**
- [ ] Build Android APK locally with updated wrapper
- [ ] Confirm CI pipeline passes Android build step
- [ ] Document result in standup notes

---

## 📊 Sprint 9 Definition of Done

A ticket is **Done** when:
1. Code is merged to `develop` via PR (human merges)
2. `tsc --noEmit` passes clean
3. If a migration was created: `npm run gen:types` was run and `types.ts` committed
4. Status report updated (doc PR raised)
5. No new regressions in existing tests

---

## 📊 Sprint 9 Completion Status by Team Member

| Task ID | Member | Status | Notes |
|---------|--------|--------|-------|
| S9-001 | Arnold | ✅ Completed | Legacy handover notification overload dropped (2026-03-28) |
| S9-002 | Arnold | ✅ Completed | platform_settings table created + seeded + RPCs (2026-03-28) |
| S9-003 | Arnold | ✅ Completed | dynamic_pricing_rules table created + 8 rules seeded (2026-03-28) |
| S9-004 | Arnold | ✅ Completed | profiles soft-delete columns added (2026-03-28) |
| S9-009 | Arnold | ✅ Completed | bulk-delete-users anonymize + soft-delete refactored (2026-03-28) |
| S9-010 | Arnold | ✅ Completed | Admin UI guard for deleted users (2026-03-28) |
| S9-011 | Arnold | ✅ Completed | user_consents table created + RLS (2026-03-28) |
| S9-015 | Arnold | ✅ Completed | unverified-reminder edge function deployed + cron scheduled (2026-03-28) |
| S9-005 | Duma | 🔄 In Progress | commissionRates.ts reads from platform_settings — verify + clean up |
| S9-006 | Duma | 🔄 In Progress | dynamicPricingService.ts already loads from DB with fallback — audit + clean up |
| S9-007 | Duma | 🔄 In Progress | insuranceService.ts reads insurance_admin_fee from platform_settings — verify |
| S9-008 | Duma | ❌ Not Started | delete-user-with-transfer edge function refactor |
| S9-012 | Duma | ❌ Not Started | Store consent record on signup |
| S9-013 | Duma | ❌ Not Started | rental-reminder cron job |
| S9-014 | Duma | ❌ Not Started | return-reminder cron job |
| S9-016 | Tapologo | ❌ Not Started | Unit tests: handover lifecycle transitions |
| S9-017 | Tapologo | ❌ Not Started | Unit tests: insurance claim submission flow |
| S9-018 | Tapologo | ❌ Not Started | Unit tests: admin portal (audit logs + capability assignment) |
| S9-019 | Tapologo | ❌ Not Started | Unit tests: booking extension request |
| S9-020 | Tapologo | ❌ Not Started | Android gradle wrapper CI verification |

### Summary

| Member | Completed | In Progress | Not Started | Total |
|--------|-----------|-------------|-------------|-------|
| Arnold | 9 | 0 | 0 | 9 ✅ ALL DONE |
| Duma | 0 | 3 | 5 | 8 |
| Tapologo | 0 | 0 | 5 | 5 |
| **TOTAL** | **9** | **3** | **10** | **22** |

---

## 🗓️ Suggested Day-by-Day Schedule

| Day | Arnold | Duma | Tapologo |
|-----|--------|------|----------|
| Mon Apr 7 | S9-001 (BUG-001), S9-002 (platform_settings) | Review S9-001/002 PRs, prep S9-005 | S9-020 (Android verify) |
| Tue Apr 8 | S9-003 (dynamic_pricing_rules), S9-004 (soft-delete cols) | S9-005 (commission wiring), S9-007 (insurance fee) | S9-016 (handover tests) |
| Wed Apr 9 | S9-009 (bulk-delete refactor), S9-010 (admin UI guard) | S9-006 (dynamic pricing wiring), S9-008 (delete-user refactor) | S9-017 (insurance tests) |
| Thu Apr 10 | S9-011 (user_consents table), S9-015 (unverified reminder) | S9-012 (consent on signup), S9-013 (rental reminder cron) | S9-018 (admin portal tests) |
| Fri Apr 11 | Review + buffer | S9-014 (return reminder cron) | S9-019 (extension tests), review |


## ?? Sprint 9 Review

**Completed:** Database schema changes (platform_settings, dynamic_pricing_rules, user_consents), schema migrations execution, auth compliance foundations, admin data table issues.
**Carried Over:** S9-005 to S9-008 and S9-012 to S9-014 (Service Wiring and Crons) carried over due to migration-related blocks and urgent admin bug fixes.
**Notes:** Foundation and database layer successfully upgraded. Service wiring shifted to S10 to ensure stability.
