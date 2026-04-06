# 📊 MobiRides Week 2 April 2026 Status Report

**Report Date:** April 10, 2026  
**Report Period:** Week 2 (April 4 – April 10, 2026)  
**Version:** v2.9.1  
**Prepared by:** Modisa Maphanyane  
**Reference:** JIRA Production Readiness Plan v1.3

> **📋 Sprint 9 execution tracker:** [SPRINT_9_APRIL_2026_JIRA_EXECUTION_PLAN.md](SPRINT_9_APRIL_2026_JIRA_EXECUTION_PLAN.md)  
> **📋 Sprint 10 execution plan:** [SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md](SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md)  
> **📊 Testing Coverage Report:** [TESTING_COVERAGE_STATUS_2026_03_02.md](../testing/TESTING_COVERAGE_STATUS_2026_03_02.md)  
> **🔧 Active Hotfix Trackers:**  
> - [HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md](../hotfixes/HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md) (BUG-003 / MOB-801, MOB-802)  
> - [SECURITY_REMEDIATION_2026_04_04.md](../hotfixes/SECURITY_REMEDIATION_2026_04_04.md) (BUG-002 / MOB-701–MOB-709)  
> **🛡️ Auth Compliance Epic:** [2026-03-09_AUTH_COMPLIANCE_EPIC.md](2026-03-09_AUTH_COMPLIANCE_EPIC.md) (MOB-600)  
> **🗑️ Anonymize-on-Delete Plan:** [ANONYMIZE_ON_DELETE_2026_03_02.md](../plans/ANONYMIZE_ON_DELETE_2026_03_02.md)  
> **🛡️ Damage Protection SLA v1.1:** [Damage_Protection_Service_Level_Agreement.md](Damage%20Protection%20Service%20Level%20Agreement.md)  
> **📋 Pre-Launch Testing Protocol:** [PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md](../testing/PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md)  
> **🐛 Active Bug Report:** [BUG_REPORT.md](../BUG_REPORT.md)  
> **🔧 AI Development Workflow:** [AI_WORKFLOW.md](../conventions/AI_WORKFLOW.md)

---

## 📋 Executive Summary

Week 2 of April was a high-impact infrastructure and alignment sprint. The team completed **Arnold's full Sprint 9 backlog** (9/9 tickets delivered 2026-03-28), shipped the **Admin Settings overhaul** (Dynamic Pricing + Insurance SLA v1.1 alignment), and completed a **full security audit** that produced the MOB-700 series remediation plan (9 findings). Two new bugs were formally registered: **BUG-002** (security vulnerabilities) and **BUG-003** (`notification_type` enum dependency error blocking `db pull`).

The Admin Dynamic Pricing section was rewritten to support all 8 rule types including **DESTINATION** pricing. The Insurance Settings section was rebuilt to match **Pay-U SLA v1.1** exactly (daily rate model, excess percentages, coverage caps, target segments). A migration added 4 new columns to `insurance_packages`. Documentation was updated across all status reports and sprint trackers to reflect BUG-001 and `platform_settings` completion.

---

### Key Achievements This Period

- ✅ **Admin Dynamic Pricing UI rewrite** — Full rewrite of `DynamicPricingRulesSection.tsx` with all 8 rule types: DEMAND, SEASON, WEEKEND, DURATION, ADVANCE_BOOKING, AVAILABILITY, DESTINATION, FLEET_SIZE
- ✅ **Admin Insurance Settings SLA v1.1 alignment** — Full rewrite of `InsuranceSettingsSection.tsx` matching Pay-U Damage Protection SLA v1.1 (daily rate, excess %, coverage cap, target segment, international cap)
- ✅ **Insurance packages migration** — `20260403232558_add_insurance_sla_columns.sql` adds `daily_rate`, `excess_percentage`, `target_segment`, `international_cap_usd` to `insurance_packages`
- ✅ **Build error fix** — Resolved `useDynamicPricingRules.ts` build error (missing `condition_type` field in insert)
- ✅ **Security audit completed** — 9 actionable findings documented in `docs/hotfixes/SECURITY_REMEDIATION_2026_04_04.md` (MOB-701 through MOB-709)
- ✅ **BUG-003 documented** — `notification_type__old_version_to_be_dropped` dependency error identified, root cause analysed, fix plan created with MOB-801/MOB-802
- ✅ **Documentation sync** — BUG-001 moved to Resolved in `BUG_REPORT.md`; Sprint 8 ADM-001/ADM-002 marked Done; Week 1 April status updated
- ✅ **Sprint 9 Arnold tickets all complete** — S9-001 through S9-004, S9-009, S9-010, S9-011, S9-015 all delivered 2026-03-28
- ✅ **SSRF protection shipped** — Domain whitelist added to `send-push-notification/index.ts` blocking malicious outbound scanning (BUG-004)
- ✅ **16 compromised scripts deleted** — All hardcoded `service_role` and `anon` keys removed from codebase (9 on Apr 5, 7 on Apr 6)
- ✅ **`.env` secured** — `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ACCESS_TOKEN` removed; service role key now only in Edge Function Secrets

