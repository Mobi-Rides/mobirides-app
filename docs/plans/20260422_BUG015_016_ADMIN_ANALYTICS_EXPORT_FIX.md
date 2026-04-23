# Implementation Plan: Admin Analytics & CSV Export Fix (BUG-015 / BUG-016)

**Created:** April 22, 2026  
**Author:** Modisa Maphanyane  
**Sprint:** 12  
**Priority:** Medium  
**Estimated Effort:** 5 SP (2 sub-tasks)

---

## Epic: Admin Dashboard Data Integrity

**Epic Key:** ADMIN-FIX-001  
**Components:** Frontend, Analytics, Data Export  
**Labels:** bug-fix, analytics, csv-export, admin-portal

---

## Context

Two related issues identified during an admin portal audit on April 22, 2026. Both stem from incomplete frontend wiring — the backend (database and RPCs) already has the data, but the UI either passes hardcoded empty arrays or exports incomplete records.

**Database Snapshot (verified):**
- 317 total profiles | 278 real users (excl. 37 test accounts / 2 super_admin)
- 163 bookings
- `get_admin_users_complete` RPC returns all rows (no internal limit)

---

## Sub-Task 1: BUG-015 — Analytics Charts Showing Empty Data

**Story Points:** 3 SP  
**Priority:** Medium  
**Type:** Bug Fix  
**Components:** Frontend, Analytics Service  
**Labels:** analytics, charts, data-pipeline

**As a** Super Admin viewing the Analytics Dashboard  
**I want** the "User Growth Trend" and "Booking Trends" charts to display real data  
**So that** I can monitor platform growth and booking activity over time

### Root Cause

| Location | Issue |
|----------|-------|
| `SuperAdminAnalytics.tsx:472` | `<MobileOptimizedChart data={[]} title="User Growth Trend" />` — hardcoded empty array |
| `SuperAdminAnalytics.tsx:480` | `<MobileOptimizedChart data={[]} title="Booking Trends" />` — hardcoded empty array |
| `useSuperAdminAnalytics.ts:477-481` | `getUserGrowthData()` returns `[]` with `// For now, return mock data structure` comment |
| `analyticsService.ts` | No `getUserRegistrationStats()` or `getBookingGrowthStats()` methods exist |

### Acceptance Criteria

- [ ] "User Growth Trend" chart displays monthly user registration counts (Jan 2025 → present)
- [ ] "Booking Trends" chart displays monthly booking counts (Jan 2025 → present)
- [ ] Charts update when the analytics date range filter is changed
- [ ] Data matches what `MonthlyUserGrowthTable` displays for overlapping periods
- [ ] Charts render gracefully with zero-data months (show 0, not gaps)

### Technical Tasks

#### ADMIN-FIX-T001: Add time-series aggregation to `analyticsService.ts` (2 SP)

**File:** `src/services/analyticsService.ts`

Add two new methods to the `analyticsService` object:

**`getUserRegistrationStats()`**
```
Query: SELECT created_at FROM profiles
       WHERE role NOT IN ('admin', 'super_admin')
       AND full_name NOT ILIKE '%test%'
       AND full_name NOT ILIKE '%dummy%'
       AND full_name NOT ILIKE '%tester%'
Group by: YYYY-MM (month bucket)
Returns: { name: "Jan 2025", value: 12 }[]
```

**`getBookingGrowthStats()`**
```
Query: SELECT created_at FROM bookings
Group by: YYYY-MM (month bucket)
Returns: { name: "Jan 2025", value: 8 }[]
```

Both methods:
- Fetch all matching rows and aggregate client-side (avoids needing a new RPC)
- Use `format(new Date(row.created_at), 'MMM yyyy')` from `date-fns` for labels
- Sort chronologically

#### ADMIN-FIX-T002: Wire data from hook to charts (1 SP)

**File:** `src/hooks/useSuperAdminAnalytics.ts`

- Add `userGrowthData` and `bookingGrowthData` state variables
- In `fetchAnalytics()`, add calls to the new service methods in the `Promise.all`
- Replace the stubbed `getUserGrowthData()` body with the real state
- Add `getBookingGrowthData()` returning real state
- Export both from the hook

**File:** `src/pages/SuperAdminAnalytics.tsx`

- Destructure `getUserGrowthData, getBookingGrowthData` (or direct state) from hook
- Line 472: Change `data={[]}` → `data={userGrowthData}`
- Line 480: Change `data={[]}` → `data={bookingGrowthData}`

---

## Sub-Task 2: BUG-016 — CSV Export Only Exports User IDs

