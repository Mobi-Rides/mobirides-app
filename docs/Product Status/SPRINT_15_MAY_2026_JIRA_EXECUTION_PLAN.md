# Sprint 15 Jira-Style Execution Plan
## MobiRides Application — May 16 – May 29, 2026

**Prepared by:** Modisa Maphanyane  
**Sprint:** Sprint 15  
**Date:** May 16, 2026  
**Status:** 🟡 IN PROGRESS  
**Week 3 May Status Report:** [WEEK_3_MAY_2026_STATUS_REPORT.md](WEEK_3_MAY_2026_STATUS_REPORT.md)  
**Week 4 May Status Report:** [WEEK_4_MAY_2026_STATUS_REPORT.md](WEEK_4_MAY_2026_STATUS_REPORT.md)  

---

## 🏛️ Past Sprint Reviews

| Sprint | Date | Focus | Review Link |
|--------|------|-------|-------------|
| Sprint 12 | Apr 18-28 | Stabilization & Integrity | [View Review](SPRINT_12_APRIL_2026_JIRA_EXECUTION_PLAN.md) |
| Sprint 13 | Apr 27-May 7 | Commercial Readiness & Technical Debt | [View Review](SPRINT_13_MAY_2026_JIRA_EXECUTION_PLAN.md) |
| Sprint 14 | May 8-15 | Security, Storage Reconciliation & UI Polishes | [View Review](SPRINT_14_MAY_2026_JIRA_EXECUTION_PLAN.md) |

---

## 📊 Executive Summary

Sprint 15 is the **ultimate stabilization and exit sprint** before the official V1.0 commercial launch in June. The primary directive for this sprint is achieving **Zero P0 Technical Debt**, resolving all outstanding functional regressions, and finalizing native mobile integrations.

To hit these strict pre-launch exit criteria, Sprint 15 is divided into two primary thrusts:
1. **Regression Remediation (BUG-074 through BUG-077)**: Execute a unified database-and-client repair plan to resolve administrative permissions RLS blocks, automated revenue splits reporting, and database transaction crashes in the renter reviews module.
2. **Rollover Feature Consolidation**: Complete the premium high-fidelity authentication landing redesign, implement fleet co-hosting permissions, and provision Google Cloud native push notification channels.

---

## 👥 Team Assignments

| Owner | Module Focus | Primary Responsibilities |
|-------|-------------|--------------------------|
| **Arnold (Snr Engineer)** | Security, Admin Logic | MOB-708 (PII), SAR-002 (Anomaly Detection), SAR-004 (OCR), MOB-160 (Fleet Co-hosting) |
| **Tapologo (QA / Test Engineer)** | QA, UI Redesign | Regression Testing, MOB-126 (Auth Redesign), AUD-004 (Mock Labels) |
| **Modisa (CEO)** | Architecture, Native, Plans | Native Integration (MOB-122), SAR-003 (Health), Sprint Oversight |
| **Antigravity (AI Architect)** | Core Regression & Databases | S15-001 through S15-004 (Core Bug Fixes), MOB-124 (Analytics Merge), MOB-151 (Rental Compliance) |

---

## 🎯 Sprint Objectives

1. **Zero High-Priority Regressions**: 100% resolution of BUG-074 through BUG-077, ensuring robust booking, review, and admin operations.
2. **Secure Admin Directories**: Full visibility of the admin management table via non-recursive security definer RPC operations.
3. **Audit and Splits Visibility**: Complete the "Insurance Policies" and "Financial Breakdown" dashboard views in the admin console.
4. **Crash-Free Reviews**: Deploy the database-level `release_pending_earnings` updates with multi-transaction reverse joins and wallet pre-seeding.
5. **Premium Auth Redesign**: Ship high-fidelity, brand-compliant Login/Signup landing screens.
6. **Push Integration**: Deploy Firebase native credentials (`google-services.json`).

---

## 📋 Sprint Backlog

### Category 1: Regression Remediation (P0) — NEW (Logged Bugs)
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S15-001** | Antigravity | P0 | 5 | 🔵 IN PROGRESS | **BUG-074**: Fix Admin Panel Approval bypassing payment flow. Use `bookingLifecycle` and manual confirm actions. |
| **S15-002** | Antigravity | P0 | 5 | 🔵 IN PROGRESS | **BUG-075**: Fix Admin Management Table self-only view RLS blocker using `get_admin_users_complete` RPC. |
| **S15-003** | Antigravity | P0 | 5 | 🔵 IN PROGRESS | **BUG-076**: Add "Insurance Policies" admin tab and booking "Financial Breakdown" splits card. |
| **S15-004** | Antigravity | P0 | 8 | 🔵 IN PROGRESS | **BUG-077**: Fix Renter Review submission saving crash by patching `release_pending_earnings` trigger routines. |
| **S15-005** | Antigravity | P0 | 3 | 🟢 COMPLETED | **BUG-078**: Fix Admin Settings Page render crash due to `settings` reference error in `PlatformSettingsSection`. |
| **S15-006** | Antigravity | P0 | 5 | 🟢 COMPLETED | **BUG-079**: Fix Dynamic Pricing Out of Zone Premium not applying due to case-sensitivity and inclusive days duration calculator. |
| **S15-007** | Antigravity | P0 | 5 | 🟢 COMPLETED | **BUG-080**: Fix Admin Settings Destination dropdown state updating race condition and correct Insurance excess percentage scale. |

