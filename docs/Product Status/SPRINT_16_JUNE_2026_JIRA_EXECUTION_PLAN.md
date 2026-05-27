# Sprint 16 Jira-Style Execution Plan
## MobiRides Application — June 1 – June 14, 2026

**Prepared by:** Modisa Maphanyane  
**Sprint:** Sprint 16  
**Date:** May 31, 2026  
**Status:** 🔵 PLANNED  
**Prior Sprint:** [SPRINT_15_MAY_2026_JIRA_EXECUTION_PLAN.md](SPRINT_15_MAY_2026_JIRA_EXECUTION_PLAN.md)  
**H1 2026 Roadmap Reference:** [20260410_Roadmap_2026_H1.md](../Roadmaps%20%26%20PRDs/20260410_Roadmap_2026_H1.md)  

---

## 🏛️ Past Sprint Reviews

| Sprint | Date | Focus | Review Link |
|--------|------|-------|-------------|
| Sprint 14 | May 8-15 | Security & Storage Reconciliation | [View Review](SPRINT_14_MAY_2026_JIRA_EXECUTION_PLAN.md) |
| Sprint 15 | May 16-29 | V1.0 Launch Readiness & Regressions | [View Review](SPRINT_15_MAY_2026_JIRA_EXECUTION_PLAN.md) |

---

## 📊 Executive Summary

Sprint 16 is the **strategic post-stabilization and retentive growth sprint** immediately following the V1.0 launch window. With the P0 regressions, custodial payment gates, and Firebase push credentials secured in Sprint 15, the engineering focus shifts from reactive remediation to **operational scaling** and **organic user acquisition**.

The core targets for Sprint 16 are:
1. **Delegated Operations (MOB-180 Epic):** Build the Co-hosting and Fleet Management infrastructure to support commercial partners.
2. **Growth & Loyalty (MOB-192 Epic):** Implement tiered member discounts and organic peer referral loops to drive viral signups.
3. **Automated Reminders (MOB-196):** Establish production cron triggers for booking, rental, and return reminders.
4. **Test Pipeline Restoration (MOB-197):** Fix compiler memory bottlenecks, mock import-meta variables, and raise actual coverage to the target benchmark of **80%+**.

---

## 👥 Team Assignments

| Owner | Module Focus | Primary Responsibilities |
|-------|-------------|--------------------------|
| **Arnold (Snr Engineer)** | Infrastructure, Fleet | MOB-180 through MOB-183 (DB, RLS, RPCs), MOB-187 (Hooks), MOB-189 (Messaging) |
| **Tapologo (QA / Test Engineer)** | QA, Frontend UI, Growth | MOB-184 (Team UI), MOB-188 (Badges), MOB-194 (Growth UI), MOB-206 (Fetch Retry), MOB-207 through MOB-215 (Test Coverage 90%+) |
| **Modisa (CEO / AI-Assisted)** | Architecture, Wallets, Admin, UI | MOB-185/186 (Invitation logic), MOB-192/193 (Loyalty Backend), MOB-195 (Admin Referral), MOB-196 (Crons), MOB-199 (Launch Program), MOB-201 (Telemetry), MOB-202 (Host Dashboard), MOB-203 (Revenue Analytics) |

---

## 🎯 Sprint Objectives

1. **Production Co-hosting:** Multi-user fleet dashboards and delegated booking approvals live.
2. **Organic Referral Loops:** Verified referral code sharing and manual review validation tools.
3. **Loyalty Discounts:** Tiered loyalty discounts (Silver, Gold, Platinum) integrated into pricing summary.
4. **Hardened Test Suite:** Zero compile crashes, Jest OOM fixed, and actual test coverage $\ge 90\%$.
5. **Scheduled Reminders:** Omnichannel cron notifications fully operational in production.

---

## 📋 Sprint Backlog

### Category 1: Co-Hosting & Fleet Management Infrastructure (P1) — Mapped from legacy MOB-160
*Tracked in details plan:* [20260516_COHOSTING_AND_FLEET_MANAGEMENT_EXECUTION_PLAN.md](../plans/20260516_COHOSTING_AND_FLEET_MANAGEMENT_EXECUTION_PLAN.md)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-180** | Arnold | P1 | 13 | 🔵 PLANNED | **[EPIC]**: Co-hosting and Multi-user Fleet Operations |
| **MOB-181** | Arnold | P1 | 5 | 🔵 PLANNED | Create `host_team_members` table and Invitation state machine. |
| **MOB-182** | Arnold | P1 | 3 | 🔵 PLANNED | Update RLS policies on `cars`, `bookings`, `reports` for team access. |
| **MOB-183** | Arnold | P1 | 3 | 🔵 PLANNED | Implement `getAuthorizedFleets` RPC database helper. |
| **MOB-184** | Tapologo | P1 | 5 | 🔵 PLANNED | Build "Team Management" settings dashboard UI (Email Invites). |
| **MOB-185** | Modisa | P1 | 5 | 🔵 PLANNED | Develop invitation acceptance deep-linking and validations. |
| **MOB-186** | Modisa | P1 | 3 | 🔵 PLANNED | Implement toggle permission controls (JSONB updates in DB). |
| **MOB-187** | Arnold | P1 | 5 | 🔵 PLANNED | Refactor `useHostCars` and `useHostBookings` dashboard hooks. |
| **MOB-188** | Tapologo | P2 | 2 | 🔵 PLANNED | Add "Managed by [Team]" visual badges to host layouts. |
| **MOB-189** | Arnold | P1 | 5 | 🔵 PLANNED | Enable co-hosts to participate in booking chat & messaging. |
| **MOB-190** | Modisa | P2 | 3 | 🔵 PLANNED | Configure multi-target notification triggers for team alerts. |
| **MOB-191** | Modisa | P2 | 2 | 🔵 PLANNED | Track and log "Action Performed By" metadata to audit tables. |

