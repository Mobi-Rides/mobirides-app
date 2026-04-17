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
**Status:** ✅ Resolved  

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
**Status:** ✅ Resolved  

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

### Section D: Build & Handover Regression Fixes (Commit Review 2026-02-25)

> **Context:** Full commit review on 2026-02-25 identified 3 build-blocking errors and a handover system regression. The mock file issue is a pre-existing problem from Jest scaffolding. The handover errors stem from the interactive handover system upgrade (`docs/INTERACTIVE_HANDOVER_SYSTEM_2026-02-02.md`) where legacy consumers were not updated to match the new `completeHandoverStep` signature.

---

#### MOB-114 — Mock File Uses `jest.fn()` Without `@types/jest` ⛔ P0

**Type:** Bug / Build Error  
**Component:** `src/__mocks__/supabaseClient.ts`  
**Status:** Build-blocking — 14 × TS2304 errors  

**Description:**  
The mock file uses `jest.fn()` throughout, but the project uses Vite — not Jest. `@types/jest` is not installed, so `jest` is an unknown global. This causes 14 `TS2304: Cannot find name 'jest'` errors that block the entire build.

**Root Cause:** Pre-existing tech debt from when test infrastructure was scaffolded without matching dependencies. Unrelated to the promo code or handover work.

**User Story:**  
> As a developer, I want mock files to compile under the project's actual toolchain so that the build is not blocked by test scaffolding.

**Acceptance Criteria:**
- [ ] All `jest.fn()` calls replaced with plain function stubs returning identical shapes
- [ ] No new dependencies added (`@types/jest` is NOT the fix)
- [ ] Build passes with zero TS2304 errors from this file
- [ ] Mock still provides correct chained API shape (`.from().select().eq()`, etc.)

**Estimated Effort:** XS (< 30 min)

---

#### MOB-115 — `completeHandoverStep` Type Error: `Record<string, unknown>` vs `Json` ⛔ P0

**Type:** Bug / Build Error  
**Component:** `src/services/enhancedHandoverService.ts` (line 157)  
**Status:** Build-blocking — TS2322  

**Description:**  
The `completionData` parameter is typed as `Record<string, unknown>`, but the Supabase RPC parameter `p_completion_data` expects `Json` (which is `string | number | boolean | null | { [key: string]: Json | undefined } | Json[]`). `unknown` is not assignable to `Json | undefined`.

**Root Cause:** The service was updated for the interactive handover system but the type was left as `Record<string, unknown>` instead of being aligned with the Supabase-generated `Json` type.

**User Story:**  
> As a developer, I want the handover service to compile cleanly so that the build is not blocked by type mismatches on RPC calls.

**Acceptance Criteria:**
- [ ] `completionData` cast to `Json`-compatible type at the RPC call site (line 157)
- [ ] No change to external function signature (callers still pass `Record<string, unknown>`)
- [ ] Build passes with zero TS2322 errors from this file

**Estimated Effort:** XS (< 15 min)

---

#### MOB-116 — `EnhancedHandoverSheet` Missing `userRole` Argument ⛔ P0 / Runtime

**Type:** Bug / Build Error + Runtime Failure  
**Components:** `src/components/handover/EnhancedHandoverSheet.tsx` (line 360), `src/components/handover/ResizableHandoverTray.tsx` (line 162)  
**Status:** Build-blocking (TS2345) + silent runtime failure  

**Description:**  
`completeHandoverStep` was updated to a 4-argument signature for the interactive handover system:
```typescript
completeHandoverStep(sessionId, stepName, userRole, completionData?)
```
But both legacy components still call it with 3 arguments:
```typescript
completeHandoverStep(handoverId, stepName, completionData)
```
This passes `completionData` (a `Record<string, unknown>`) in the `userRole` position (expected `'host' | 'renter'`), causing TS2345 at build time and — if bypassed — the `advance_handover_step` RPC would receive a JSON object where it expects a role string, causing silent step completion failures.

