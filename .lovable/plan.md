
# Epic MOB-300: Help Center Hotfix — Status

**Owner:** Modisa Maphanyane  
**Started:** 2026-03-08  
**Status:** Phase 4 In Progress

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
- **MOB-309:** Seeded 4 shared platform guides with `role='shared'`
- Updated hooks to use `.in('role', [role, 'shared'])`
- Added icon mappings (Shield, FileText, Heart, Lock)

### Phase 4: Component Library & Admin Management ✅
- **MOB-310:** Extracted `GuideLayout` component (`src/components/help/GuideLayout.tsx`)
- **MOB-311:** Extracted `GuideProgressTracker` component (`src/components/help/GuideProgressTracker.tsx`)
- **MOB-314:** Built Admin FAQ & Guide Management page (`src/pages/admin/AdminGuides.tsx`)
  - Full CRUD: create, edit, delete guides
  - Inline step editor with action labels
  - Role selector (renter/host/shared), popularity toggle, sort order
  - Search/filter, delete confirmation dialog
  - Route: `/admin/guides`, added to AdminSidebar
- Refactored `HelpSection.tsx` to use extracted components

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
