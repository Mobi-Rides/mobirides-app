# Sprint 14 Jira-Style Execution Plan
## MobiRides Application — May 8 – May 15, 2026

**Prepared by:** Modisa Maphanyane  
**Sprint:** Sprint 14  
**Date:** May 8, 2026  
**Status:** 🟡 IN PROGRESS  
**Week 1 May Status Report:** [WEEK_1_MAY_2026_STATUS_REPORT.md](WEEK_1_MAY_2026_STATUS_REPORT.md)

---

## 🏛️ Past Sprint Reviews

| Sprint | Date | Focus | Review Link |
|--------|------|-------|-------------|
| Sprint 11 | Apr 13-20 | Email Restoration & Hardening | [View Review](SPRINT_11_APRIL_2026_JIRA_EXECUTION_PLAN.md) |
| Sprint 12 | Apr 18-28 | Stabilization & Integrity | [View Review](SPRINT_12_APRIL_2026_JIRA_EXECUTION_PLAN.md) |
| Sprint 13 | Apr 27-May 7 | Commercial Readiness & Technical Debt | [View Review](SPRINT_13_MAY_2026_JIRA_EXECUTION_PLAN.md) |

---

## 📊 Executive Summary

Sprint 14 is the **final stabilization sprint** before the V1.0 commercial launch. Following the successful resolution of the build infrastructure blockers and the deployment of core commercial features (Duration Pricing, Map Hooks) in Sprint 13, the focus now shifts to **Security Hardening**, **Storage Infrastructure Reconciliation**, **Advanced SuperAdmin Logic**, and **Final Documentation Compliance**.

This sprint also marks the initiation of the **Native Mobile Integration** phase, specifically targeting the provisioning of Firebase/Google Cloud services for push notifications.

**Primary Targets for Sprint 14:**
1.  **Security (MOB-708)**: Finalize PII exposure reduction in public profiles.
2.  **Storage Reconciliation (MOB-123)**: Resolve missing buckets and re-implement folder-aware RLS policies.
3.  **SuperAdmin Remediation (SAR-002 to SAR-005)**: Deploy advanced security and audit tools.
4.  **V1.0 Documentation Compliance**: Finalize and integrate all legal and instructional artifacts (ToS, Privacy, Insurance, Tutorials).
5.  **Analytics & Merge Remediation (MOB-124)**: Resolve merge conflicts and satisfy static analysis requirements for launch.
6.  **Native Integration**: Provision `google-services.json` and initialize Push Notifications.
7.  **Technical Debt**: Cleanup legacy components and orphaned code.

---

## 👥 Team Assignments

| Owner | Module Focus | Primary Responsibilities |
|-------|-------------|--------------------------|
| **Arnold (Snr Engineer)** | Security, Admin Logic | MOB-708 (PII), SAR-002 (Anomaly Detection), SAR-004 (OCR) |
| **Tapologo (QA / Test Engineer)** | QA, Documentation | Regression Testing, Documentation Audit, QA Verification |
| **Modisa (CEO)** | Architecture, Native, Plans | Native Integration (MOB-122), SAR-003 (Health), Sprint Oversight |

---

## 🎯 Sprint Objectives

1.  **V1.0 Doc Audit**: 100% compliance of all legal/instructional docs in UI.
2.  **Storage Reconciled**: 100% parity between UI bucket usage and DB schema (MOB-123).
3.  **PII Protection**: Restrict email/phone visibility in public APIs (MOB-708).
4.  **Analytics Parity**: Resolved all merge conflicts in analytics hooks and services (MOB-124).
5.  **Anomaly Detection**: Implement the first phase of the session lockdown engine (SAR-002).
6.  **Audit Integrity**: Deploy Signed Audit Log PDF generation (SAR-005).
7.  **Push Foundation**: Get Firebase provisioning confirmed and config injected.

---

## 📋 Sprint Backlog

### Category 1: Security & PII Protection (P0)
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-46** | Arnold | P0 | 5 | 🟡 TO DO | MOB-708: [EPIC] Reduce exposure of sensitive PII in profiles. |
| **S14-001** | Arnold | P1 | 3 | 🟡 TO DO | Implement RLS policies for profile PII fields. |

### Category 2: SuperAdmin Advanced Logic (P1)
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-118** | Arnold | P1 | 8 | 🟡 TO DO | SAR-002: Session Anomaly Detection & Lockdown Engine. |
| **MOB-119** | Modisa | P1 | 5 | 🟡 TO DO | SAR-003: System Health Monitoring & Auto-Cleanup tools. |
| **MOB-120** | Arnold | P2 | 8 | 🟡 TO DO | SAR-004: Document OCR & Automated Content Moderation. |
| **MOB-121** | Arnold | P2 | 5 | 🟡 TO DO | SAR-005: Signed Audit Log PDF Generation. |

### Category 3: V1.0 Documentation Suite (P0)
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S14-002** | Antigravity | P0 | 3 | ✅ DONE | Finalize Renter/Host Terms and integrate into UI. |
| **S14-003** | Tapologo | P1 | 2 | 🟡 TO DO | Verify Tutorial flow alignment with `TutorialSteps.md`. |

### Category 4: Native Integration (P1)
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-122** | Modisa | P1 | 5 | 🟡 TO DO | Firebase/Google Services setup and `google-services.json` config. |

### Category 5: Storage & Merge Remediation (P0)
| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **MOB-123** | Antigravity | P0 | 8 | 🔵 IN PROGRESS | Master Storage Reconciliation: Fix missing buckets & RLS drift. |
| **MOB-124** | Antigravity | P0 | 5 | 🔵 IN PROGRESS | Resolve Analytics Merge conflicts & satisfy static analysis. |
| **S14-004** | Antigravity | P1 | 3 | 🟡 TO DO | Execute Master Storage Migration & Verify Multi-Tenant Isolation. |

---

## 🚦 Execution Tracker

### Overall Progress
| Metric | Status |
|--------|--------|
| **Tasks Completed** | 1 of 15 |
| **Current Blockers** | Storage Policy Inconsistency (BUG-054-058), Analytics Merge Parity (BUG-059) |

---

## 🏁 Final Sprint Goal
Achieve **Zero P0 Technical Debt** and **100% Documentation Compliance** for the June V1.0 Launch.
