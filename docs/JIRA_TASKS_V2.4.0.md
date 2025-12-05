# MobiRides v2.4.0 — Jira Task Backlog (Week 5–8, Nov–Dec 2025)

**Release:** v2.4.0  
**Owner:** Arnold (Senior Engineer)  
**Sprints:** Week 5 → Week 8  
**Goal Date:** Dec 31, 2025

---

## Governance

- Migration naming/classification: `YYYYMMDDHHMMSS_[action]_[subject].sql`
  - Actions: `create_*`, `extend_*`, `fix_*`, `harden_*`, `recover_*`
  - Examples: `20251127120003_fix_storage_rls.sql`, `20251127120005_harden_wallet_security.sql`
- Timestamp registry protocol: announce in `#migrations`, wait for 👍, then create file
- Timestamp assignment: Arnold minutes ending `3–5`
- Reviews: Migrations require 2 reviewers; security PRs require Arnold + 1
- High-risk files: `src/components/booking/BookingDialog.tsx`, `src/integrations/supabase/types.ts`, `supabase/migrations/`, `src/lib/featureFlags.ts`
- Feature flags: `DYNAMIC_PRICING`, `INSURANCE_V2`, `SUPERADMIN_ANALYTICS`

---

## MOBI-502 — Security Vulnerabilities 5–8 Fix

- Type: Task  
- Priority: P0  
- Story Points: 10.5  
- Assignee: Arnold  
- Branch: `feature/security-hardening`
- Dependencies: Blocks insurance integration until complete
- Files (targets):
  - `supabase/migrations/[ts]_fix_storage_rls.sql`
  - `supabase/migrations/[ts]_harden_wallet_security.sql`
  - `supabase/migrations/[ts]_secure_admin_logs.sql`
  - `supabase/migrations/[ts]_enforce_message_encryption.sql`
- Acceptance Criteria:
  - All critical vulnerabilities fixed; security scan shows 0 critical issues
  - RLS policies updated and tested with edge cases
  - Penetration test passed
- Subtasks:
  - MOBI-502-1: Fix storage bucket permissions
  - MOBI-502-2: Implement wallet transaction RLS hardening
  - MOBI-502-3: Secure admin activity logs
  - MOBI-502-4: Enforce message encryption
- Definition of Done:
  - Policies verified across roles; documentation updated; PR reviewed by 2 engineers

---

## MOBI-504 — Migration Audit Phase 1

- Type: Task  
- Priority: P2  
- Story Points: 15  
- Assignee: Arnold  
- Branch: `feature/security-hardening`
- Files:
  - `.trae/documents/migration-audit-report.md` (update)
  - `supabase/archives/` (review only)
- Acceptance Criteria:
  - 245/378 archives reviewed and categorized; payment-related prioritized
  - Safe-to-delete migrations identified; consolidation plan documented
- Subtasks:
  - MOBI-504-1: Review payment system archives
  - MOBI-504-2: Review wallet transaction archives
  - MOBI-504-3: Document findings in audit report
- Definition of Done:
  - Recovery plan documented; team alignment on deletions

**Phase 1 Update (December 4, 2025):**
- Additional orphaned tables discovered: 11+ tables (email system, E2E encryption, blog_posts, metrics)
- Migration file issues identified: 2 files with spaces, 2 problematic migrations
- TypeScript build errors found: 2 files (`superAdminService.ts`, `walletTopUp.ts`)
- Legacy messaging cleanup required: `message_operations`, `messages_with_replies`, backup tables

---

## MOBI-603 — Migration Audit Phase 2 & Payment Recovery

- Type: Task  
- Priority: P2  
- Story Points: 15  
- Assignee: Arnold  
- Branch: `feature/migration-cleanup`
- Files:
  - `.trae/documents/migration-audit-report.md` (complete)
  - `supabase/migrations/[ts]_recover_payment_tables.sql` (new)
  - `supabase/migrations/20251204000001_create_email_system_tables.sql` (new)
  - `supabase/migrations/20251204000002_create_blog_posts_table.sql` (new)
  - `supabase/migrations/20251204000003_create_e2e_encryption_tables.sql` (new)
  - `supabase/migrations/20251204000004_create_provider_health_metrics.sql` (new)
  - `supabase/migrations/20251204000005_cleanup_legacy_messaging_tables.sql` (new)
