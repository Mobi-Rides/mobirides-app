# HOTFIX: Admin Portal — Comprehensive Bug Fix Sprint

**Document ID:** HOTFIX-ADMIN-2026-02-24  
**Priority:** P0 (Critical) / P1 (High)  
**Sprint:** Emergency Hotfix  
**Created:** 2026-02-24  
**Owner:** Engineering  
**Status:** Ready for Implementation

---

## Context & Root Cause Summary

Migration `20260219132154` (`fix_admin_portal_data_linkage`) introduced cascading regressions across the admin portal by rewriting the `get_admin_users_complete()` RPC without dependency analysis. While the RPC return schema was restored in `20260224104153`, a full audit reveals 12+ additional issues across edge functions, security, data integrity, and frontend rendering.

**Process Gap Identified:** No standardised impact assessment protocol exists for migrations modifying shared database objects (RPCs, triggers, views). A checklist is proposed under `MOB-113`.

---

## Epic: MOB-100 — Admin Portal Hotfix

### Section A: Frontend-Only Fixes (No Migrations Required)

---

#### MOB-101 — Reviews Tab Crash: React Hooks Violation ⛔ P0

**Type:** Bug  
**Component:** `src/components/admin/ReviewManagementTable.tsx`  
**Status:** Broken — page crashes on load  

**Description:**  
`useTableSort` is called on line ~125, **after** two early returns (loading state line 107, empty state line 117). This violates React's Rules of Hooks, causing: `"Rendered more hooks than during the previous render"`.

**User Story:**  
> As an admin, I want to view and manage user reviews at `/admin/reviews` so that I can moderate platform content.

**Acceptance Criteria:**
- [ ] `useTableSort` is called unconditionally at the top of the component, before any early returns
- [ ] Loading skeleton renders correctly while data fetches
- [ ] Empty state renders when no reviews exist
- [ ] Sorting by all columns (date, rating, reviewer, status) works correctly
- [ ] No console errors on page load

**Estimated Effort:** XS (< 30 min)

---

#### MOB-102 — KYC Verification Table: Missing User Names & Wrong Status Badges ⛔ P0

**Type:** Bug  
**Component:** `src/components/admin/KYCVerificationTable.tsx`  
**Status:** Broken — displays truncated UUIDs, incorrect badges  

**Description:**  
The dashboard preview KYC table does not join `profiles` data. It displays `user_id.substring(0, 8)...` instead of the user's name. The "Phone" column is hardcoded to `"N/A"`. Status badge mapping checks for `"verified"`, `"pending"`, `"submitted"` — but actual DB enum values are `"completed"`, `"pending_review"`, `"in_progress"`, `"not_started"`, `"rejected"`, `"requires_reverification"`.

**User Story:**  
> As an admin, I want to see user names and accurate verification statuses in the KYC queue so I can efficiently process verification requests.

**Acceptance Criteria:**
- [ ] Query joins `profiles` table to fetch `full_name`
- [ ] User column displays `full_name` (fallback: "Unknown")
- [ ] Phone column displays `phone_number` from profiles or is removed
- [ ] Status badges use correct enum values: `completed` → green, `pending_review` → yellow, `in_progress` → blue, `rejected` → red, `not_started` → grey
- [ ] Badge mapping matches `VerificationManagementTable.tsx` (full page) for consistency

**Estimated Effort:** S (< 1 hour)

---

#### MOB-103 — Car Verification Queue: PaginatedTable Structure Mismatch ⛔ P0

**Type:** Bug  
**Component:** `src/components/admin/CarVerificationTable.tsx`  
**Status:** Degraded — rows render outside table structure in full mode  

**Description:**  
In non-preview (full page) mode, `renderHeader` creates a `<Table>` with `<TableHeader>` and an empty `<TableBody />`, while rows are rendered separately by `PaginatedTable` outside the `<Table>` element. This disconnects rows from the table DOM structure. Additionally, the query has `.limit(10)` hardcoded, which prevents pagination from accessing all pending cars.