---

### Critical Issues

- 🟡 **BUG-002: Security Vulnerabilities (MOB-701–709)** — MOB-701 (hardcoded secrets) now in progress: 16 scripts deleted, `.env` cleaned, keys rotated. MOB-710 (SSRF) resolved. Remaining: MOB-702–709.
- 🔴 **BUG-003: `notification_type` enum blocks `db pull`** — 7 functions reference old enum type. Fix plan exists (MOB-801/802), not yet applied to migrations.
- 🟡 **Sprint 9 Duma tickets (S9-005–S9-008, S9-012–S9-014)** — 5 not started, 3 in progress. Service wiring, consent on signup, and cron jobs pending.
- 🟡 **Sprint 9 Tapologo tickets (S9-016–S9-020)** — All 5 not started. Unit tests and Android verification pending.
- 🟡 **MOB-110/130–138 (Anonymize-on-Delete)** — Phase 1 columns done; Phase 2 edge function refactor (S9-008) not started.
- 🟡 **Android build pipeline verification** — Still unverified by Tapologo/QA.

---

## 📈 Production Readiness Metrics

| Metric | Week 4 Mar | Week 1 Apr | **Week 2 Apr** | Change | Target |
|--------|------------|------------|----------------|--------|--------|
| Build Errors | 0 | **0** | **0** | — | 0 |
| Linter Warnings | 15 | **15** | **15** | — | <20 |
| System Health | 84% | **85%** | **86%** | +1 (Admin Settings + Insurance SLA aligned) | 95% |
| Production Readiness | 83% | **84%** | **86%** | +2 (Dynamic Pricing UI + Insurance SLA + security plan) | 95% |
| Test Coverage | 62% | **62%** | **62%** | — | 85% |
| Security Vulnerabilities | 4 | **4** | **7** | +3 (9 found, 2 addressed: hardcoded keys + SSRF) | 0 |
| Database Migrations | ~257 | **~257** | **~258** | +1 (insurance_packages SLA columns) | — |
| Edge Functions | 31 | **31** | **31** | — | — |
| Known Bugs | ~2 | **~2** | **~4** | +2 (BUG-002 registered as 1 epic, BUG-003 new) | 0 |
| Capacitor Packages | 3 | **3** | **3** | — | — |

### Gap Analysis to Target (95%)

| Category | Current | Gap | Path to Close |
|----------|---------|-----|---------------|
| Production Readiness | 86% | 9% | Security remediation (MOB-700), service wiring (S9-005–007), anonymize-on-delete Phase 2, auth compliance P3 |
| Test Coverage | 62% | 23% | Tapologo Sprint 9/10 test tickets (S9-016–019), CI integration |
| System Health | 86% | 9% | Fix BUG-003 (db pull), ship MOB-700 security fixes, verify Android |

---

## 🧩 System Health Explanation (Apr 4 → Apr 10)

- **Admin Settings overhauled** — Dynamic Pricing now supports DESTINATION rule type and all 8 pricing rules. Insurance Settings rebuilt to Pay-U SLA v1.1 spec with daily rate model, excess percentages per tier, coverage caps, and international caps.
- **Security audit completed** — First comprehensive security scan performed; 9 findings documented with acceptance criteria and migration SQL. Increases known vulnerability count but establishes remediation path.
- **BUG-003 identified** — `supabase db pull` fails due to `notification_type` enum dependencies in 7 functions. Fix is migration-only (drop old function signatures before dropping type).
- **Documentation fully synced** — BUG-001 resolved status propagated to all status reports. Sprint 8 ADM-001/ADM-002 marked complete.
- **Build stability maintained** — Zero compile regressions. `tsc --noEmit` passes clean.

---

## 🐛 Known Bugs & Bugfix Implementation Plan

Active bugs are tracked in [`docs/BUG_REPORT.md`](../BUG_REPORT.md).

### Bug Count Rollup