**Root Cause:** The interactive handover system (`InteractiveHandoverSheet` + `useInteractiveHandover`) correctly passes `userRole`, but the legacy handover UIs were never updated to match. Per `docs/INTERACTIVE_HANDOVER_SYSTEM_2026-02-02.md`, these legacy components should have been deprecated or migrated.

**Impact Assessment:**
- **Consumers:** `EnhancedHandoverSheet` is used in the legacy booking detail handover flow; `ResizableHandoverTray` is used in the bottom-sheet handover UI
- **Risk:** Medium — fix is mechanical (derive role from booking context), but highlights a larger architectural gap (dual handover systems)

**User Story:**  
> As a renter or host using the legacy handover UI, I want step completions to work correctly so that the handover process isn't silently broken.

**Acceptance Criteria:**
- [ ] Both components derive `userRole` from booking context (`booking.host_id === currentUserId ? 'host' : 'renter'`)
- [ ] `completeHandoverStep` called with correct 4-argument signature
- [ ] Build passes with zero TS2345 errors from these files
- [ ] Legacy handover step completion works end-to-end (host completes host-owned step, renter completes renter-owned step)

**Follow-up (Deferred):**
- Evaluate deprecating `EnhancedHandoverSheet` and `ResizableHandoverTray` in favor of `InteractiveHandoverSheet` per the implementation plan

**Estimated Effort:** S (< 1 hour)

---

#### MOB-117 — Handover Photo Storage RLS Audit 🔶 P1

**Type:** Security / Audit  
**Component:** Supabase Storage bucket `handover-photos`  
**Status:** Functional but unverified RLS  

**Description:**  
`uploadHandoverPhoto` in `enhancedHandoverService.ts` uploads to the `handover-photos` bucket with compression, retry logic, and progress callbacks. The upload logic is correct, but RLS policies on the storage bucket have not been verified post-migration. If policies are misconfigured, uploads fail silently (the function catches errors and returns `null`).

**User Story:**  
> As a host or renter during handover, I want photo uploads to succeed reliably so that vehicle condition is properly documented.

**Acceptance Criteria:**
- [ ] Verify `handover-photos` bucket exists and has correct public/private setting
- [ ] Verify RLS policy: authenticated users can INSERT to their own path (`{user_id}/...`)
- [ ] Verify RLS policy: authenticated users can SELECT photos for sessions they participate in
- [ ] Test upload during vehicle inspection step in the interactive handover flow
- [ ] `uploadHandoverPhoto` returns a valid public URL (not `null`) for a test upload

**Estimated Effort:** S (< 1 hour)

---

### Section E: User Avatar Display Fixes

> **Context:** Identified in `docs/UI_DISPLAY_ISSUES_2026-02-02.md` (Issue 1) but never implemented. User avatars fail to render across multiple modules because raw Supabase storage paths (e.g., `avatars/uuid.jpg`) are stored in `profiles.avatar_url` but components pass them directly to `<img src>` without converting to public URLs via `supabase.storage.from('avatars').getPublicUrl()`. Components that manually call `getPublicUrl` work; those that don't show broken images.

---

#### MOB-118 — Create Centralized `avatarUtils.ts` Utility ⛔ P0

**Type:** Feature / Prevention  
**Component:** `src/utils/avatarUtils.ts` (new file)  
**Status:** ✅ Resolved  

**Description:**  
No centralized utility exists to convert raw avatar storage paths to public URLs. Each component independently decides whether to convert, leading to inconsistent behavior. Components like `RentalUserCard.tsx`, `BookingDetails.tsx`, and `ProfileAvatar.tsx` manually call `getPublicUrl` and work; others like `HostBookingCard.tsx` and `CarOwner.tsx` pass raw paths and break.

**Implementation:**
```typescript
import { supabase } from "@/integrations/supabase/client";

export const getAvatarPublicUrl = (avatarPath: string | null | undefined): string | undefined => {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith("http")) return avatarPath;
  return supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl;
};
```

