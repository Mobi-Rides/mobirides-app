# Sprint 14 Execution Plan
## MobiRides Application — May 11 – May 24, 2026

**Prepared by:** Modisa Maphanyane  
**Sprint:** Sprint 14  
**Date:** May 11, 2026  
**Status:** 🟡 Active  
**Reference:** [BUG_REPORT.md](../testing%20%26%20bugs/BUG_REPORT.md), [H1 Roadmap](../Roadmaps%20%26%20PRDs/20260410_Roadmap_2026_H1.md)

---

## Executive Summary

Sprint 14 focuses on launch hardening: SuperAdmin security expansion, native push provisioning, system monitoring, and a newly identified Supabase Storage regression cluster. The storage work is a Sprint 14 P0/P1 addition because it directly affects KYC, vehicle listing, chat attachments, handover photos, and claim evidence uploads.

---

## Sprint Objectives

1. Restore Supabase Storage buckets and policies required by all live upload flows.
2. Unblock verification document uploads for KYC completion.
3. Resolve storage bucket naming drift between chat implementation and remote schema.
4. Continue MOB-13 Firebase provisioning for native push notifications.
5. Start SuperAdmin security features for anomaly detection, monitoring, OCR moderation, and signed audit logs.

---

## Priority Backlog

### Category 1: Storage Regression Remediation (P0/P1)

| Ticket | Linked Bug | Owner | Priority | Points | Status | Summary |
|--------|------------|-------|----------|--------|--------|---------|
| **S14-001** | BUG-032 | Modisa | P0 | 3 | ✅ Done | Restore authenticated user storage policies for `verification-documents` and `verification-selfies`. |
| **S14-002** | BUG-033 | Modisa | P0 | 2 | ✅ Done | Confirm/create `car-documents` bucket and policies for vehicle listing document uploads. |
| **S14-003** | BUG-034 | Arnold | P1 | 3 | ✅ Done | Resolve `chat-attachments` vs `message-attachments` bucket naming mismatch. |
| **S14-004** | BUG-035 | Arnold | P1 | 2 | ✅ Done | Confirm/create `handover-photos` bucket and upload/read policies. |
| **S14-005** | BUG-036 | Modisa | P1 | 5 | ✅ Done | Run full storage bucket/policy repair and regression test avatars, car images, insurance claims, return photos, and verification. |

**Acceptance Criteria:**
- Verification document upload succeeds for authenticated users.
- Vehicle document upload succeeds on `/add-car`.
- Chat attachment upload and display use one canonical bucket.
- Handover and return photo uploads succeed.
- Supabase dashboard confirms required buckets exist with expected public/private settings.

---

### Category 2: Native Push Provisioning (P0)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S14-006** | Modisa | P0 | 5 | 🔴 Blocked | MOB-13: Obtain and integrate `google-services.json` for Android Firebase push notifications. |

---

### Category 3: SuperAdmin Security Expansion (P1/P2)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S14-007** | Arnold | P1 | 8 | 🔴 To Do | MOB-118: Session Anomaly Detection & Lockdown Engine. |
| **S14-008** | Modisa | P1 | 5 | 🔴 To Do | MOB-119: System health monitoring and edge function latency dashboard. |
| **S14-009** | Arnold | P2 | 5 | 🔴 To Do | MOB-120: Document OCR and auto-content moderation. |
| **S14-010** | Arnold | P2 | 3 | 🔴 To Do | MOB-121: Signed audit log PDF generation. |

---

### Category 4: Test Coverage & Verification (P1)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S14-011** | Tapologo | P1 | 3 | 🔴 To Do | Add upload-flow regression checks for storage buckets and RLS policies. |
| **S14-012** | Tapologo | P1 | 3 | 🟡 In Review | Merge pending Vehicle Management, Reviews, and Promo Codes test modules. |

---

## Execution Tracker

| Metric | Status |
|--------|--------|
| **Tasks Planned** | 12 |
| **P0 Blockers** | MOB-13, BUG-032, BUG-033 |
| **Current Focus** | Supabase Storage repair + Firebase provisioning |

---

## Sprint Exit Criteria

- Storage regressions BUG-032 through BUG-036 triaged and remediated or explicitly deferred with owner/date.
- Verification, vehicle document, chat attachment, handover photo, return photo, avatar, and insurance claim upload flows smoke-tested.
- `google-services.json` obtained or formally escalated with next owner.
- MOB-118 and MOB-119 implementation started.
- Test coverage remains above 74% and storage regression coverage is added.

---

*Document created: May 11, 2026*  
*Owner: Modisa Maphanyane*  
*Audit input: Codex storage audit*
