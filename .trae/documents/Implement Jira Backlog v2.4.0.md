## Execution Order
1. MOBI-502 — Security Vulnerabilities Fix (P0)
2. MOBI-501 — SuperAdmin Database Completion (P0)
3. MOBI-504 — Migration Audit Phase 1 (P2)
4. MOBI-603 — Migration Audit Phase 2 & Payment Recovery (P2)
5. MOBI-503 — Dynamic Pricing Integration (P1)
6. MOBI-602 — Insurance Schema & API Foundation (P1)
7. MOBI-701 — Insurance UI Components (P1)
8. MOBI-601 — SuperAdmin UI Phase 2: User Management (P1)
9. MOBI-702 — SuperAdmin UI Phase 2: Analytics (P2)
10. MOBI-703 — Production Deployment Preparation (P2)
11. MOBI-803 — Production Deployment v2.4.0 (P0)

## Conventions & Safeguards
- SQL migration naming: `YYYYMMDDHHMMSS_[action]_[subject].sql`
- Announce timestamp intent in `#migrations`, wait for approval
- Use non-recursive RLS patterns, avoid SECURITY INVOKER recursion
- Keep code changes minimal in high‑risk files; follow existing patterns
- Validate each migration idempotently, include rollback snippets where safe

## MOBI-502 — Security Vulnerabilities 5–8 Fix
### Targets
- `supabase/migrations/[ts]_fix_storage_rls.sql`
- `supabase/migrations/[ts]_harden_wallet_security.sql`
- `supabase/migrations/[ts]_secure_admin_logs.sql`
- `supabase/migrations/[ts]_enforce_message_encryption.sql`
### Plan
- Storage RLS: tighten `storage.objects` policies for verification buckets; restrict write/read by resource owner; inline admin checks to avoid recursion; align with `verification_storage_buckets.sql` and existing admin fixes.
- Wallet security: reinforce RLS on `host_wallets` and `wallet_transactions` to allow owner/admin only; add policy predicates using joins to `profiles`; index supporting columns.
- Admin logs: ensure `audit_logs` RLS prevents non-admin reads; insert via RPC `log_admin_activity` with `SECURITY DEFINER` and explicit role check; add defensive logging improvements.
- Message encryption: introduce `pgcrypto` column-level encryption for sensitive message content; wrap with `SECURITY DEFINER` functions `encrypt_message(text)`/`decrypt_message(uuid, text)`; store only ciphertext; never commit secrets—keys come from environment/secret storage.
### Verification
- Role-matrix SQL tests for renter/owner/admin/anonymous
- Attempt edge cases (self-referential policies, recursion)
- Supabase CLI migration up/down on a fresh database

## MOBI-501 — SuperAdmin Database Completion
### Targets
- `supabase/migrations/[ts]_create_user_roles_table.sql`
- `supabase/migrations/[ts]_extend_admin_capabilities.sql`
### Plan
- Create `user_roles` with normalized schema; seed roles; add RLS for role management via admins only.
- Add audit triggers to capture changes; extend capabilities tables/functions consistent with existing `admins` and `audit_logs` tables.
### Verification
- Dev migration run clean; audit logs record inserts/updates/deletes

## MOBI-504 — Migration Audit Phase 1
### Targets
- `.trae/documents/migration-audit-report.md` (update)
- `supabase/archives/` (review only)
### Plan
- Review 245 of 378 archives prioritizing payments/wallets/notifications
- Categorize: safe-to-delete, consolidate, keep
- Document consolidation plan and recovery steps
### Verification
- Report updated with categorized list and proposed actions

## MOBI-603 — Migration Audit Phase 2 & Payment Recovery
### Targets
- `.trae/documents/migration-audit-report.md` (complete)
- `supabase/migrations/[ts]_recover_payment_tables.sql`
### Plan
- Complete archive review; design idempotent recovery for payment tables (including constraints/indexes/triggers)
- Consolidate duplicates into canonical schema; include guards for existing objects
### Verification
- Fresh DB migration path succeeds; recovery preserves historical data

