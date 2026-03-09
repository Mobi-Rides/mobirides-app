

# Migration Audit Report — Pre-Phase 3 Analysis

**Date:** 2026-03-09  
**Purpose:** Validate migration state before creating `handover_sessions` deduplication migration

---

## 1. Migration Count Comparison

| Location | Count | Notes |
|----------|-------|-------|
| **Remote (Supabase)** | 231 | Non-empty entries in `schema_migrations` |
| **Local (active)** | ~177 | `.sql` files in `supabase/migrations/` (excluding archive) |
| **Archived** | ~60+ | In `supabase/migrations/archive/` |

**Status:** ⚠️ Remote has more entries than local active files — expected due to Lovable's timestamp-based tracking and previous consolidations.

---

## 2. `handover_sessions` Table Current State

### Existing Indexes
| Index | Type | Columns |
|-------|------|---------|
| `handover_sessions_pkey` | UNIQUE | `(id)` |
| `idx_handover_sessions_booking_type` | NON-UNIQUE | `(booking_id, handover_type)` |

### Existing Constraints
- Foreign keys to `bookings(id)`, `profiles(id)` for host/renter
- CHECK constraints for `handover_location_type` and `waiting_for`

### Missing (Phase 3 Target)
- ❌ **No unique constraint on active sessions** — Allows duplicates
- ❌ **No partial unique index** for `(booking_id, handover_type, renter_id) WHERE handover_completed = false`

---

## 3. Duplicate Session Data (Production)

```
booking_id                                handover_type  duplicates
----------------------------------------  -------------  ----------
eeefada8-371b-4b44-885a-d1fabccc87fb     pickup         10
5ea991e2-ae2b-4ea9-af37-ebaba730bca0     pickup         9
3c438b64-ad7f-4284-8460-bd377017fba7     pickup         6
443bcb7f-f142-4dc9-9fd0-53169c7d2b83     pickup         4
(... 16 more with 2-4 duplicates ...)
```

**Finding:** Multiple active sessions exist per booking — confirms Phase 3 is needed and not previously implemented.

---

## 4. Existing Handover Migrations (No Conflicts)

Searched 31 files referencing `handover_sessions`. Key migrations:

| File | Purpose |
|------|---------|
| `20250101000002_create_handover_sessions_table.sql` | Original table + basic indexes |
| `20250724124757_...corrected_RLS_policies...` | RLS policies |
| `20250728080316_cleanup_orphaned_handovers.sql` | Data cleanup (completed sessions) |

**Conclusion:** No existing migration creates a unique index on active sessions. Phase 3 is **safe to proceed** without duplication.

---

## 5. Remote Entries Without Local Files

Several remote entries use short names (legacy Lovable format):
- `add_handover_progress_rpc`
- `interactive_handover_overhaul`
- `interactive_handover_refinement`

These were applied via Supabase dashboard or Lovable deployments. **No action required** — they are already applied remotely.

---

## 6. Phase 3 Implementation Readiness

### Pre-Conditions ✅
- [x] No existing unique constraint to conflict with
- [x] No prior deduplication migration exists
- [x] Duplicate data confirmed in production
- [x] Consumer files identified:
  - `src/pages/Map.tsx`
  - `src/services/handoverService.ts`
  - `src/contexts/HandoverContext.tsx`
  - `src/hooks/useHandoverSession.ts`

### Migration Plan (MOB-407 + MOB-408)

**File:** `20260309HHMMSS_dedupe_handover_sessions_and_add_unique_index.sql`

```sql
-- Consumers: src/pages/Map.tsx, src/services/handoverService.ts, 
--            src/contexts/HandoverContext.tsx, src/hooks/useHandoverSession.ts
-- Impact: Deduplicates active sessions (keeps newest), adds partial unique index
-- Rollback: DROP INDEX IF EXISTS idx_unique_active_handover_session;

-- Step 1: Deduplicate active sessions (keep most recent by updated_at)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY booking_id, handover_type, renter_id 
    ORDER BY updated_at DESC
  ) as rn
  FROM handover_sessions
  WHERE handover_completed = false
)
DELETE FROM handover_sessions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Step 2: Create partial unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_handover_session
ON handover_sessions (booking_id, handover_type, renter_id)
WHERE handover_completed = false;
```

### Service Change (MOB-409)

Update `createPickupHandoverSession` / `createReturnHandoverSession` in `handoverService.ts` to use `INSERT ... ON CONFLICT DO NOTHING` pattern:

```typescript
const { data, error } = await supabase
  .from('handover_sessions')
  .upsert(sessionData, { 
    onConflict: 'booking_id,handover_type,renter_id',
    ignoreDuplicates: true 
  })
  .select()
  .single();
```

---

## 7. Recommendation

**Proceed with Phase 3** — The audit confirms:
1. No duplicate migrations exist
2. No unique constraint exists on the table
3. Production data confirms duplicates need cleanup
4. All consumer files have been identified for the checklist

The migration is additive (index creation) and data-cleaning (dedup), with no schema-breaking changes.

