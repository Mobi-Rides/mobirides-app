
# Epic MOB-400: Map Module Hotfix — Full Diagnostic Recovery

**Owner:** Modisa Maphanyane  
**Created:** 2026-03-09  
**Priority:** P0 — Blocker  
**Status:** Phase 1 In Progress  
**Affected Route:** `/map`

---

## Summary

The Map page crashes on load due to a runtime error in the Mapbox destination marker effect. Additional instability exists in handover session queries and provider architecture. This hotfix addresses the crash, stabilizes handover integration, and hardens the module against regressions.

---

## Phase 1: Stop the Crash (Hotfix) ✅ DONE

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-401 | Fix destination state init to nullable | Done ✅ | `src/pages/Map.tsx` |
| MOB-402 | Add `Number.isFinite` coordinate guards in marker effects | Done ✅ | `src/components/map/CustomMapbox.tsx` |
| MOB-403 | Add dependency array to destination marker effect | Done ✅ | `src/components/map/CustomMapbox.tsx` |

### Root Cause
`Map.tsx` initializes `destination` as `{ latitude: null, longitude: null }` (truthy object). `CustomMapbox.tsx` checks `!destination` (always false), then calls `marker.setLngLat([null, null])` → Mapbox throws → ErrorBoundary catches → blank page.

### Fix
- Change `destination` default to `null`.
- Guard all `setLngLat` calls with `Number.isFinite(lat) && Number.isFinite(lng)`.
- Ensure marker effect has correct dependency array `[destination]`.

---

## Phase 2: Stabilize Handover Integration ✅ DONE

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-404 | Replace `.single()` with list + pick-latest in active handover query | Done ✅ | `src/pages/Map.tsx` |
| MOB-405 | Remove redundant HandoverProvider wrapping | Deferred | `src/pages/Map.tsx`, `src/App.tsx` |
| MOB-406 | Export and use `useHandoverSafe` consistently | Done ✅ | `src/contexts/HandoverContext.tsx`, `src/components/map/CustomMapbox.tsx` |

### Root Cause
`fetchActiveHandoverHost()` uses `.single()` but DB contains duplicate active sessions → 406 PGRST116. Dual `HandoverProvider` in `App.tsx` + `Map.tsx` risks double-init.

### Fix
- Use `.order('updated_at', { ascending: false }).limit(1)` instead of `.single()`.
- Audit provider tree; keep single canonical provider location.

---

## Phase 3: Data Integrity (Backend) 🟡 TODO

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-407 | Deduplicate active handover sessions | Todo | `supabase/migrations/` |
| MOB-408 | Add partial unique index on active sessions | Todo | `supabase/migrations/` |
| MOB-409 | Make session creation idempotent (conflict-safe) | Todo | `src/services/handoverService.ts` |

### Root Cause
No unique constraint prevents multiple active `handover_sessions` for the same booking + type + renter. Concurrent calls create duplicates.

### Fix
- Migration: DELETE duplicates keeping newest, then CREATE UNIQUE INDEX on `(booking_id, handover_type, renter_id) WHERE handover_completed = false`.
- Service: Use `INSERT ... ON CONFLICT` or check-then-create with row lock.

### Migration Impact Checklist (MOB-113)

Before deploying MOB-407/MOB-408 migration:

- [ ] **1. Consumer Search** — Run: `grep -r "handover_sessions" src/ --include="*.ts" --include="*.tsx"`
- [ ] **2. Return Schema Verification** — Confirm migration return schema matches all frontend TypeScript interfaces
- [ ] **3. No Breaking Renames/Removals** — Use additive changes only; no column renames without UI updates
- [ ] **4. Build Verification** — Run `npm run build` immediately after applying migration
- [ ] **5. Dependency Documentation** — Add header comment listing consumers:
  ```sql
  -- Consumers: src/pages/Map.tsx, src/services/handoverService.ts, src/contexts/HandoverContext.tsx
  -- Impact: Deduplicates active sessions, adds partial unique index, no breaking changes
  ```

#### RPC/Function Guidelines
- Always `DROP FUNCTION IF EXISTS` before `CREATE`
- Use `SECURITY DEFINER` with `SET search_path = public` for cross-schema joins
- Grant execute: `GRANT EXECUTE ON FUNCTION ... TO authenticated;`

#### RLS Policy Guidelines
- Use `SECURITY DEFINER` helper functions to prevent infinite recursion
- Never query the same table a policy protects without a security definer wrapper

#### Rollback Strategy
Document rollback SQL in migration comments for destructive changes.

---

## Phase 4: Module Hardening 🟡 TODO

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-410 | Normalize all coordinate validation to `Number.isFinite` | Todo | `src/components/map/*` |
| MOB-411 | Add error telemetry for map init + handover query failures | Todo | `src/components/map/CustomMapbox.tsx`, `src/pages/Map.tsx` |

---

## Validation Checklist

- [ ] `/map` renders without ErrorBoundary in preview and published
- [ ] Non-handover mode: host markers load, no crash without destination
- [ ] Handover mode: no 406 for active session query, single session used
- [ ] Car details map and booking map still function (regression check)
- [ ] No infinite remounting/flicker of map container

---

## Architecture Decisions

- **`useHandoverSafe`** (Option A — safe hook) chosen over try/catch wrapper. Returns `null` outside provider.
- **Destination state** changed from `{ latitude: null, longitude: null }` to `null` to leverage JS falsy checks.
- **Session dedup** uses partial unique index (PostgreSQL) rather than application-level locks.

## Files Changed (All Phases)

| File | Change |
|------|--------|
| `src/pages/Map.tsx` | Nullable destination, safe handover query, single provider |
| `src/components/map/CustomMapbox.tsx` | Coordinate guards, safe hook, effect deps |
| `src/contexts/HandoverContext.tsx` | Added `useHandoverSafe` export |
| `src/services/handoverService.ts` | Idempotent session creation |
| `supabase/migrations/` | Dedup + partial unique index migration |

---

## Previous Epic (Completed)

<details>
<summary>MOB-300: Help Center Hotfix (Completed)</summary>

### Phase 1: Database-Driven Guides ✅
- Migrated hardcoded guide content to `guides` table in Supabase
- Created `useGuides`, `usePopularGuides`, `useSearchGuides` hooks
- Created `useGuideContent` hook for individual guide rendering
- Updated `HelpCenter.tsx` and `HelpSection.tsx` to fetch from DB

### Phase 2: Persist Progress ✅
- Created `user_guide_progress` table with RLS policies
- Created `useGuideProgress` hook (fetch/upsert via TanStack Query)
- Added progress bar and completion badge to guide UI

### Phase 3: Content Expansion ✅
- Seeded Renter Safety Guidelines, Host Handover Process, 4 shared platform guides

### Phase 4: Component Library & Admin Management ✅
- Extracted `GuideLayout`, `GuideProgressTracker` components
- Built Admin FAQ & Guide Management page with full CRUD
</details>