**Acceptance Criteria:**
- [ ] Utility created at `src/utils/avatarUtils.ts`
- [ ] Handles 3 cases: `null/undefined` → `undefined`, full URL → passthrough, raw path → public URL
- [ ] Exported and importable from `@/utils/avatarUtils`

**Estimated Effort:** XS (< 15 min)

---

#### MOB-119 — Fix `HostBookingCard` Renter Avatar Display ⛔ P0

**Type:** Bug  
**Component:** `src/components/host-bookings/HostBookingCard.tsx` (line 125)  
**Status:** ✅ Resolved  

**Description:**  
`<AvatarImage src={booking.renter?.avatar_url} />` passes the raw storage path directly. The renter's avatar never displays on the host's booking cards.

**Acceptance Criteria:**
- [ ] Import and use `getAvatarPublicUrl(booking.renter?.avatar_url)` for the `src` prop
- [ ] Renter avatar displays correctly on host booking cards
- [ ] Fallback to `AvatarFallback` initials when avatar is null

**Estimated Effort:** XS (< 15 min)

---

#### MOB-120 — Fix `CarOwner` Host Avatar Display ⛔ P0

**Type:** Bug  
**Component:** `src/components/car-details/CarOwner.tsx` (lines 100-104)  
**Status:** ✅ Resolved  

**Description:**  
`src={avatarUrl}` receives raw `avatar_url` from `CarDetails.tsx` (line 162) and `RentalDetailsRefactored.tsx` (line 138) without conversion. The host's avatar never displays on the car details page.

**Acceptance Criteria:**
- [ ] Import and use `getAvatarPublicUrl(avatarUrl)` for the `src` prop
- [ ] Host avatar displays correctly on car details and rental details pages
- [ ] Fallback to `/placeholder.svg` when avatar is null

**Estimated Effort:** XS (< 15 min)

---

#### MOB-121 — Audit & Fix All Remaining Avatar Consumers 🔶 P1

**Type:** Bug / Audit  
**Components:** Multiple (see table below)  
**Status:** At risk — working today only because they manually call `getPublicUrl`  

**Description:**  
Components that currently work do so via ad-hoc inline `getPublicUrl` calls. These should be migrated to use `getAvatarPublicUrl` for consistency and maintainability. If any component is refactored and the inline conversion is accidentally removed, it will break.

**Components to migrate:**
| Component | Current Approach | Action |
|-----------|-----------------|--------|
| `RentalUserCard.tsx` | Inline `getPublicUrl` | Replace with `getAvatarPublicUrl` |
| `BookingDetails.tsx` | Inline `getPublicUrl` | Replace with `getAvatarPublicUrl` |
| `HostCarsSideTray.tsx` | Inline `getPublicUrl` | Replace with `getAvatarPublicUrl` |
| `HostPopup.tsx` | Inline `getPublicUrl` | Replace with `getAvatarPublicUrl` |
| `MessagingInterface.tsx` | Inline `getPublicUrl` | Replace with `getAvatarPublicUrl` |
| `NewConversationModal.tsx` | Inline `getPublicUrl` | Replace with `getAvatarPublicUrl` |
| `ConversationRow.tsx` | Raw path (may break) | Replace with `getAvatarPublicUrl` |
| `ChatHeader.tsx` | Raw path (may break) | Replace with `getAvatarPublicUrl` |
| `VerificationRequiredDialog.tsx` | Hardcoded `bg-gray-50` (3 instances, lines 145/152/159) | Replace with `bg-muted` — color contrast issue (see [UI Display Issues](../UI_DISPLAY_ISSUES_2026-02-02.md) Issue 3) |

**Acceptance Criteria:**
- [ ] All listed components use `getAvatarPublicUrl` instead of inline `getPublicUrl`
- [ ] No inline `supabase.storage.from('avatars').getPublicUrl()` calls remain outside the utility
- [ ] All avatars render correctly across messenger, bookings, maps, and car details