**Story Points:** 2 SP  
**Priority:** Medium  
**Type:** Bug Fix  
**Components:** Frontend, Data Export  
**Labels:** csv-export, audit, bulk-actions

**As a** Super Admin auditing the user database  
**I want** the "Export Selected" button to export full user records (name, email, role, status, dates)  
**So that** I can audit selected users against the database without manual cross-referencing

### Root Cause

| Location | Issue |
|----------|-------|
| `BulkActionBar.tsx:200-217` | "Export Selected" only exports `{ user_id }` per selected user ID |
| `UnifiedUserTable.tsx:152-193` | "Export CSV" correctly uses `filteredUsers` (all rows) — no bug here |

The `BulkActionBar` receives `selectedIds: string[]` but has no access to the full user data, so it can only dump IDs. It needs a reference to the user array to resolve IDs into full records.

### Acceptance Criteria

- [ ] "Export Selected" CSV contains columns: full_name, email, phone, role, kyc_status, account_status, vehicles_count, bookings_count, created_at
- [ ] CSV row count matches the number of selected users
- [ ] Export uses the same column format as the "Export CSV" button for consistency
- [ ] "Export CSV" (full export) verified to export ALL ~317 records (not paginated subset)
- [ ] Both buttons produce timestamped filenames: `users_export_YYYY-MM-DD.csv`

### Technical Tasks

#### ADMIN-FIX-T003: Enhance BulkActionBar export logic (2 SP)

**File:** `src/components/admin/BulkActionBar.tsx`

**Option A (Preferred — Props-based):**
- Add new prop: `users: Array<AdminUserComplete>` (the full user list from parent)
- In the export handler, filter `users` to only those whose ID is in `selectedIds`
- Build CSV with the same column definitions used by `UnifiedUserTable`

**Option B (Callback-based):**
- Add prop: `onExportSelected: (selectedIds: string[]) => void`
- Delegate export logic to the parent (`AdvancedUserManagement`), which already has the full user data

**File:** `src/components/admin/AdvancedUserManagement.tsx`

- Pass the `users` array (or callback) down to `BulkActionBar`

#### ADMIN-FIX-T004: Browser verification of "Export CSV" behavior

- Open Admin Portal → Users tab → click "Export CSV"
- Verify downloaded file contains all ~317 rows (not just visible page)
- If correct: no code change needed — document as verified
- If broken: trace `filteredUsers` state to identify where truncation occurs

---

## Dependencies

| Dependency | Status |
|------------|--------|
| `profiles` table accessible via Supabase client | ✅ Available |
| `bookings` table accessible via Supabase client | ✅ Available |
| `get_admin_users_complete` RPC | ✅ Available (no row limit) |
| `date-fns` library | ✅ Already installed |
| `MobileOptimizedChart` accepts `{ name, value }[]` | ✅ Verified in codebase |

---

## Execution Order

```
1. ADMIN-FIX-T001 — analyticsService.ts (new methods)
2. ADMIN-FIX-T002 — useSuperAdminAnalytics.ts + SuperAdminAnalytics.tsx (wire data)
3. npm run build — validate no type errors
4. Browser verify charts render with real data
5. ADMIN-FIX-T003 — BulkActionBar.tsx + parent component (export fix)
6. ADMIN-FIX-T004 — Browser verify CSV export row counts
```

---

## Verification Plan

### Build Validation
- `npm run build` — zero TypeScript errors

### Browser Verification
1. Navigate to Admin Portal → Analytics → Overview tab
2. Confirm "User Growth Trend" chart shows monthly bars/lines  
3. Confirm "Booking Trends" chart shows monthly bars/lines
4. Cross-reference chart values with `MonthlyUserGrowthTable` for consistency
5. Navigate to Admin Portal → Users tab
6. Select 5 users → click "Export Selected" → verify CSV has 5 full rows
7. Click "Export CSV" → verify CSV has ~317 rows (all users)

### Regression Check
- Verify Analytics tab still loads without errors
- Verify date range filter updates chart data
- Verify Security tab charts (severity distribution) still render correctly

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Client-side aggregation slow for large datasets | Low (317 users) | Acceptable for MVP; add RPC if >5k users |
| `MobileOptimizedChart` doesn't accept `{ name, value }[]` format | Low (verified) | Test with sample data first |
| Export breaking existing "Export CSV" flow | Low | Only modifying BulkActionBar, not UnifiedUserTable |

---

*Plan authored by: Modisa Maphanyane — April 22, 2026*