**User Story:**  
> As an admin, I want the car verification queue to display all pending cars in a properly structured, paginated table so I can efficiently review and approve listings.

**Acceptance Criteria:**
- [ ] Full-mode table renders rows inside a proper `<Table><TableBody>` structure
- [ ] `.limit(10)` removed from query (pagination handled client-side by `PaginatedTable`)
- [ ] Approve/reject actions trigger `refetch()` and update both full page and dashboard preview
- [ ] Table header columns align with row data

**Estimated Effort:** S (< 1 hour)

---

#### MOB-104 — UserEditDialog Bypasses `user_roles` Table 🔶 P1

**Type:** Bug / Security  
**Component:** `src/components/admin/UserEditDialog.tsx`  
**Status:** Inconsistent data  

**Description:**  
Line ~62-65 does `supabase.from("profiles").update({ role })` directly, bypassing the `user_roles` table. This creates data inconsistency between `profiles.role` and `user_roles` records. Any security logic relying on `user_roles` will have stale data.

**User Story:**  
> As an admin editing a user's role, I expect the change to be reflected consistently across all role-checking systems.

**Acceptance Criteria:**
- [ ] Role changes update (or upsert into) `user_roles` table
- [ ] `profiles.role` is synced for backward compatibility
- [ ] Both updates happen atomically (or in sequence with error handling)

**Estimated Effort:** S (< 1 hour)

---

#### MOB-105 — `assign-role` / `bulk-assign-role` Edge Functions: No Auth Check 🔶 P1

**Type:** Security Vulnerability  
**Components:** `supabase/functions/assign-role/index.ts`, `supabase/functions/bulk-assign-role/index.ts`  
**Status:** Vulnerable — any authenticated user can escalate privileges  

**Description:**  
Neither function validates the caller's identity or admin status. They use `SERVICE_ROLE_KEY` directly with no authorization gate. Compare with `suspend-user` and `delete-user-with-transfer`, which correctly verify admin status via RPC.

**User Story:**  
> As a platform operator, I need role assignment endpoints to verify the caller is an admin so that unauthorized users cannot escalate their own privileges.

**Acceptance Criteria:**
- [ ] Both functions extract and verify auth token from `Authorization` header
- [ ] Admin status confirmed via `is_admin()` or `admins` table check
- [ ] Non-admin callers receive `403 Forbidden`
- [ ] Error responses do not leak internal details

**Estimated Effort:** M (1-2 hours)

---

#### MOB-106 — Role Assignment INSERT Fails on Duplicates 🔶 P1

**Type:** Bug  
**Components:** `supabase/functions/assign-role/index.ts`, `supabase/functions/bulk-assign-role/index.ts`  
**Status:** Broken when re-assigning existing role  

**Description:**  
Both functions use `supabase.from('user_roles').insert(...)` which throws a unique constraint violation if the user already has that role. No `onConflict` or delete-then-insert handling.

**User Story:**  
> As an admin assigning a role to a user, I expect the operation to succeed regardless of whether the user already has a role assigned.

**Acceptance Criteria:**
- [ ] Use UPSERT (`onConflict: 'user_id'`) or delete-before-insert pattern
- [ ] Re-assigning the same role is a no-op (no error)
- [ ] Changing role replaces the previous assignment

**Estimated Effort:** XS (< 30 min)

---

#### MOB-107 — `bulk-delete-users` Edge Function Not Deployed ⛔ P0

**Type:** Deployment  
**Component:** `supabase/functions/bulk-delete-users/`  
**Status:** 404 NOT FOUND  

**Description:**  
The function code exists in the repository but returns 404 when called. `BulkActionBar.tsx` silently fails when attempting bulk user deletion.

**User Story:**  
> As a super admin, I want to bulk-delete users so I can efficiently clean up spam or test accounts.