---

### Category 2: Rewards, Loyalty & Referral Ecosystem (P1)
*Tracked in details plan:* [20260508_REWARDS_LOYALTY_REFERRAL_IMPLEMENTATION_PLAN.md](../plans/20260508_REWARDS_LOYALTY_REFERRAL_IMPLEMENTATION_PLAN.md)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-192** | Modisa | P1 | 5 | 🔵 PLANNED | Deploy `user_loyalty_tiers` database migration and trigger updates on booking completions. |
| **MOB-193** | Modisa | P1 | 3 | 🔵 PLANNED | Update `DynamicPricingService` logic to apply tiered loyalty fee multipliers (Bronze, Silver, Gold, Platinum). |
| **MOB-194** | Tapologo | P1 | 5 | 🔵 PLANNED | Build `ReferralDashboard` component and referral code input fields in SignUp/BookingDialogs. |
| **MOB-195** | Modisa | P1 | 5 | 🔵 PLANNED | Build `ReferralVerificationTable` in SuperAdmin portal and integrate credit rewards into the `walletService`. |

---

### Category 3: Scheduled Cron Notifications (P2)
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-196** | Modisa | P2 | 5 | 🔵 PLANNED | Set up automated scheduler trigger configurations for `booking-reminders` edge functions to automate rental/return alerts. |

---

### Category 4: Test Coverage Benchmarking (Target: 90%+) (P1)
*Tracked in details plan:* [20260527_TEST_COVERAGE_90_PERCENT_IMPLEMENTATION_PLAN.md](../plans/20260527_TEST_COVERAGE_90_PERCENT_IMPLEMENTATION_PLAN.md)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-207** | Tapologo | P0 | 3 | 🔵 PLANNED | Jest TS Compiler isolatedModules & Worker Memory Throttling to prevent OOM build crashes. |
| **MOB-208** | Tapologo | P0 | 3 | 🔵 PLANNED | Mock `import.meta` and Vite environment variables in Jest mock setup to prevent parsing syntax errors. |
| **MOB-209** | Tapologo | P1 | 5 | 🔵 PLANNED | Write unit tests for custom hook `useOptimizedConversations.ts`, mocking realtime streams. |
| **MOB-210** | Tapologo | P1 | 5 | 🔵 PLANNED | Write unit tests for `verificationService.ts`, mocking OCR and document parsing. |
| **MOB-211** | Tapologo | P1 | 3 | 🔵 PLANNED | Write unit tests for `insuranceService.ts`, validating standard rates, excess percentages, and splits. |
| **MOB-212** | Tapologo | P2 | 5 | 🔵 PLANNED | Write component tests for `CarImageManager.tsx`, verifying file upload UI and states. |
| **MOB-213** | Tapologo | P2 | 5 | 🔵 PLANNED | Write component tests for `Map.tsx`, verifying pins, Suggestions List, and side drawer. |
| **MOB-214** | Tapologo | P2 | 5 | 🔵 PLANNED | Write component tests for Login/Signup Auth Form flow (`Login.tsx`). |
| **MOB-215** | Tapologo | P2 | 3 | 🔵 PLANNED | Configure GitHub Action CI/CD gates to enforce strict 90%+ coverage thresholds on pull requests. |

---

### Category 5: Launch Operations & Release Dashboards (P0)
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-199** | Modisa | P0 | 8 | 🔵 PLANNED | **[LAUNCH]**: Official launch program setup (50 users, Gaborone operations). (Linear `MOB-181`) |
| **MOB-200** | Tapologo | P1 | 5 | 🔵 PLANNED | **[APK]**: Android Capacitor APK distribution compilation and Play Console deployment. (Linear `MOB-182`) |
| **MOB-201** | Modisa | P1 | 3 | 🔵 PLANNED | **[TELEMETRY]**: User onboarding flow telemetry and post-launch feedback loops. (Linear `MOB-183`) |
| **MOB-202** | Modisa | P2 | 5 | 🔵 PLANNED | **[DASHBOARD]**: Host performance dashboard UI integration. (Linear `MOB-184`) |
| **MOB-203** | Modisa | P2 | 5 | 🔵 PLANNED | **[DASHBOARD]**: Revenue analytics administrative dashboard inside SuperAdmin console. (Linear `MOB-185`) |

---

### Category 6: Missing Backend Gaps & Resiliency (P1)
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-204** | Arnold | P1 | 3 | 🔵 PLANNED | **[BUG-003]**: Resolve PostgreSQL enum block by dropping duplicate `old_notification_type` type constraints. (Linear `MOB-186`) |
| **MOB-205** | Arnold | P1 | 5 | 🔵 PLANNED | **[GDPR/P2]**: Implement `transfer_vehicle` DB stored procedure and integrate into Deno delete edge function. (Linear `MOB-187`) |
| **MOB-206** | Tapologo | P1 | 5 | 🔵 PLANNED | **[RESILIENCY]**: Implement client-side fetch retry adapter with backoff across all Edge Function service modules. (Linear `MOB-188`) |

---

## 🚦 Execution Tracker

### Overall Progress
| Metric | Planned | Status | Target |
|--------|---------|--------|--------|
| **Total Story Points** | 153 Points | 🔵 PLANNED | 100% Velocity |
| **Backlog Tasks** | 37 Tasks | 🔵 PLANNED | Zero Spillover |
| **Actual Test Coverage**| 64.90% | 🔴 Below Target | $\ge 90.00\%$ |

---

*Document generated: May 27, 2026 (Updated: May 27, 2026)*  
*Reviewer: Modisa Maphanyane (CEO)*  
*System Auditor: Antigravity AI*
