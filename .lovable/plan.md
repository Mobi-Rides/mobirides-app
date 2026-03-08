
# Epic MOB-300: Help Center Hotfix — Status

**Owner:** Modisa Maphanyane  
**Started:** 2026-03-08  
**Status:** Phase 3 Complete — Ready for Phase 4

## Completed Phases

### Phase 1: Database-Driven Guides ✅
- Migrated hardcoded guide content to `guides` table in Supabase
- Created `useGuides`, `usePopularGuides`, `useSearchGuides` hooks
- Created `useGuideContent` hook for individual guide rendering
- Updated `HelpCenter.tsx` and `HelpSection.tsx` to fetch from DB

### Phase 2: Persist Progress ✅
- Created `user_guide_progress` table with RLS policies
- Created `useGuideProgress` hook (fetch/upsert via TanStack Query)
- Added progress bar and completion badge to guide UI
- Checkboxes persist step completion across sessions

### Phase 3: Content Expansion ✅
- **MOB-307:** Seeded Renter Safety Guidelines (6 steps)
- **MOB-308:** Seeded Host Handover Process (6 steps)
- **MOB-309:** Seeded 4 shared platform guides with `role='shared'`:
  - Terms of Service (5 steps)
  - Cancellation & Refund Policy (5 steps)
  - Community Guidelines (5 steps)
  - Data Privacy & Security (5 steps)
- Updated `useGuides.ts` — all 3 query functions use `.in('role', [role, 'shared'])`
- Updated `useGuideContent.ts` — resolves shared guides from either role route
- Updated `HelpCenter.tsx` — added icon mappings (Shield, FileText, Heart, Lock)

## Phase 4: Component Library & Contextual Help (Planned)
- **MOB-310:** Extract `GuideLayout` component
- **MOB-311:** Extract `GuideProgressTracker` component
- **MOB-312:** Create `ContextualHelp` tooltip component
- **MOB-313:** Integrate contextual help into booking/handover flows

## Architecture Decisions
- **Shared guides use `role='shared'`** (Option B — single source of truth) rather than duplicating rows per role. Hooks query `.in('role', [role, 'shared'])`.
- **Progress stored server-side** in `user_guide_progress` table with `completed_steps` JSONB column.
- **Guide content stored as JSONB** in `guides.content` with `steps[]` array structure.

## Files Changed (All Phases)
| File | Change |
|------|--------|
| `src/hooks/useGuides.ts` | DB queries with shared role support |
| `src/hooks/useGuideContent.ts` | Single guide fetch with shared role support |
| `src/hooks/useGuideProgress.ts` | New — progress persistence hook |
| `src/pages/HelpCenter.tsx` | DB-driven listing with icon mappings |
| `src/pages/HelpSection.tsx` | Progress tracking UI integration |
| `supabase/migrations/` | 4 migrations (guides table, content seed, progress table, shared guides seed) |