**Acceptance Criteria:**
- [ ] Function is deployed and returns 200 on valid requests
- [ ] Function includes auth + super_admin verification
- [ ] Tested via `curl_edge_functions` after deployment

**Estimated Effort:** XS (deploy only, code exists)

---

#### MOB-108 — Shared Admin Auth Module (Tech Debt) 🟢 P2

**Type:** Improvement  
**Components:** All admin edge functions  
**Status:** Duplicated code across 6+ functions  

**Description:**  
Each edge function reimplements admin verification (50-80 lines). Extract to `supabase/functions/_shared/adminAuth.ts`.

**User Story:**  
> As a developer, I want a single shared admin auth module so that security checks are consistent and maintainable.

**Acceptance Criteria:**
- [ ] Shared module exports `verifyAdmin(req)` returning `{ adminId, isSuperAdmin }`
- [ ] All admin edge functions import and use the shared module
- [ ] No change in external behavior

**Estimated Effort:** M (1-2 hours)

---

#### MOB-109 — `AdminPromoCodes` TypeScript `as any` Casts 🟢 P2

**Type:** Tech Debt  
**Component:** `src/components/admin/AdminPromoCodes.tsx`  
**Status:** Working but type-unsafe  

**Description:**  
Lines ~98 and ~117 use `as any` to bypass TypeScript errors for `promo_codes` table operations. Pre-existing issue, not caused by recent migration.

**User Story:**  
> As a developer, I want proper TypeScript types for the promo codes table so that type errors are caught at build time.

**Acceptance Criteria:**
- [ ] `as any` casts removed
- [ ] Types updated or extended to include `promo_codes` table schema
- [ ] Build passes without errors

**Estimated Effort:** S (< 1 hour)

---

### Section B: Backend Fixes Requiring Migrations

> ⚠️ **Impact Assessment Protocol:** Each migration below MUST follow the standardised checklist before implementation:
>
> 1. **Consumer Search:** `grep -r "function_or_table_name" src/` — identify all frontend consumers  
> 2. **Return Schema Validation:** Compare `RETURNS TABLE(...)` with TypeScript interfaces in hooks/components  
> 3. **Column Rename/Removal Check:** Any rename = mandatory frontend code change  
> 4. **Dependency Order:** Document FK cascades and child-first deletion order  
> 5. **Build Verification:** `npm run build` must pass after migration  
> 6. **Document Consumers:** Add `-- CONSUMERS:` comment header to migration file  

---

#### MOB-110 — `delete-user-with-transfer` Misses 15+ FK-Dependent Tables ⛔ P0

**Type:** Bug  
**Migration Name:** `YYYYMMDDHHMMSS_fix_delete_user_fk_coverage`  
**Components:** `supabase/functions/delete-user-with-transfer/index.ts`, `supabase/functions/bulk-delete-users/index.ts`  
**Status:** Broken — deletion fails with FK constraint violations  

**Description:**  
The `deepCleanUserReferences` function attempts to delete from ~12 tables, but the database has 20+ tables with FK references to `profiles`. Missing tables include: `handover_sessions`, `handover_step_completion`, `identity_verification_checks`, `vehicle_condition_reports`, `phone_verifications`, `documents`, `real_time_locations`, `notification_preferences`, `device_tokens`, `push_subscriptions`, `verification_address`, `verification_documents`, `policy_selections`, `insurance_policies`, `payout_details`, `host_wallets`.

**Why Migration Required:**  
Some FK constraints lack `ON DELETE CASCADE` and should be evaluated for addition. Tables like `bookings.renter_id` → `profiles(id)` have no cascade, forcing manual cleanup. A migration may add `ON DELETE SET NULL` or `ON DELETE CASCADE` where appropriate to make deletion resilient.

**User Story:**  
> As an admin, I want to delete a user account and have all their data cleaned up completely so that no orphaned records or FK violations remain.