| ID | Severity | Status | Description | Plan |
|----|----------|--------|-------------|------|
| BUG-001 | Critical | ✅ Resolved (2026-03-28) | `create_handover_notification` return type conflict | [HOTFIX_DB_PULL_FIX_2026_03_28.md](../hotfixes/HOTFIX_DB_PULL_FIX_2026_03_28.md) |
| BUG-002 | Critical–Low (9 findings) | 🔴 Open | Security vulnerabilities: RLS, edge functions, credentials | [SECURITY_REMEDIATION_2026_04_04.md](../hotfixes/SECURITY_REMEDIATION_2026_04_04.md) |
| BUG-003 | Critical (blocks db pull) | 🔴 Open | `notification_type__old_version_to_be_dropped` dependency error | [HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md](../hotfixes/HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md) |

---

## 🗓️ Sprint Overview

### Sprint 9 Status (April 7–13) — IN PROGRESS

**Theme:** Infrastructure Stability + Compliance + Test Coverage  
**Progress:**

| Member | Completed | In Progress | Not Started | Total |
|--------|-----------|-------------|-------------|-------|
| Arnold | 9 | 0 | 0 | 9 ✅ ALL DONE |
| Duma | 0 | 3 | 5 | 8 |
| Tapologo | 0 | 0 | 5 | 5 |
| **TOTAL** | **9** | **3** | **10** | **22** |

**Arnold's completed tickets:**
- S9-001: BUG-001 fix (legacy handover notification overload dropped)
- S9-002: `platform_settings` table + RPCs + seeds
- S9-003: `dynamic_pricing_rules` table + 8 rules seeded
- S9-004: `profiles` soft-delete columns
- S9-009: `bulk-delete-users` anonymize + soft-delete refactor
- S9-010: Admin UI guard for deleted users
- S9-011: `user_consents` table + RLS
- S9-015: `unverified-reminder` edge function + cron

**Duma in-progress:**
- S9-005: Commission rates → platform_settings wiring (verify)
- S9-006: Dynamic pricing service → DB read (audit)
- S9-007: Insurance admin fee → platform_settings (verify)

**Not started (Duma):** S9-008, S9-012, S9-013, S9-014  
**Not started (Tapologo):** S9-016, S9-017, S9-018, S9-019, S9-020

### Sprint 10 Plan (April 14–20) — UPCOMING

**Theme:** Security Remediation + Service Wiring Completion + Test Coverage  
See: [SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md](SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md)

---

## Completed Tasks

| Task | Completion Date | Owner | Impact |
|------|----------------|-------|--------|
| Admin Dynamic Pricing UI rewrite (8 rule types + DESTINATION) | 2026-04-04 | Modisa | Unblocks admin destination-based pricing configuration |
| Admin Insurance Settings SLA v1.1 rewrite | 2026-04-04 | Modisa | Aligns insurance UI with Pay-U SLA v1.1 spec |
| Insurance packages migration (4 new columns) | 2026-04-04 | Modisa | `daily_rate`, `excess_percentage`, `target_segment`, `international_cap_usd` added |
| `useDynamicPricingRules.ts` build error fix | 2026-04-04 | Modisa | Restores clean build |
| Security audit + MOB-700 remediation plan | 2026-04-04 | Modisa | 9 findings documented with fix instructions |
| BUG-003 root cause analysis + fix plan | 2026-04-04 | Modisa | MOB-801/802 plan ready for execution |
| Documentation status sync (BUG-001, ADM-001/002) | 2026-04-04 | Modisa | All reports now reflect accurate completion status |
| S9-001 through S9-004, S9-009–011, S9-015 | 2026-03-28 | Arnold | Sprint 9 infrastructure + compliance tickets |

---

## Remaining Tasks

| Task | Owner | Estimated Date | Priority |
|------|-------|----------------|----------|
| S9-005: Commission rates → platform_settings wiring | Duma | Apr 11 | P0 |
| S9-006: Dynamic pricing service → DB wiring | Duma | Apr 11 | P1 |
| S9-007: Insurance admin fee → platform_settings | Duma | Apr 11 | P1 |
| S9-008: `delete-user-with-transfer` refactor | Duma | Apr 12 | P1 |
| S9-012: Store consent record on signup | Duma | Apr 12 | P1 |
| S9-013: Rental-reminder cron job | Duma | Apr 13 | P1 |
| S9-014: Return-reminder cron job | Duma | Apr 13 | P1 |
| S9-016: Unit tests — handover lifecycle | Tapologo | Apr 11 | P1 |
| S9-017: Unit tests — insurance claims | Tapologo | Apr 12 | P1 |
| S9-018: Unit tests — admin portal | Tapologo | Apr 13 | P2 |
| S9-019: Unit tests — booking extension | Tapologo | Apr 13 | P2 |
| S9-020: Android gradle verification | Tapologo | Apr 11 | P1 |
| MOB-701: Remove hardcoded secrets | Arnold | Apr 14 | P0 |
| MOB-702: Auth-gate `add-admin` edge function | Arnold | Apr 14 | P0 |
| MOB-703: Drop blanket notifications policy | Arnold | Apr 15 | P0 |
| MOB-801: Drop old enum-dependent functions | Arnold | Apr 14 | P0 |
| MOB-802: Remove redundant enum block | Arnold | Apr 14 | P0 |

