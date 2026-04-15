# Anonymize-on-Delete Implementation Plan

**Created:** 2026-03-02  
**Last Updated:** April 15, 2026  
**Status:** 🟡 Partially Live — Phases 1–2 shipped (Sprint 9 + S11-015). Phases 3–6 (admin table guards, RLS updates, testing, docs) outstanding and unverified.  
**Priority:** P1 — Data Integrity / Business Analytics Preservation  
**Owner:** Engineering

### Status Summary (as of April 15, 2026)

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 — DB Migration | `is_deleted`, `deleted_at`, `deleted_by` columns on `profiles` | ✅ Done (S9-004) |
| Phase 2 — Edge Functions | `delete-user-with-transfer` + `bulk-delete-users` refactored | ✅ Done (S9-009, S11-015) |
| Phase 3 — Frontend Guards | Admin table filter for soft-deleted users | 🔴 Needs verification |
| Phase 4 — RLS Policies | `is_deleted = false` filter on `profiles` SELECT policies | 🔴 Needs verification |
| Phase 5 — Testing | E2E test cases (MOB-137) | 🔴 Not Started |
| Phase 6 — Documentation | Update `INSURANCE_README.md`, knowledge base | 🔴 Not Started |  

---

## 1. Problem Statement

Both `delete-user-with-transfer` and `bulk-delete-users` edge functions currently **hard-delete** all user data, destroying historical business intelligence needed for:

- Revenue & booking volume analytics
- Commission tracking & host earnings history
- Payment method & completion rate reporting
- Insurance claims & policy analytics
- Supply-side metrics (car listings, pricing trends)
- Review/rating averages & trust metrics
- Financial reconciliation (remittance batches)

---

## 2. Solution: Anonymize + Soft-Delete

Keep original UUIDs to preserve FK integrity. Scrub PII from the profile; hard-delete only privacy-sensitive tables.

### 2.1 Data Classification

| Category | Tables | Action |
|----------|--------|--------|
| **PII — Hard Delete** | `conversation_messages`, `conversation_participants`, `conversations`, `notifications`, `saved_cars`, `user_verifications`, `license_verifications`, `user_restrictions`, `user_roles`, `device_tokens`, `identity_keys`, `documents` | `DELETE` rows |
| **Analytics — Preserve** | `bookings`, `wallet_transactions`, `payment_transactions`, `host_wallets`, `insurance_purchases`, `insurance_claims`, `remittance_batches`, `commission_rates` | Keep all rows intact (no text PII in these) |
| **Analytics — Anonymize Text** | `reviews` | `UPDATE` free-text to `'[removed]'`, keep star ratings |
| **Analytics — Anonymize Text** | `cars`, `car_images`, `car_blocked_dates` | `UPDATE` description/location text to `'[removed]'`, keep brand/model/type/price/year |
| **Identity — Soft Delete** | `profiles` | Scrub PII fields, set `is_deleted = true` |
| **Auth — Hard Delete** | `auth.users` (via admin API) | `DELETE` (prevents login) |
| **Admin Records** | `admins`, `admin_capabilities`, `admin_sessions` | `DELETE` rows (admins are protected from deletion anyway) |

---

## 3. Implementation Phases

### Phase 1: Database Migration *(Day 1)*

**Target date:** 2026-03-03  
**Ticket:** MOB-130

Add soft-delete columns to `profiles`:

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

COMMENT ON COLUMN public.profiles.is_deleted IS 'Soft-delete flag for anonymized users';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Timestamp of account deletion';
COMMENT ON COLUMN public.profiles.deleted_by IS 'Admin who performed the deletion';
```

**Validation:** Confirm columns exist, defaults applied, no breaking changes to existing queries.

---

### Phase 2: Refactor Edge Functions *(Days 2–3)*

**Target date:** 2026-03-04 – 2026-03-05

#### MOB-131: Refactor `delete-user-with-transfer/index.ts`

Replace hard-delete logic with:

```
Step 1: Hard-delete PII tables
  → conversation_messages, conversation_participants, conversations
  → notifications, saved_cars
  → user_verifications, license_verifications
  → user_restrictions, user_roles
  → device_tokens, identity_keys, documents

Step 2: Anonymize text in analytics tables
  → reviews: SET comment = '[removed]', keep rating fields
  → cars: SET description = '[removed]', location = '[removed]'
  → car_images: DELETE (images are PII)
  → car_blocked_dates: keep (no PII)

Step 3: Soft-delete profile
  → UPDATE profiles SET
      full_name = 'Deleted User',
      avatar_url = NULL,
      phone_number = NULL,
      is_deleted = true,
      deleted_at = now(),
      deleted_by = <admin_id>

Step 4: Delete auth user
  → supabaseAdmin.auth.admin.deleteUser(userId)