**Estimated Effort:** M (1-2 hours)

---

#### MOB-122 — Verify `avatars` Storage Bucket is Public 🔶 P1

**Type:** Infrastructure / Verification  
**Component:** Supabase Storage bucket `avatars`  
**Status:** Assumed public but unverified  

**Description:**  
`getPublicUrl()` generates a URL regardless of bucket visibility, but the URL only resolves if the bucket is set to `public = true`. If the bucket is private, all avatar URLs will return 400/403 even with correct paths.

**Acceptance Criteria:**
- [ ] Confirm `avatars` bucket has `public = true` in `storage.buckets`
- [ ] If not public, run migration: `UPDATE storage.buckets SET public = true WHERE id = 'avatars'`
- [ ] Verify a known avatar URL resolves with HTTP 200

**Estimated Effort:** XS (< 15 min)

---

### Section F: Car Cover Image Display Fixes

> **Context:** Car listing cards and detail pages show broken cover images. Two root causes: (1) fallback image path `/placeholder-car.jpg` does not exist in `/public/` (only `/placeholder.svg` exists), causing a double-failure when `image_url` is null or broken; (2) some cars may have raw storage paths instead of full public URLs in `image_url`, same class of bug as the avatar issue.

---

#### MOB-123 — Fix Broken Fallback Image Path (`/placeholder-car.jpg`) ⛔ P0

**Type:** Bug  
**Components:** `src/types/car.ts` (line 45), `src/components/CarCard.tsx` (line 94)  
**Status:** ✅ Resolved  

**Description:**  
`toSafeCar()` defaults null `image_url` to `"/placeholder-car.jpg"`. `CarCard.tsx` `onError` handler also falls back to `"/placeholder-car.jpg"`. **This file does not exist** in `/public/`. Only `/placeholder.svg` is available. Any car with a null or broken `image_url` shows a broken image (double failure).

**Affected references:**
| File | Line | Current | Fix |
|------|------|---------|-----|
| `src/types/car.ts` | 45 | `"/placeholder-car.jpg"` | `"/placeholder.svg"` |
| `src/components/CarCard.tsx` | 94 | `"/placeholder-car.jpg"` | `"/placeholder.svg"` |

**Acceptance Criteria:**
- [ ] All references to `/placeholder-car.jpg` replaced with `/placeholder.svg`
- [ ] Cars with `image_url = null` display the placeholder correctly
- [ ] `onError` fallback displays the placeholder when image URL fails to load

**Estimated Effort:** XS (< 15 min)

---

#### MOB-124 — Add `onError` Fallback to `CarImage.tsx` Component ⛔ P0

**Type:** Bug  
**Component:** `src/components/car-card/CarImage.tsx`  
**Status:** ✅ Resolved  

**Description:**  
The `CarImage` component (used in car detail image carousel) has no `onError` handler on its `<img>` tag. If the image URL fails, the browser shows a broken image icon with no fallback.

**Acceptance Criteria:**
- [ ] Add `onError` handler that sets `src` to `/placeholder.svg`
- [ ] Broken car images in detail view show placeholder instead of broken icon

**Estimated Effort:** XS (< 15 min)

---

#### MOB-125 — Create Centralized `carImageUtils.ts` Utility 🔶 P1

**Type:** Feature / Prevention  
**Component:** `src/utils/carImageUtils.ts` (new file)  
**Status:** ✅ Resolved  

**Description:**  
Mirrors the `avatarUtils.ts` pattern for car images. Some cars may have raw storage paths (`car-images/uuid.jpg`) stored in `image_url` instead of full public URLs. This utility handles all cases consistently.

