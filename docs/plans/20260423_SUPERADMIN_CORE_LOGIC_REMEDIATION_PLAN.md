# SuperAdmin Core Logic Remediation Plan
## Targeted "Next Sprint" Execution (Post-Sprint 12)

**Status:** 📅 DRAFT (For Sprint 13 Inclusion)  
**Priority:** High (Technical Debt & Logic Gaps)  
**Reference:** `20260423_ADMIN_PORTAL_FUNCTIONALITY_AUDIT.md`
**Date:** April 23, 2026

---

## 📊 Executive Summary
This action plan addresses the "Logic-Stalled" state of the SuperAdmin portal discovered during the April 23, 2026 audit. While high-fidelity UI components exist, critical backend logic is missing across 11 major roadmap items. This plan outlines the database, service-layer, and AI-integration work required to bring the portal to full production readiness.

---

## 🏛️ Module 1: Core Lifecycle Logic (Partial/Missing)
**Objective:** Restore core administrative control functions.

### T1.1 — User Management Logic (BUG-011)
- **Task**: Implement `public.suspend_user()` and `public.ban_user()` RPCs.
- **Logic**: Update profile status, log to audit trail, and interface with Supabase Auth to restrict JWT issuance.
- **UI**: Wire `UserManagement.tsx` buttons to these live endpoints.

### T1.2 — Vehicle Asset Transfer (BUG-011)
- **Task**: Implement `public.transfer_vehicle()` RPC.
- **Logic**: Reassign `cars.owner_id`, handle active/pending bookings for the transferred asset, and generate an ownership transfer audit record.
- **UI**: Functionalize the "Transfer Asset" dialog in the Fleet Dashboard.

### T1.3 — Notification Monitoring Dashboard
- **Task**: Re-implement `NotificationMonitoring.tsx` (previously 0-byte).
- **Logic**: Create a delivery status aggregator for the `notifications` table (Sent/Delivered/Failed).
- **UI**: Add real-time success-rate charts for Admin Broadcasts.

### T1.4 — Analytics Verification
- **Task**: Verify `UserBehavior.tsx` migration to live RPCs (Completed in S12).
- **Audit**: Ensure `get_geographic_revenue_stats()` accurately reflects real transactions in production.

---

## 🏛️ Module 2: Security & Session Integrity (Not Started)
**Objective:** Enhance platform security with automated detection.

### T2.1 — Session Anomaly Detection
- **Task**: Implement a background worker to analyze `auth.sessions` and `audit_logs`.
- **Logic**: Flag accounts with rapid geographical shifts (Impossible Travel) or multiple concurrent IP sessions across different providers.
- **UI**: Surface "Session Risks" in the SuperAdmin Security Dashboard.

### T2.2 — Security Testing Framework
- **Task**: Create automated penetration testing scripts (Node.js) to verify RLS policies on a recurring schedule.
- **Goal**: Prevent regressions where new tables are created without proper `public` search_path or RLS.

---

## 🏛️ Module 3: Operational Automation (Not Started)
**Objective:** Reduce manual maintenance overhead.

### T3.1 — System Health Monitoring
- **Task**: Create a monitoring service for Postgres metrics and Edge Function latency.
- **Logic**: Alert SuperAdmins if `pg_stat_activity` shows long-running locks or if Edge Function error rates exceed 5%.

### T3.2 — Database Maintenance Tools
- **Task**: Automate "Orphan Cleanup" (e.g., profiles without users, car images without cars).
- **Logic**: Implement a scheduled job for `VACUUM` and `ANALYZE` on high-traffic tables.

---

## 🏛️ Module 4: Advanced Features & Compliance (Not Started)
**Objective:** Implement high-value intelligence and legal requirements.

### T4.1 — Document OCR Integration
- **Task**: Wire the admin verification flow to an OCR service (e.g., Google Cloud Vision or AWS Textract).
- **Logic**: Automatically extract Name, Expiry, and ID Number from uploaded driver's licenses to flag manual review discrepancies.

### T4.2 — Automated Moderation (AI Filtering)
- **Task**: Implement a text-moderation hook for `profiles` and `cars`.
- **Logic**: Use AI to flag inappropriate content in user bios or car descriptions before they appear to the public.

### T4.3 — Automated Compliance Reporting
- **Task**: Implement "Signed Audit Logs."
- **Logic**: Generate monthly PDF reports of all SuperAdmin actions, signed with a system key to ensure non-repudiation for regulatory audits.

---

## 📋 Task Matrix (Sprint 13 Planning)

| Task ID | Component | Priority | Points | Summary |
| :--- | :--- | :--- | :--- | :--- |
| **SAR-001** | Database | P0 | 5 | Implement BUG-011 RPCs (`suspend`, `ban`, `transfer`). |
| **SAR-002** | Security | P1 | 8 | Session Anomaly Detection & Lockdown Engine. |
| **SAR-003** | Operations| P1 | 5 | System Health Monitoring & Auto-Cleanup tools. |
| **SAR-004** | AI/OCR | P2 | 8 | Document OCR & Automated Content Moderation. |
| **SAR-005** | Compliance| P2 | 5 | Signed Audit Log PDF Generation. |

---

## 🏁 Success Criteria
1.  **Functional Parity**: All 16 SuperAdmin roadmap items are verified functional (not stubs).
2.  **Audit Integrity**: 100% of administrative actions are recorded in the immutable audit trail.
3.  **Security Baseline**: Zero RLS regressions detected by the new security testing framework.

---
*Plan generated on April 23, 2026, for inclusion in the Sprint 13 planning session.*