Step 5: Audit log (existing)
```

#### MOB-132: Refactor `bulk-delete-users/index.ts`

Same anonymization logic as MOB-131, applied per-user in the loop. Extract shared `anonymizeAndDeleteUser()` helper to avoid duplication.

#### MOB-133: Create shared deletion utility

Create `supabase/functions/_shared/user-deletion.ts` with:
- `anonymizeUser(supabaseAdmin, userId, adminId, reason)` — shared by both edge functions
- `DeleteResult` type definition (moved from inline)

---

### Phase 3: Frontend Guards *(Day 4)*

**Target date:** 2026-03-06

#### MOB-134: Filter soft-deleted users in admin table

**File:** `src/components/admin/UnifiedUserTable.tsx`

- Add `.eq('is_deleted', false)` to default user query
- Add toggle: "Show deleted users" checkbox for admin visibility
- Display `[Deleted]` badge on soft-deleted profiles

#### MOB-135: Handle "Deleted User" display gracefully

**Files:** Components that display user names from profile joins

- Ensure `full_name = 'Deleted User'` renders cleanly (no broken avatars, no click-through to empty profiles)
- Components already handle null avatars via `getAvatarPublicUrl` fallback

---

### Phase 4: RLS Policy Updates *(Day 4)*

**Target date:** 2026-03-06  
**Ticket:** MOB-136

Update RLS policies on `profiles` to exclude soft-deleted users from normal queries:

```sql
-- Amend existing SELECT policies to add:
AND (is_deleted = false OR is_deleted IS NULL)
```

**Exception:** Admin queries should still see soft-deleted profiles (for audit trail).

---

### Phase 5: Testing & Validation *(Day 5)*

**Target date:** 2026-03-07  
**Ticket:** MOB-137

| Test Case | Expected Result |
|-----------|----------------|
| Delete a renter via admin panel | Profile anonymized, bookings preserved, auth removed |
| Delete a host via admin panel | Profile anonymized, cars anonymized (keep pricing), bookings preserved |
| Bulk delete 3 users | All 3 anonymized, analytics intact |
| Admin dashboard booking stats | Revenue/booking counts unchanged after deletion |
| Wallet transaction history | All historical transactions visible with "Deleted User" name |
| User search in admin table | Deleted users hidden by default, visible with toggle |
| Deleted user tries to log in | Auth fails (auth.users row removed) |
| Review display on car page | Shows star rating, text shows "[removed]", author shows "Deleted User" |

---

### Phase 6: Documentation *(Day 5)*

**Target date:** 2026-03-07  
**Ticket:** MOB-138

- Update `docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md` — Add Section G
- Update `.trae/documents/user-deletion-implementation-plan.md` — Mark superseded
- Update knowledge base custom instructions if needed

---

## 4. Preserved Analytics Summary

After anonymization, the following metrics remain fully queryable:

| Metric | Source Table | Fields Preserved |
|--------|-------------|-----------------|
| Booking volume & revenue | `bookings` | `total_price`, `commission_amount`, `status`, `start_date`, `end_date` |
| Commission tracking | `bookings`, `commission_rates` | `commission_amount`, `commission_status`, `rate` |
| Host earnings | `wallet_transactions` | `amount`, `type`, `created_at` |
| Payment analytics | `payment_transactions` | `amount`, `provider`, `status`, `method` |
| Car supply metrics | `cars` | `brand`, `model`, `vehicle_type`, `price_per_day`, `year` |
| Review ratings | `reviews` | `rating`, `category_ratings`, `created_at` |
| Insurance data | `insurance_claims`, `insurance_purchases` | All financial fields |
| Platform reconciliation | `remittance_batches` | All fields |

---

## 5. Rollback Plan

- **Migration rollback:** Drop `is_deleted`, `deleted_at`, `deleted_by` columns
- **Edge function rollback:** Revert to previous hard-delete versions
- **RLS rollback:** Remove `is_deleted` filter from policies
- **Data note:** Any users anonymized during the active period cannot be un-anonymized (PII already scrubbed)

---

## 6. Ticket Summary

| Ticket | Description | Phase | Target Date | Status |
|--------|-------------|-------|-------------|--------|
| MOB-130 | Add soft-delete columns to profiles | 1 | 2026-03-03 | Todo |
| MOB-131 | Refactor `delete-user-with-transfer` | 2 | 2026-03-04 | Todo |
| MOB-132 | Refactor `bulk-delete-users` | 2 | 2026-03-05 | Todo |
| MOB-133 | Create shared deletion utility | 2 | 2026-03-04 | Todo |
| MOB-134 | Filter soft-deleted users in admin table | 3 | 2026-03-06 | Todo |
| MOB-135 | Handle "Deleted User" display | 3 | 2026-03-06 | Todo |
| MOB-136 | Update RLS policies for soft-delete | 4 | 2026-03-06 | Todo |
| MOB-137 | End-to-end testing | 5 | 2026-03-07 | Todo |
| MOB-138 | Documentation updates | 6 | 2026-03-07 | Todo |