**Acceptance Criteria:**
- [ ] All 20+ FK-dependent tables handled in correct child-first order (see deletion order below)
- [ ] Both `delete-user-with-transfer` and `bulk-delete-users` use the same comprehensive table list
- [ ] FK constraints evaluated: add `ON DELETE CASCADE` or `ON DELETE SET NULL` where safe
- [ ] Migration includes `-- CONSUMERS:` header listing affected edge functions
- [ ] Integration test: create test user with data in all tables → delete → verify no orphans

**Required Deletion Order (child-first):**
```
1.  campaign_delivery_logs
2.  notification_preferences
3.  device_tokens / push_subscriptions
4.  real_time_locations
5.  identity_verification_checks
6.  vehicle_condition_reports
7.  handover_step_completion
8.  handover_sessions
9.  verification_documents
10. verification_address
11. phone_verifications
12. policy_selections
13. insurance_claim_activities (via claims)
14. insurance_claims
15. insurance_policies
16. payment_transactions
17. conversation_messages
18. conversation_participants
19. conversations
20. reviews (reviewer_id AND reviewee_id)
21. notifications
22. bookings (renter_id + car's bookings)
23. car_images (for user's cars)
24. car_blocked_dates (for user's cars)
25. saved_cars (saved_by AND car owner)
26. cars
27. license_verifications
28. user_verifications
29. documents
30. user_restrictions
31. user_roles
32. wallet_transactions
33. host_wallets
34. withdrawal_requests
35. admin_capabilities (if admin)
36. admin_sessions (if admin)
37. admin_activity_logs (if admin)
38. admins (if admin)
39. profiles
40. auth.users (via admin API)
```

**Estimated Effort:** L (3-4 hours)

---

#### MOB-111 — `get_admin_users_complete` RPC: `is_restricted` Ignores `active` Column ⛔ P0

**Type:** Bug  
**Migration Name:** `YYYYMMDDHHMMSS_fix_rpc_restriction_active_check`  
**Component:** Database RPC `get_admin_users_complete()`  
**Status:** Broken — removed restrictions still show as active  

**Description:**  
The RPC checks `starts_at <= now() AND (ends_at IS NULL OR ends_at > now())` but does NOT check `AND urs.active = true`. The frontend sets `active = false` to remove restrictions, but the RPC continues reporting the user as restricted.

**Impact Assessment:**
- **Consumers:** `src/hooks/useAdminUsersComplete.ts` → `UnifiedUserTable.tsx`, `UserActionsDropdown.tsx`, `UserRestrictionsTab.tsx`
- **Return Schema:** `is_restricted BOOLEAN`, `active_restrictions JSONB` — no column changes, only filter logic
- **Risk:** Low — additive filter condition, no schema change

**User Story:**  
> As an admin, I want the user restriction status to accurately reflect whether a restriction is currently active so that I don't see stale restriction data.

**Acceptance Criteria:**
- [ ] RPC `is_restricted` subquery includes `AND urs.active = true`
- [ ] RPC `active_restrictions` subquery includes `AND urs.active = true`
- [ ] Users with `active = false` restrictions show as unrestricted
- [ ] Users with `active = true` and valid date range show as restricted
- [ ] `npm run build` passes after migration

**Estimated Effort:** XS (< 30 min)

---

#### MOB-112 — Duplicate `is_admin` / `log_admin_activity` Function Overloads 🟢 P2

**Type:** Tech Debt  
**Migration Name:** `YYYYMMDDHHMMSS_deduplicate_admin_functions`  
**Component:** Database functions  
**Status:** Working but cluttered  

**Description:**  
Database contains 2 overloads each of `is_admin()` and `log_admin_activity()` from legacy migrations. Should be consolidated to single canonical versions.

**Impact Assessment:**
- **Consumers:** All admin edge functions, RLS policies
- **Risk:** Medium — must verify which overload signature is used before dropping

**User Story:**  
> As a developer, I want a single canonical version of each admin helper function so that behavior is predictable.