**Implementation:**
```typescript
import { supabase } from "@/integrations/supabase/client";

export const getCarImagePublicUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "/placeholder.svg";
  if (imagePath.startsWith("http")) return imagePath;
  return supabase.storage.from("car-images").getPublicUrl(imagePath).data.publicUrl;
};
```

**Acceptance Criteria:**
- [ ] Utility created at `src/utils/carImageUtils.ts`
- [ ] Handles 3 cases: `null/undefined` → placeholder, full URL → passthrough, raw path → public URL
- [ ] Applied in `toSafeCar()`, `CarCard.tsx`, `CarImage.tsx`, and any other car image consumers

**Estimated Effort:** S (< 30 min)

---

#### MOB-126 — Fix `BookingDialog` and `RenterPaymentModal` Build Errors ⛔ P0

**Type:** Bug / Build Error  
**Components:** `src/components/booking/BookingDialog.tsx` (line 900), `src/components/booking/RenterPaymentModal.tsx` (line 95)  
**Status:** Build-blocking — TS2739  

**Description:**  
Both components construct inline `PricingCalculation` objects that are missing required `base_price` and `total_multiplier` properties. This was likely caused by the `PricingCalculation` interface being extended without updating all consumers.

**Error:**
```
TS2739: Type '{ final_price: number; original_price: number; is_dynamic: boolean; multiplier: number; }'
is missing the following properties from type 'PricingCalculation': base_price, total_multiplier
```

**Acceptance Criteria:**
- [ ] Add `base_price` and `total_multiplier` to the inline object in `BookingDialog.tsx`
- [ ] Add `base_price` and `total_multiplier` to the inline object in `RenterPaymentModal.tsx`
- [ ] Build passes with zero TS2739 errors

**Estimated Effort:** XS (< 15 min)

---

## Implementation Priority Order

| Order | Ticket  | Description                              | Type       | Effort | Status |
|-------|---------|------------------------------------------|------------|--------|--------|
| 1     | MOB-114 | Fix mock file `jest.fn()` build errors   | Frontend   | XS     | ✅ Done |
| 2     | MOB-115 | Fix `completionData` vs `Json` type      | Frontend   | XS     | ✅ Done |
| 3     | MOB-116 | Fix missing `userRole` in legacy handover| Frontend   | S      | ✅ Done |
| 4     | MOB-118 | Create `avatarUtils.ts` utility          | Frontend   | XS     | ✅ Done |
| 5     | MOB-119 | Fix HostBookingCard renter avatar        | Frontend   | XS     | ✅ Done |
| 6     | MOB-120 | Fix CarOwner host avatar                 | Frontend   | XS     | ✅ Done |
| 7     | MOB-123 | Fix broken `/placeholder-car.jpg` path   | Frontend   | XS     | ✅ Done |
| 8     | MOB-124 | Add `onError` fallback to `CarImage.tsx` | Frontend   | XS     | ✅ Done |
| 9     | MOB-126 | Fix BookingDialog/RenterPaymentModal TS  | Frontend   | XS     | ✅ Done |
| 10    | MOB-101 | Fix Reviews tab hooks crash              | Frontend   | XS     | ✅ Done |
| 11    | MOB-102 | Fix KYC table names & badges             | Frontend   | S      | ✅ Done |
| 12    | MOB-103 | Fix Car verification table structure     | Frontend   | S      | ✅ Done |
| 13    | MOB-111 | Fix RPC `is_restricted` active check     | Migration  | XS     | ✅ Done |
| 14    | MOB-107 | Deploy `bulk-delete-users`               | Deployment | XS     |        |
| 15    | MOB-105 | Add auth to role assignment functions    | Edge Func  | M      | ✅ Done |
| 16    | MOB-106 | Fix role INSERT → UPSERT                 | Edge Func  | XS     | ✅ Done |
| 17    | MOB-104 | Fix UserEditDialog role sync             | Frontend   | S      | ✅ Done |
| 18    | MOB-110 | Fix delete user FK coverage              | Migration  | L      |        |
| 19    | MOB-125 | Create `carImageUtils.ts` utility        | Frontend   | S      | ✅ Done |
| 20    | MOB-121 | Migrate all avatar consumers to utility  | Frontend   | M      | ✅ Done |
| 21    | MOB-122 | Verify `avatars` bucket is public        | Infra      | XS     |        |
| 22    | MOB-117 | Audit handover-photos storage RLS        | Security   | S      |        |
| 23    | MOB-113 | Create migration protocol doc            | Process    | S      | ✅ Done |
| 24    | MOB-108 | Extract shared admin auth module         | Frontend   | M      |        |
| 25    | MOB-112 | Deduplicate admin DB functions           | Migration  | S      |        |
| 26    | MOB-109 | Clean up `as any` casts                  | Frontend   | S      |        |