---

### ✅ Week 2 April Success Criteria Checklist

| # | Success Criteria Item | Status |
|---|----------------------|--------|
| 1 | ✅ **Dynamic Pricing UI supports DESTINATION rule type** | COMPLETE |
| 2 | ✅ **Insurance Settings matches Pay-U SLA v1.1** (daily rate, excess %, caps, segments) | COMPLETE |
| 3 | ✅ **Insurance packages migration shipped** (4 new columns) | COMPLETE |
| 4 | ✅ **Build error resolved** (`useDynamicPricingRules.ts`) | COMPLETE |
| 5 | ✅ **Security audit completed** — 9 findings documented with remediation plan | COMPLETE |
| 6 | ✅ **BUG-003 documented** — Root cause + fix plan (MOB-801/802) | COMPLETE |
| 7 | ✅ **Documentation fully synced** — BUG-001 resolved, ADM-001/002 done | COMPLETE |
| 8 | ✅ **Build stability maintained** — Zero regressions | COMPLETE |
| 9 | ❌ **BUG-003 fix applied** — Migration edits not yet shipped | CARRY → Sprint 10 |
| 10 | ❌ **Security remediation started** — MOB-701–709 not yet executed | CARRY → Sprint 10 |
| 11 | ❌ **Android build verified** — Still pending Tapologo | CARRY → Sprint 10 |

---

## 🏛️ Epic Status Updates

| Epic | ID | Status | Progress | Notes |
|------|----|--------|----------|-------|
| Admin Settings & Business Logic | ADM | 🟡 UI Complete | 60% | Dynamic Pricing + Insurance UI rewritten; service wiring pending (S9-005–007) |
| Dynamic Pricing | DYN | 🟡 UI Complete | 60% | All 8 rule types in UI including DESTINATION; DB table exists; service wiring pending |
| Insurance / Damage Protection | INS | 🟡 SLA v1.1 Aligned | 85% | UI matches SLA v1.1; migration shipped; claim management done |
| Handover Consolidation | MOB-500 | ✅ Complete | 100% | — |
| Auth Compliance (MOB-600) | MOB-600 | 🟡 P0–P2 Done | 85% | `user_consents` table exists; consent storage on signup pending (S9-012) |
| Anonymize-on-Delete | MOB-110 | 🟡 Phase 1 Done | 40% | Soft-delete columns + bulk-delete refactored; `delete-user-with-transfer` pending (S9-008) |
| Notification Enhancement (MOB-800) | MOB-800 | 🟡 Email done | 65% | Unverified reminder deployed; rental/return cron pending (S9-013/014) |
| Security Hardening | MOB-700 | 🔴 Planned | 10% | 9 findings documented; remediation not started |
| DB Pull Fix | BUG-003 | 🔴 Plan Ready | 0% | MOB-801/802 fix plan created; migrations not edited |
| Admin Portal Restoration | MOB-100 | ✅ Complete | 100% | — |
| Rental Lifecycle (MOB-200) | MOB-200 | ✅ Complete | 100% | — |
| Help Center | MOB-300 | ✅ Complete | 100% | — |
| Interactive Handover | MOB-500 | ✅ Complete | 100% | — |
| Avatar / UI Display | MOB-118 | ✅ Complete | 100% | — |
| Map & Location | MOB-220 | ✅ Complete | 100% | — |

---

## ⚠️ Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| BUG-003 blocks `db pull` / schema sync | High | High | Ship MOB-801/802 in Sprint 10 Day 1 |
| Security vulnerabilities (MOB-700) in production | High | Critical | Begin MOB-701/702/703 (P0) in Sprint 10 |
| Sprint 9 Duma/Tapologo tickets slip | Medium | Medium | Carry unfinished to Sprint 10; re-prioritise |
| Test coverage stagnant at 62% | High | Medium | Tapologo dedicated to tests in Sprint 10 |
| Android CI inconsistency | Medium | Medium | Escalate to Tapologo as P1 in Sprint 10 |
| Anonymize-on-Delete Phase 2 incomplete | Medium | High | S9-008 is prerequisite for compliance; escalate |