---

### Category 2: Security & PII Protection (P0) — Rollover from Sprint 14
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-46** | Arnold | P0 | 5 | 🟡 TO DO | **MOB-708**: [EPIC] Reduce exposure of sensitive PII in profiles. |
| **S14-001** | Arnold | P1 | 3 | 🟡 TO DO | Implement RLS policies for profile PII fields. |

---

### Category 3: SuperAdmin Advanced Logic (P1) — Rollover from Sprint 14
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-118** | Arnold | P1 | 8 | 🟡 TO DO | **SAR-002**: Session Anomaly Detection & Lockdown Engine. |
| **MOB-119** | Modisa | P1 | 5 | 🟡 TO DO | **SAR-003**: System Health Monitoring & Auto-Cleanup tools. |
| **MOB-120** | Arnold | P2 | 8 | 🟡 TO DO | **SAR-004**: Document OCR & Automated Content Moderation. |
| **MOB-121** | Arnold | P2 | 5 | 🟡 TO DO | **SAR-005**: Signed Audit Log PDF Generation. |

---

### Category 4: Native Mobile Integration (P1) — Rollover from Sprint 14
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-122** | Modisa | P1 | 5 | 🟡 TO DO | Firebase/Google Services setup and `google-services.json` config. |

---

### Category 5: Storage & Merge Remediation (P0) — Rollover from Sprint 14
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-124** | Antigravity | P0 | 5 | 🔵 IN PROGRESS | Resolve Analytics Merge conflicts & satisfy static analysis. |
| **MOB-125** | Antigravity | P0 | 3 | 🟢 COMPLETED | Finalize Production Branding, resolve favicon browser cache cache-buster, and optimize social OG images. |
| **MOB-126** | Tapologo | P1 | 8 | ✅ DONE | [RE-DESIGN] Premium Auth Landing experience (Desktop & Mobile). Implemented via `AuthLandingShell`, `Login.tsx`, and `signup.tsx`. |
| **MOB-PAY-003** | Antigravity | P0 | 5 | 🟡 TO DO | [REMEDIATION] Finalize Realtime subscriptions and Pay Now UI actions. |

---

### Category 6: UI Stabilization & Compliance (P1) — Rollover from Sprint 14
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-151** | Antigravity | P0 | 8 | 🟡 TO DO | [COMPLIANCE] Mandatory T&C acceptance & Signed Rental Agreements. |
| **MOB-160** | Arnold | P1 | 13 | 🟡 TO DO | [FLEET] Co-hosting & Multi-user Fleet Management Infrastructure. |

---

### Category 7: Documentation Reconciliation & Audit (P1) — Rollover from Sprint 14
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **AUD-001** | Antigravity | P1 | 2 | 🟡 TO DO | Update `20260423_ADMIN_PORTAL_FUNCTIONALITY_AUDIT.md` (suspend/ban user status). |
| **AUD-002** | Antigravity | P1 | 2 | 🟡 TO DO | Realign Section 6 of `SECURITY_INCIDENT_REPORT_BUG004.md` with Sprint 14. |
| **AUD-003** | Antigravity | P1 | 2 | 🟡 TO DO | Update "Current Status" table in `PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md`. |
| **AUD-004** | Tapologo | P2 | 1 | ✅ DONE | Enforced "Mock/Pending" labeling across active payment documentation and investor-facing payment claims. |
| **AUD-005** | Modisa | P1 | 3 | 🟡 TO DO | funding/data_room — Ensure investor-facing docs are launch-ready. |

---

## 🚦 Execution Tracker

### Overall Progress
| Metric | Status |
|--------|--------|
| **Tasks Completed** | 6 of 28 |
| **Active Categories** | Regression Remediation, Storage & Merge Remediation, Tapologo QA/UI |
| **Current Blockers** | Firebase Provisioning (MOB-122) |

### Tapologo Sprint 15 Progress

| Responsibility | Status | Evidence |
|----------------|--------|----------|
| Regression Testing | ✅ DONE | Targeted checks completed for MOB-126 auth shell, corrected slogan, and AUD-004 payment labels. |
| MOB-126 Auth Redesign | ✅ DONE | `AuthLandingShell` powers `Login.tsx` and `signup.tsx`; split-screen desktop and stacked mobile layout implemented. |
| AUD-004 Mock Labels | ✅ DONE | Active payment docs and investor-facing payment references explicitly state `Mock/Pending`. |

---

## 🏁 Final Sprint Goal
Achieve **Zero Known Regressions (P0)**, complete all structural database updates, and establish complete Native Push integration for the V1.0 June release.

---

*Document prepared: May 16, 2026 (Updated: May 25, 2026)*  
*Status: 🟡 IN PROGRESS*  
*Reviewer: Modisa Maphanyane (CEO)*  
*System Auditor: Antigravity AI*
