
# Admin Portal: Backend-Frontend Data Linkage Fixes

## Diagnosis Summary

A full audit of the database and all admin table components reveals 5 distinct root causes explaining why the admin portal shows stale or empty data:

---

### Issue 1 — Car Verification Queue is Broken by Design

**Root cause:** The `cars` table has `is_available DEFAULT true`, meaning every new car listing goes live immediately without admin review. The `CarVerificationTable` queries for `is_available = false`, which only catches cars that were manually disabled — not a true "pending" queue. The 14 cars currently in the queue are all from August/September 2025 (old seed data). Zero new cars from 2026 are pending.

**Fix:** Add a dedicated `verification_status` column to the `cars` table (`pending | approved | rejected`) with a default of `pending`. New car submissions will default to `pending` and only become available after admin approval sets `is_available = true`. The `CarVerificationTable` query is updated to filter by `verification_status = 'pending'` instead of `is_available = false`.

---

### Issue 2 — Verification Management Shows 0 Records

**Root cause:** The `VerificationManagementTable` displays all verifications but Approve/Reject action buttons only appear when `overall_status === "pending"`. However, the actual database enum has no `"pending"` value — the values are `not_started`, `in_progress`, `pending_review`, `completed`, `failed`, `rejected`. None of the 31 records in the DB have status `"pending"`, so the action buttons never render.

Additionally, the `KYCVerificationTable` (dashboard preview widget) filters for `pending_review` or `in_progress` — but zero records in the database have these statuses. All records are `not_started`, `completed`, or `rejected`.

**Fix:** In `VerificationManagementTable`, change the action button condition from `=== "pending"` to `=== "pending_review"`. In `KYCVerificationTable`, broaden the filter to also include `not_started` and `in_progress` so the dashboard widget shows relevant queued items.

---

### Issue 3 — `profiles.verification_status` is Never Updated

**Root cause:** All 187 user profile rows have `verification_status = 'not_started'`, even for the 19 users who have `completed` verifications in `user_verifications`. The profile column is never synced when verification status changes. This causes the Users table KYC column and AdminStats to show incorrect data.

**Fix:** Add a database trigger on `user_verifications` that updates `profiles.verification_status` whenever `overall_status` changes. Also update the `updateVerificationStatus` mutation in `VerificationManagementTable` to simultaneously update the corresponding `profiles` row (belt-and-suspenders approach).

---

### Issue 4 — AdminStats "Pending Verifications" Counter is Inflated

**Root cause:** `AdminStats` counts verifications with `overall_status != 'completed'`, which includes all `not_started` users (156 records). This makes the stat misleading. The intent is to show only verifications actively requiring admin attention.

**Fix:** Change the AdminStats query to count only `overall_status IN ('pending_review', 'in_progress')` — records that genuinely need admin review.

---

### Issue 5 — DB Error: `column profiles.last_sign_in_at does not exist`

**Root cause:** The Postgres logs show a recurring ERROR: `column profiles.last_sign_in_at does not exist`. This column was removed from the `profiles` table (or never existed) but something still references it — likely a trigger, view, or the `get_admin_users_complete` RPC function.

**Fix:** Locate and fix the reference. Since the `routine_definition` is not directly readable via `information_schema` (PL/pgSQL body), add a migration that drops and recreates any trigger or function referencing `profiles.last_sign_in_at`.

---

## Files to Change

| File | Change |
|------|--------|
| `supabase/migrations/[new].sql` | Add `verification_status` column to `cars`; add trigger to sync `profiles.verification_status`; fix `last_sign_in_at` reference |
| `src/components/admin/CarVerificationTable.tsx` | Query `verification_status = 'pending'` instead of `is_available = false`; approval sets both `verification_status = 'approved'` and `is_available = true` |
| `src/components/admin/KYCVerificationTable.tsx` | Broaden status filter to include `not_started`, `in_progress`, `pending_review` |
| `src/components/admin/VerificationManagementTable.tsx` | Fix action button condition from `=== "pending"` to `=== "pending_review"`; sync `profiles.verification_status` on approve/reject |
| `src/components/admin/AdminStats.tsx` | Fix "Pending Verifications" query to count only `pending_review` and `in_progress` |

---

## Technical Details

### Migration: Cars Verification Status Column

```sql
ALTER TABLE cars ADD COLUMN IF NOT EXISTS 
  verification_status TEXT NOT NULL DEFAULT 'pending' 
  CHECK (verification_status IN ('pending', 'approved', 'rejected'));

-- All existing is_available=true cars are already approved
UPDATE cars SET verification_status = 'approved' WHERE is_available = true;
-- All existing is_available=false cars remain as pending (admin queue)
```

### Migration: Trigger to Sync profiles.verification_status

```sql
CREATE OR REPLACE FUNCTION sync_profile_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET verification_status = NEW.overall_status
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_verification_status_change
  AFTER INSERT OR UPDATE OF overall_status ON user_verifications
  FOR EACH ROW EXECUTE FUNCTION sync_profile_verification_status();

-- Backfill existing completed/rejected verifications into profiles
UPDATE profiles p
SET verification_status = uv.overall_status
FROM user_verifications uv
WHERE uv.user_id = p.id
  AND uv.overall_status IN ('completed', 'rejected', 'pending_review', 'in_progress');
```

### CarVerificationTable Query Change

```typescript
// Before (broken):
.eq("is_available", false)

// After (correct):
.eq("verification_status", "pending")
```

### Approval Action Change

```typescript
// Before:
.update({ is_available: true })

// After (approve = verified + make live):
.update({ verification_status: 'approved', is_available: true })

// Reject = mark rejected but keep hidden:
.update({ verification_status: 'rejected', is_available: false })
```

### VerificationManagementTable Button Condition

```typescript
// Before (never matches real data):
{verification.overall_status === "pending" && ( ... )}

// After (matches real DB enum value):
{verification.overall_status === "pending_review" && ( ... )}
```

### AdminStats Query Fix

```typescript
// Before (counts 156+ not_started records as "pending"):
.neq("overall_status", "completed")

// After (only genuinely actionable items):
.in("overall_status", ["pending_review", "in_progress"])
```

### KYCVerificationTable Query Fix

```typescript
// Before (returns 0 rows - no records have these statuses):
.in("overall_status", ["pending_review", "in_progress"])

// After (shows all items needing attention):
.in("overall_status", ["pending_review", "in_progress", "not_started"])
.gt("current_step", "personal_info") // Only show those who have progressed past start
```