---

## 📌 Action Items

### P0 — Next Sprint (Sprint 10, April 14–20)

| # | Action | Owner | Due |
|---|--------|-------|-----|
| 1 | Ship BUG-003 fix (MOB-801 + MOB-802) — edit migration files | Arnold | Apr 14 |
| 2 | Ship MOB-701 — Remove hardcoded secrets from scripts | Arnold | Apr 14 |
| 3 | Ship MOB-702 — Auth-gate `add-admin` edge function | Arnold | Apr 15 |
| 4 | Ship MOB-703 — Drop blanket notifications read policy | Arnold | Apr 15 |
| 5 | Complete S9-005/006/007 service wiring (carry from Sprint 9) | Duma | Apr 15 |

### P1 — Next Sprint

| # | Action | Owner | Due |
|---|--------|-------|-----|
| 6 | Ship MOB-704–706 — RLS for financial tables + edge function validation | Arnold | Apr 16 |
| 7 | Complete S9-008 (`delete-user-with-transfer` refactor) | Duma | Apr 16 |
| 8 | Complete S9-012 (consent record on signup) | Duma | Apr 17 |
| 9 | Complete S9-013/014 (rental + return reminder crons) | Duma | Apr 18 |
| 10 | Ship S9-016–019 unit tests | Tapologo | Apr 18 |
| 11 | Verify Android gradle wrapper in CI (S9-020) | Tapologo | Apr 15 |

### P2 — Backlog

| # | Action | Owner | Due |
|---|--------|-------|-----|
| 12 | Ship MOB-707–709 — search_path, password hashing, author email, leaked-password | Arnold | Apr 21+ |
| 13 | SMS service integration for Botswana | TBD | TBD |
| 14 | Payment Phase 1 (real provider integration) | TBD | Pending credentials |

---

## 📑 New Planning Documents Created This Period

| Document | Purpose | Location |
|----------|---------|----------|
| Security Remediation Plan (MOB-700) | 9-ticket security fix plan | [SECURITY_REMEDIATION_2026_04_04.md](../hotfixes/SECURITY_REMEDIATION_2026_04_04.md) |
| BUG-003 Hotfix Plan (MOB-801/802) | Fix `db pull` enum dependency error | [HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md](../hotfixes/HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md) |
| Sprint 10 Execution Plan | Next sprint team assignments | [SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md](SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md) |

---

## 📚 Reference Documents

### Active Plans
- [Insurance Production Readiness Plan](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md)
- [Admin Settings Implementation Plan](../20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md)
- [Email Notification Enhancement Plan](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md)
- [Anonymize-on-Delete Plan](../plans/ANONYMIZE_ON_DELETE_2026_03_02.md)
- [Damage Protection SLA v1.1](Damage%20Protection%20Service%20Level%20Agreement.md)
- [Security Remediation Plan](../hotfixes/SECURITY_REMEDIATION_2026_04_04.md)

### Conventions & Workflow
- [AI Development Workflow](../conventions/AI_WORKFLOW.md)
- [Migration Protocol](../conventions/MIGRATION_PROTOCOL.md)

### Bug Tracking
- [Active Bug Report](../BUG_REPORT.md)
- [Sprint 8 Bug Registry](BUGFIX_IMPLEMENTATION_KNOWN_BUGS_WEEK_4_MARCH_2026.md)

### Testing
- [Pre-Launch Testing Protocol](../testing/PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md)
- [Testing Coverage Status](../testing/TESTING_COVERAGE_STATUS_2026_03_02.md)

---

## 🏁 Conclusion

Week 2 April delivered significant alignment work: Admin Settings now match the PRD (destination pricing) and Pay-U SLA v1.1 (insurance tiers), and the first comprehensive security audit established the MOB-700 remediation backlog. Arnold's Sprint 9 infrastructure tickets are all complete. The focus for Sprint 10 shifts to **security remediation** (MOB-701–709), **BUG-003 fix** (db pull), completing Duma's service wiring carry-overs, and Tapologo's test coverage push. The path to 95% production readiness is now primarily blocked by security fixes and test coverage — both have clear execution plans.

**Next:** Week 3 April 2026 Status Report (April 17, 2026)

---

*Signed off by: Modisa Maphanyane*