**Acceptance Criteria:**
- [ ] Identify which overload is actively used by edge functions and policies
- [ ] Drop unused overload(s)
- [ ] Verify all edge functions and RLS policies still work
- [ ] Migration includes `-- CONSUMERS:` header

**Estimated Effort:** S (< 1 hour)

---

### Section C: Process Improvement

#### MOB-113 — Establish Migration Impact Assessment Protocol 🔶 P1

**Type:** Process  
**Status:** No protocol exists  

**Description:**  
The root cause of this entire hotfix sprint is the absence of a dependency analysis step before creating migrations that modify shared database objects. Propose the following checklist be added to `docs/conventions/MIGRATION_PROTOCOL.md`:

```
┌──────────────────────────────────────────────────┐
│  MIGRATION IMPACT ASSESSMENT CHECKLIST           │
├──────────────────────────────────────────────────┤
│ 1. Consumer Search                               │
│    grep -r "object_name" src/ supabase/          │
│                                                  │
│ 2. Return Schema Validation                      │
│    Compare RETURNS TABLE(...) with TS interfaces │
│                                                  │
│ 3. Column Rename/Removal Check                   │
│    Any rename = frontend code change required    │
│                                                  │
│ 4. FK Dependency Mapping                         │
│    Document all tables referencing modified table │
│                                                  │
│ 5. Build Verification                            │
│    npm run build must pass after migration        │
│                                                  │
│ 6. Document Consumers in Migration Header        │
│    -- CONSUMERS: hook.ts, Component.tsx           │
│                                                  │
│ 7. Rollback Plan                                 │
│    Include reverse migration SQL                 │
└──────────────────────────────────────────────────┘
```

**User Story:**  
> As a developer, I want a standardised checklist to follow before writing migrations so that shared database objects are not broken by incomplete changes.

**Acceptance Criteria:**
- [ ] Checklist document created at `docs/conventions/MIGRATION_PROTOCOL.md`
- [ ] Referenced in project CLAUDE.md / contributing guide
- [ ] Applied retroactively to all migrations in this hotfix

**Estimated Effort:** S (< 1 hour)

---

## Implementation Priority Order

| Order | Ticket  | Description                              | Type       | Effort |
|-------|---------|------------------------------------------|------------|--------|
| 1     | MOB-101 | Fix Reviews tab hooks crash              | Frontend   | XS     |
| 2     | MOB-102 | Fix KYC table names & badges             | Frontend   | S      |
| 3     | MOB-103 | Fix Car verification table structure     | Frontend   | S      |
| 4     | MOB-111 | Fix RPC `is_restricted` active check     | Migration  | XS     |
| 5     | MOB-107 | Deploy `bulk-delete-users`               | Deployment | XS     |
| 6     | MOB-105 | Add auth to role assignment functions    | Frontend   | M      |
| 7     | MOB-106 | Fix role INSERT → UPSERT                 | Frontend   | XS     |
| 8     | MOB-104 | Fix UserEditDialog role sync             | Frontend   | S      |
| 9     | MOB-110 | Fix delete user FK coverage              | Migration  | L      |
| 10    | MOB-113 | Create migration protocol doc            | Process    | S      |
| 11    | MOB-108 | Extract shared admin auth module         | Frontend   | M      |
| 12    | MOB-112 | Deduplicate admin DB functions           | Migration  | S      |
| 13    | MOB-109 | Clean up `as any` casts                  | Frontend   | S      |

---

## Definition of Done

- [ ] All P0 tickets resolved and verified
- [ ] All P1 tickets resolved or have approved deferral
- [ ] Admin portal pages load without console errors: `/admin/users`, `/admin/reviews`, `/admin/verifications`, `/admin/cars`, `/admin/promo-codes`
- [ ] Delete user flow tested end-to-end (single + bulk)
- [ ] Role assignment tested with auth verification
- [ ] Migration protocol documented and referenced in project conventions
- [ ] No `as any` casts in admin components (P2, can defer)
