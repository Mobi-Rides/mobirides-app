

# Car Verification Queue Analysis

## Finding: The Data IS Correct -- The Problem Is Your Approval Workflow

The database confirms the component is actually showing the correct data. Here is what is happening:

**Recent cars (2026) were all auto-approved or manually approved already:**
- Mazda Atenza (Feb 5, 2026) -- `approved`
- Mercedes S600 Maybach (Jan 22, 2026) -- `approved`
- Madza Y23 (Jan 21, 2026) -- `approved`
- BMW 320i (Jan 21, 2026) -- `approved`

**All 14 pending cars are from Aug-Sep 2025** -- these are genuinely stale, unactioned listings that were never approved or rejected. No new cars have entered `pending` status since September 2025.

This means one of two things is happening:
1. New car listings are being created with `verification_status = 'approved'` directly (bypassing the verification queue), OR
2. An admin approved recent listings but never cleared out the older backlog

## Two Real Issues to Fix

### Issue 1: New cars may bypass the pending queue
The `verification_status` column was only added by the February 19th migration. Cars created before that migration were backfilled, but the `AddCar` flow may not be setting `verification_status = 'pending'` on new inserts -- it likely defaults to `approved` or the column default allows it. This needs verification against the column default and the car creation form.

### Issue 2: The component has the bugs we already identified
These are already in the hotfix plan (MOB-106):
- **`.limit(10)`** on line 50 caps results to 10 of the 14 pending cars
- **`PaginatedTable` structural mismatch** in full mode (lines 199-213): `renderHeader` renders a complete `<Table>` with empty `<TableBody />`, then rows render outside that table structure
- **"Seller" column shows "Ivanna" and "Prestige Rentals"** -- this IS working correctly via the `profiles:owner_id (full_name)` join

### Recommended Actions
1. Check the `cars.verification_status` column default -- if it defaults to anything other than `'pending'`, that explains why recent cars skip the queue
2. Fix the `.limit(10)` and `PaginatedTable` structure (already in MOB-106)
3. Consider adding a bulk "Clear stale listings" action or an age indicator to highlight listings pending for months

These fixes are covered under **MOB-106** in the hotfix plan (`docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md`).

