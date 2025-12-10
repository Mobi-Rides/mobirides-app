## Goal
Create a single gap-tracking document that lists every backlog item (MOBI-502..803), their precise gaps, fixes, deliverables, and verification steps so we can execute them one by one.

## Document Location
- Path: `.trae/documents/v2.4.0-gap-tracker.md`
- Format: Markdown with sections per Jira item; status tags and owners.

## Structure
### 1. MOBI-502 — Security Vulnerabilities Fix (P0)
- Gaps: Pen test evidence; RLS role-matrix tests; message encryption enforcement; `app.encryption_key` operational note
- Fixes: Add automated RLS tests, run pen test, plan encrypted column migration + RPC-only inserts; add runbook requirement
- Deliverables: Test results, pen test PDF, migration plan
- Verification: CI test passing; pen test summary; non-plaintext storage confirmed

### 2. MOBI-504 — Migration Audit Phase 1 (P2)
- Gaps: Missing full 245/378 categorized list; explicit safe-to-delete inventory
- Fixes: Enumerate archives and mark status; add rationale and rollback steps
- Deliverables: Updated audit report with lists
- Verification: Peer review of categorization

### 3. MOBI-603 — Migration Audit Phase 2 & Payment Recovery (P2)
- Gaps: No duplicate consolidation plan; no historical backfill; no run logs
- Fixes: Draft consolidation SQL; backfill script; record migration outputs
- Deliverables: Consolidation plan, backfill SQL, logs
- Verification: Fresh DB up succeeds; data checks

### 4. MOBI-703 — Production Deployment Preparation (P2)
- Gaps: Monitoring/alerts config; backups & retention specifics; dry-run evidence
- Fixes: Define alerts (error rate, storage failures, RLS violations); configure backups; run dry‑run
- Deliverables: Alert config doc; backup SOP; dry-run report
- Verification: Alerts firing in test; restore test passes

### 5. MOBI-803 — Production Deployment v2.4.0 (P0)
- Gaps: Not executed; flags plan not verified; 24h monitoring owners missing
- Fixes: Execute deployment; assign owners; verify flags
- Deliverables: Deployment checklist, verification report, 24h monitoring log
- Verification: System health ≥90%; incident log = 0 critical

### 6. MOBI-501 — SuperAdmin Database Completion (P0)
- Gaps: Types vs schema mismatch in `admin_capabilities`; tests missing
- Fixes: Align DB schema with `src/integrations/supabase/types.ts` or adjust types; add tests
- Deliverables: Schema/types alignment note; test suite results
- Verification: Type-safe queries; audit triggers fire

### 7. MOBI-601 — SuperAdmin UI Phase 2: User Management (P1)
- Gaps: Bulk ops and capability modal placeholders; no audit logging; responsive/a11y not verified
- Fixes: Implement bulk assign flows; persist capabilities; log actions; run responsive/a11y checks
- Deliverables: Functional UI, audit entries
- Verification: Manual flows; audit logs rows visible

### 8. MOBI-702 — SuperAdmin Analytics (P2)
- Gaps: Charts placeholders; CSV export missing; no realtime
- Fixes: Implement Recharts; add CSV export; subscribe to audit streams
- Deliverables: Functional charts; CSV button; realtime updates
- Verification: Visual checks, file export, realtime events

### 9. MOBI-503 — Dynamic Pricing (P1)
- Gaps: Analytics tracking missing; feature flags static; no unit tests
- Fixes: Add tracking events; create DB-backed flags; add tests
- Deliverables: Tracking events list; flags table & hook; test results
- Verification: Events in analytics; remote toggle works; tests pass

### 10. MOBI-602 — Insurance Schema & API (P1)
- Gaps: Policy selection not persisted on booking confirm; RLS tests missing
- Fixes: Write selection to `policy_selections` on confirm; add tests
- Deliverables: Booking integration PR; test suite
- Verification: Row created with correct `booking_id`; RLS enforced

### 11. Cross-Cutting — Feature Flags
- Gaps: Static flags cannot be toggled without redeploy
- Fixes: Implement `feature_flags` table + service/hook; cache with TTL
- Verification: Toggle on dashboard; app reflects without redeploy

### 12. NEW — December 2025 Discovery Items

**TypeScript Build Errors:**
- Gap: 2 files with type errors blocking builds
- Fixes: 
  - `superAdminService.ts`: Use `Database["public"]["Enums"]["user_role"]` instead of `string`
  - `walletTopUp.ts`: Cast RPC response to `WalletTopUpResult` interface
- Verification: `npm run build` passes with 0 errors

**Migration File Issues:**
- Gap: 2 files with spaces in names (breaks branch seeding), 2 problematic migrations
- Fixes: Rename files, delete empty/production-specific migrations
- Verification: `npx supabase db reset` succeeds

**Orphaned Production Tables:**
- Gap: 11+ tables exist in production but have no CREATE TABLE migrations
- Fixes: Create new migration files for email system, E2E encryption, blog_posts, metrics tables
- Verification: Fresh database has all tables

**Legacy Messaging Cleanup:**
- Gap: `message_operations` table has RLS disabled (security risk), legacy tables unused
- Fixes: Drop unused items, archive legacy tables to `archive` schema
- Verification: Only `conversation_messages`/`conversations` tables active
- Resolution: Closes TECHNICAL_DEBT items #3 and #15

## Execution Plan
- Create `.trae/documents/v2.4.0-gap-tracker.md` with the sections above.
- Triage by P0 → P1 → P2 and start implementing from MOBI-502 tests + encryption enforcement, then flags, insurance persistence, dynamic pricing analytics, SuperAdmin UI flows, analytics UI, audit phases, prod prep, and deployment.
- **NEW Priority:** Fix TypeScript build errors and migration file issues FIRST (blocking all other work)
- For each completed item: update status, attach evidence links, and record verification steps.

## Status Updates (December 4, 2025)

| Item | Status | Notes |
|------|--------|-------|
| TypeScript Errors | ⏳ Pending | Assigned to Arnold |
| Migration File Issues | ⏳ Pending | Assigned to Arnold |
| Orphaned Tables | ⏳ Pending | 4 new migrations needed |
| Legacy Messaging | ⏳ Pending | 1 cleanup migration needed |
| TECHNICAL_DEBT #3 | 🟢 Will be RESOLVED | Via legacy messaging cleanup |
| TECHNICAL_DEBT #15 | 🟢 Will be RESOLVED | Via legacy messaging cleanup |

## Next Step
On approval, I will create the gap tracker document at `.trae/documents/v2.4.0-gap-tracker.md` and begin filling it with the current state and action items, then proceed item-by-item.