- Acceptance Criteria:
  - All 378 archives reviewed; payment table recovery initiated
  - Duplicate migrations consolidated; clean upgrade path
  - All orphaned production tables have CREATE TABLE migrations
  - Legacy messaging system cleaned up (TECHNICAL_DEBT #3, #15 resolved)
- Subtasks:
  - MOBI-603-1: Complete remaining archive reviews
  - MOBI-603-2: Execute payment table recovery script
  - MOBI-603-3: Consolidate duplicate migrations
  - **MOBI-603-4: Create missing table migrations (email, encryption, blog, metrics)**
  - **MOBI-603-5: Create legacy messaging cleanup migration**
  - **MOBI-603-6: Rename migration files with spaces**
  - **MOBI-603-7: Delete problematic migrations (empty, production-specific)**
- Definition of Done:
  - Payment tables recovered with historical data; idempotent migrations validated
  - All orphaned tables have migrations; branch seeding works

---

## MOBI-703 — Production Deployment Preparation

- Type: Task  
- Priority: P2  
- Story Points: 8  
- Assignee: Arnold  
- Branch: `feature/production-prep`
- Files:
  - `.trae/documents/deployment-runbook.md` (new)
  - `.trae/documents/rollback-procedures.md` (new)
  - `supabase/config.toml` (update)
- Acceptance Criteria:
  - Production environment configured; backups automated
  - Monitoring/alerts set; rollback plan documented
- Subtasks:
  - MOBI-703-1: Configure Supabase production environment
  - MOBI-703-2: Set up database backups & retention
  - MOBI-703-3: Write deployment runbook
  - MOBI-703-4: Configure monitoring alerts
- Definition of Done:
  - Dry-run tested; alerts firing for critical thresholds

---

## MOBI-803 — Production Deployment v2.4.0

- Type: Task  
- Priority: P0  
- Story Points: 5  
- Assignee: Arnold (Lead) + ALL  
- Branch: `release/v2.4.0` → `main`
- Files: Production environment only
- Acceptance Criteria:
  - v2.4.0 deployed; features verified; zero critical incidents in 24h
- Subtasks:
  - MOBI-803-1: Execute production deployment
  - MOBI-803-2: Post-deployment verification
  - MOBI-803-3: 24h monitoring
- Definition of Done:
  - System health ≥ 90%; flags toggled per plan

---

## MOBI-501 — SuperAdmin Database Completion

- Type: Task  
- Priority: P0  
- Story Points: 5.1  
- Assignee: Teboho  
- Branch: `feature/superadmin-db-completion`
- Files:
  - `supabase/migrations/[ts]_create_user_roles_table.sql`
  - `supabase/migrations/[ts]_extend_admin_capabilities.sql`
- Acceptance Criteria:
  - `user_roles` created with RLS; triggers for audit logging; tests passing
- Subtasks:
  - MOBI-501-1: Create `user_roles` table schema
  - MOBI-501-2: Implement RLS policies for role management
  - MOBI-501-3: Extend admin capabilities schema
  - MOBI-501-4: Add audit logging triggers
- Definition of Done:
  - Migrations run clean on dev; audit logs capture changes

---

## MOBI-601 — SuperAdmin UI Phase 2: User Management

- Type: Task  
- Priority: P1  
- Story Points: 15  
- Assignee: Teboho  
- Branch: `feature/superadmin-ui-phase2`
- Files:
  - `src/pages/SuperAdminUserRoles.tsx` (new)
  - `src/components/admin/superadmin/BulkUserActions.tsx` (new)
  - `src/components/admin/superadmin/CapabilityAssignment.tsx` (new)
  - `src/hooks/useSuperAdminRoles.ts` (new)
  - `src/services/superAdminService.ts` (update)
- Acceptance Criteria:
  - User roles UI complete; bulk ops; capability assignment; RBAC visible
- Subtasks:
  - MOBI-601-1: Build roles page
  - MOBI-601-2: Bulk operations UI
  - MOBI-601-3: Capability assignment modal
  - MOBI-601-4: Role hooks and services
- Definition of Done:
  - Responsive UI; actions logged to admin activity log

---

## MOBI-702 — SuperAdmin UI Phase 2: Analytics

- Type: Task  
- Priority: P2  
- Story Points: 10  
- Assignee: Teboho  
- Branch: `feature/superadmin-ui-phase2`
- Files:
  - `src/pages/SuperAdminAnalytics.tsx` (new)
  - `src/components/admin/superadmin/AnalyticsCharts.tsx` (new)
  - `src/components/admin/superadmin/SecurityMonitor.tsx` (new)
  - `src/hooks/useSuperAdminAnalytics.ts` (new)
- Acceptance Criteria:
  - Real-time analytics; security monitoring; CSV export
- Subtasks:
  - MOBI-702-1: Analytics dashboard
  - MOBI-702-2: Charts with Recharts
  - MOBI-702-3: Security monitor panel
  - MOBI-702-4: CSV export
- Definition of Done:
  - Auto-updating charts; alerts on security events

---

## MOBI-503 — Dynamic Pricing Integration

- Type: Task  
- Priority: P1  
- Story Points: 8  
- Assignee: Duma  
- Branch: `feature/dynamic-pricing-integration`
- Files:
  - `src/services/dynamicPricingService.ts` (new)
  - `src/components/booking/BookingDialog.tsx` (update)
  - `src/components/booking/PriceBreakdown.tsx` (new)
  - `src/hooks/useDynamicPricing.ts` (new)
  - `src/lib/featureFlags.ts` (update)
- Acceptance Criteria:
  - API integrated; real-time price updates; breakdown; analytics tracking; feature flag
- Subtasks:
  - MOBI-503-1: Pricing service with API integration
  - MOBI-503-2: BookingDialog fetch dynamic prices
  - MOBI-503-3: Price breakdown UI
  - MOBI-503-4: Analytics tracking
  - MOBI-503-5: Feature flag & A/B setup
- Definition of Done:
  - Unit tests for calculations; disable via flag without redeploy

---

## MOBI-602 — Insurance Schema & API Foundation

- Type: Task  
- Priority: P1  
- Story Points: 15  
- Assignee: Duma  
- Branch: `feature/insurance-integration`
- Files:
  - `supabase/migrations/[ts]_create_insurance_tables.sql` (new)
  - `src/services/insuranceService.ts` (new)
  - `supabase/functions/calculate-insurance/index.ts` (new)
  - `src/components/booking/BookingDialog.tsx` (update)
- Acceptance Criteria:
  - Insurance schema deployed; API functional; RLS correct; booking integration prepared
- Subtasks:
  - MOBI-602-1: Create insurance tables schema
  - MOBI-602-2: Build insurance service layer
  - MOBI-602-3: Edge Function for calculations
  - MOBI-602-4: Booking creation flow integration
- Definition of Done:
  - Accurate pricing; optional insurance stored with policies

---

## MOBI-701 — Insurance UI Components

- Type: Task  
- Priority: P1  
- Story Points: 20  
- Assignee: Duma  
- Branch: `feature/insurance-integration`
- Files:
  - `src/components/insurance/InsurancePlanSelector.tsx` (new)
  - `src/components/insurance/InsuranceComparison.tsx` (new)
  - `src/components/insurance/PolicyDetailsCard.tsx` (new)
  - `src/components/insurance/CoverageCalculator.tsx` (new)
  - `src/components/booking/BookingDialog.tsx` (update)
- Acceptance Criteria:
  - Insurance selection and comparison; policy details; coverage calculator; responsive
- Subtasks:
  - MOBI-701-1: Plan selector
  - MOBI-701-2: Comparison modal
  - MOBI-701-3: Policy details card
  - MOBI-701-4: Coverage calculator
- Definition of Done:
  - Dynamic pricing updates; mobile-responsive

---

## Branch Strategy & Status

- `main` (protected)
- Feature branches:
  - `feature/superadmin-db-completion`, `feature/superadmin-ui-phase2`
  - `feature/security-hardening`, `feature/migration-cleanup`, `feature/production-prep`
  - `feature/dynamic-pricing-integration`, `feature/insurance-integration`
- Release branch: `release/v2.4.0`

---

## Links

- Jira Sprint Board: https://mobi-rides.atlassian.net/sprint/5
- Confluence Wiki: https://mobi-rides.atlassian.net/wiki
- GitHub Repository: https://github.com/mobi-rides/mobi-rides
- Supabase Dashboard: https://supabase.com/dashboard
- Production URL: https://mobi-rides.lovable.app