---

## Definition of Done

- [x] MOB-114, MOB-115, MOB-116 build errors resolved (2026-02-25)
- [ ] All remaining P0 tickets resolved and verified
- [ ] All P1 tickets resolved or have approved deferral
- [ ] Admin portal pages load without console errors: `/admin/users`, `/admin/reviews`, `/admin/verifications`, `/admin/cars`, `/admin/promo-codes`
- [ ] Delete user flow tested end-to-end (single + bulk)
- [ ] Role assignment tested with auth verification
- [ ] Legacy handover step completion tested end-to-end
- [ ] Handover photo storage RLS verified (MOB-117)
- [ ] Migration protocol documented and referenced in project conventions
- [ ] No `as any` casts in admin components (P2, can defer)
- [x] All user avatars display correctly across all modules (MOB-118 through MOB-122)
- [x] All car cover images display correctly with proper fallbacks (MOB-123 through MOB-126)
- [x] No broken image icons visible on any listing, booking, or detail page
- [ ] Anonymize-on-delete implemented per [ANONYMIZE_ON_DELETE_2026_03_02.md](../plans/ANONYMIZE_ON_DELETE_2026_03_02.md)

---

### Section G: Anonymize-on-Delete (MOB-130 to MOB-138)

**Context:**
The Anonymize-on-Delete feature implements a soft-delete and anonymization process for user accounts, preserving analytics while removing PII. This includes:
- Soft-delete columns (`is_deleted`, `deleted_at`, `deleted_by`) on `profiles`
- Edge function refactors to anonymize or delete PII from related tables
- Admin portal UI guards to hide deleted users by default, with a toggle to show them
- RLS policy updates to exclude soft-deleted users from non-admin queries
- End-to-end tests for all deletion scenarios

**Acceptance Criteria:**
- Admin user table hides soft-deleted users by default
- Toggle to show deleted users with `[Deleted]` badge
- RLS SELECT policies exclude `is_deleted = true` for non-admin roles
- At least 5 deletion test cases verified
- Plan document marked complete

See [ANONYMIZE_ON_DELETE_2026_03_02.md](../plans/ANONYMIZE_ON_DELETE_2026_03_02.md) for full implementation details.

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [UI_DISPLAY_ISSUES_2026-02-02.md](../UI_DISPLAY_ISSUES_2026-02-02.md) | Source audit — Issues 1, 5, 6, 7 (avatar display) promoted to MOB-118 through MOB-122; Issue 3 (color contrast) partially covered by MOB-121 audit |
| [TESTING_COVERAGE_STATUS_2026_03_02.md](../testing/TESTING_COVERAGE_STATUS_2026_03_02.md) | Testing coverage and Round 1 results |
| [ANONYMIZE_ON_DELETE_2026_03_02.md](../plans/ANONYMIZE_ON_DELETE_2026_03_02.md) | Full implementation plan for Section G (MOB-130 to MOB-138) |
| [WEEK_4_FEBRUARY_2026_STATUS_REPORT.md](../Product%20Status/WEEK_4_FEBRUARY_2026_STATUS_REPORT.md) | Status tracking for MOB-100 epic progress |