## MOBI-503 — Dynamic Pricing Integration
### Targets
- `src/services/dynamicPricingService.ts` (confirm and extend)
- `src/components/booking/BookingDialog.tsx` (update)
- `src/components/booking/PriceBreakdown.tsx` (new)
- `src/hooks/useDynamicPricing.ts` (new)
- `src/lib/featureFlags.ts` (new/update)
### Plan
- Build `useDynamicPricing` to fetch and cache prices per car/dates (debounced); integrate into `BookingDialog.tsx` (src/components/booking/BookingDialog.tsx:1–705) to replace static `totalPrice` when flag `DYNAMIC_PRICING` is on.
- Add `PriceBreakdown.tsx` showing base rate, adjustments, fees, and final; wire analytics events.
- Implement `src/lib/featureFlags.ts` with toggles (`DYNAMIC_PRICING`, `INSURANCE_V2`, `SUPERADMIN_ANALYTICS`), backed by Supabase table or local config, default safe-off.
### Verification
- Unit tests for calculation paths; UI verifies real-time updates, flag off restores current behavior

## MOBI-602 — Insurance Schema & API Foundation
### Targets
- `supabase/migrations/[ts]_create_insurance_tables.sql`
- `src/services/insuranceService.ts` (new)
- `supabase/functions/calculate-insurance/index.ts` (new)
- `src/components/booking/BookingDialog.tsx` (update)
### Plan
- Create `insurance_plans`, `policies`, `policy_selections` with RLS scoped to owner/renter; indexes on lookup fields.
- Service layer to list plans, compute quotes, persist selections.
- Edge Function `calculate-insurance` to compute premiums; validate inputs; return breakdown.
- Extend `BookingDialog` to include optional insurance, storing selection with booking.
### Verification
- Schema deployed; function returns accurate pricing; booking persists insurance when enabled

## MOBI-701 — Insurance UI Components
### Targets
- `src/components/insurance/InsurancePlanSelector.tsx` (new)
- `src/components/insurance/InsuranceComparison.tsx` (new)
- `src/components/insurance/PolicyDetailsCard.tsx` (new)
- `src/components/insurance/CoverageCalculator.tsx` (new)
- `src/components/booking/BookingDialog.tsx` (update)
### Plan
- Create modular components for selection/comparison/details/calculator; responsive and accessible.
- Integrate into `BookingDialog` with feature flag `INSURANCE_V2`; update price summary with dynamic pricing interaction.
### Verification
- Mobile-responsive checks; dynamic updates; disabled cleanly via flag

## MOBI-601 — SuperAdmin UI Phase 2: User Management
### Targets
- `src/pages/SuperAdminUserRoles.tsx` (new)
- `src/components/admin/superadmin/BulkUserActions.tsx` (new)
- `src/components/admin/superadmin/CapabilityAssignment.tsx` (new)
- `src/hooks/useSuperAdminRoles.ts` (new)
- `src/services/superAdminService.ts` (update)
### Plan
- Build roles management page with bulk operations and capability assignment modal; use hooks/services and log actions to `audit_logs`.
- Guard UI behind `SUPERADMIN_ANALYTICS`/appropriate admin checks.
### Verification
- Responsive UI; actions recorded in admin activity logs

## MOBI-702 — SuperAdmin UI Phase 2: Analytics
### Targets
- `src/pages/SuperAdminAnalytics.tsx` (new)
- `src/components/admin/superadmin/AnalyticsCharts.tsx` (new)
- `src/components/admin/superadmin/SecurityMonitor.tsx` (new)
- `src/hooks/useSuperAdminAnalytics.ts` (new)
### Plan
- Implement dashboard with Recharts; real-time KPIs via Supabase; security monitor showing key RLS/auth events; CSV export.
- Gate behind `SUPERADMIN_ANALYTICS` feature flag.
### Verification
- Charts auto-update; security events surface; CSV export works

## MOBI-703 — Production Deployment Preparation
### Targets
- `.trae/documents/deployment-runbook.md` (new)
- `.trae/documents/rollback-procedures.md` (new)
- `supabase/config.toml` (update)
### Plan
- Document deployment steps, health checks, and rollback procedures; configure production `config.toml` (pooler, JWT, storage, realtime, backups).
### Verification
- Dry-run via preview; alert thresholds tested

## MOBI-803 — Production Deployment v2.4.0
### Targets
- Production-only execution
### Plan
- Execute release branch deployment; run post-deploy verification; monitor 24h; toggle flags per plan.
### Verification
- ≥90% system health; no critical incidents; features verified

## Dependencies & Notes
- Insurance tasks blocked by MOBI-502 completion
- Feature flags introduced in `src/lib/featureFlags.ts` to ensure safe rollout and quick disable
- High-risk files: `src/components/booking/BookingDialog.tsx`, `src/integrations/supabase/types.ts`, `supabase/migrations/`, `src/lib/featureFlags.ts` — changes minimal and audited

## Next Step
On approval, proceed with MOBI-502 migrations first, then follow the ordered plan, delivering and verifying each task incrementally.