# HOTFIX 3: Help Center Completion
**Epic:** MOB-300  
**Date:** 2026-03-08  
**Priority:** P1  
**Reference:** `docs/archived/Host-Renter-Guide-Development-Recommendation.md`

---

## Current State Summary

### ✅ Already Implemented
| Item | Status | Files |
|---|---|---|
| `guides` table (id, role, section, title, description, content JSONB, read_time, is_popular, sort_order) | ✅ Live | Supabase |
| RLS policy: authenticated users can read guides | ✅ Live | Supabase |
| 8 seeded guides (4 renter, 4 host) | ✅ Live | Supabase |
| `/help/:role` category listing page | ✅ Live | `src/pages/HelpCenter.tsx` |
| `/help/:role/:section` step-by-step guide page | ✅ Live | `src/pages/HelpSection.tsx` |
| `useGuides(role)` — fetch guides by role | ✅ Live | `src/hooks/useGuides.ts` |
| `usePopularGuides()` — fetch popular guides | ✅ Live (buggy) | `src/hooks/useGuides.ts` |
| `useSearchGuides(query, role)` — ilike search | ✅ Live | `src/hooks/useGuides.ts` |
| `useGuideContent(role, section)` — single guide fetch | ✅ Live | `src/hooks/useGuideContent.ts` |
| Search bar with inline results | ✅ Live | `src/pages/HelpCenter.tsx` |
| Step completion checkboxes (client-side only) | ✅ Live (broken) | `src/pages/HelpSection.tsx` |
| Protected routes | ✅ Live | Router config |

### ❌ Not Implemented (from Recommendation Doc)
| Item | Gap |
|---|---|
| `user_guide_progress` table | 100% missing — progress lost on refresh |
| `slug`, `is_published`, `category` columns on guides | Missing from schema |
| Action button routing (step actions → app routes) | Buttons render but do nothing |
| Contact Support integration | Dead-end buttons |
| Popular guides role filtering | Shows mixed host/renter content |
| Component library (`GuideLayout`, `GuideProgressTracker`, `ContextualHelp`) | 0 components built |
| Shared guides (Platform Policies, Safety, Legal) | No content |
| Missing guide sections (Renter Safety, Host Handover Process) | No content |
| Contextual help tooltips on Booking/Listing/Verification forms | Not started |
| Progressive disclosure (tooltips → panels → interactive → docs) | Only full docs exist |
| Admin guide content management UI | Not started |
| Analytics (view counts, search tracking, feedback) | Not started |
| Related content suggestions | Not started |
| Recently viewed tracking | Not started |
| Accessibility (screen reader, keyboard nav) | Not addressed |

---

## Tickets

### Phase 1: Fix Broken Functionality

**MOB-301 — Wire action buttons to app routes** (P0)
- Type: Bug Fix
- File: `src/pages/HelpSection.tsx` (lines 115-119)
- Create: `src/utils/guideActionRoutes.ts`
- Current: `step.action` renders as button label but `onClick` is undefined. JSONB stores `{ label: "Go to Sign Up" }` but no route mapping exists.
- Fix: Create route mapping utility. Map action labels to app routes:
  - `"Edit Profile"` → `/edit-profile`
  - `"Go to Sign Up"` → `/signup`
  - `"Browse Cars"` → `/cars`
  - `"View Bookings"` → `/bookings`
  - `"Start Verification"` → `/verification`
  - `"List Your Car"` → `/add-car`
  - `"View Earnings"` → `/wallet`
  - `"Manage Bookings"` → `/host-bookings`
- Wire buttons: `onClick={() => navigate(getRouteForAction(step.action.label))}`
- Mobile-first: Buttons remain `size="sm" variant="outline"`, no layout changes needed
- Effort: XS

**MOB-302 — Fix popular guides role filtering** (P0)
- Type: Bug Fix
- File: `src/hooks/useGuides.ts` (lines 36-57)
- File: `src/pages/HelpCenter.tsx` (line 20)
- Current: `usePopularGuides()` fetches all popular guides regardless of role. Host sees renter popular articles and vice versa.
- Fix: Add `role` parameter to `usePopularGuides(role)`. Update query: `.eq('role', role)`. Update `HelpCenter.tsx` call site to pass `role`.
- Effort: XS

**MOB-303 — Wire Contact Support buttons** (P1)
- Type: Bug Fix
- Files: `src/pages/HelpSection.tsx` (line 134), `src/pages/HelpCenter.tsx` (line 114)
- Current: "Contact Support" buttons have no `onClick` handler
- Fix: Navigate to `/messages` with pre-filled support context, or show toast with support email/phone. For MVP: `onClick={() => navigate('/messages')}` with toast "Our support team will respond within 24 hours"
- Mobile-first: No layout changes, add toast feedback
- Effort: XS

---

### Phase 2: Persist Guide Progress

**MOB-304 — Create `user_guide_progress` table** (P1)
- Type: Migration
- Migration: `YYYYMMDDHHMMSS_create_user_guide_progress.sql`
- Schema:
  ```sql
  CREATE TABLE public.user_guide_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE NOT NULL,
    completed_steps JSONB DEFAULT '[]'::jsonb,
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, guide_id)
  );
  ALTER TABLE public.user_guide_progress ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can read own progress"
    ON public.user_guide_progress FOR SELECT
    TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own progress"
    ON public.user_guide_progress FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own progress"
    ON public.user_guide_progress FOR UPDATE
    TO authenticated USING (auth.uid() = user_id);
  ```
- Impact: New table only, no existing table changes
- Effort: S

**MOB-305 — Create `useGuideProgress` hook** (P1)
- Type: Feature
- Create: `src/hooks/useGuideProgress.ts`
- Implements:
  - `useGuideProgress(guideId)` — fetches user's progress for a specific guide
  - `useToggleStepCompletion(guideId)` — mutation to toggle a step's completion
  - Auto-calculates `progress` percentage on each toggle
  - Sets `completed_at` when all steps done
- Dependencies: MOB-304 (table must exist)
- Effort: S

**MOB-306 — Replace `useState` with persisted progress in HelpSection** (P1)
- Type: Refactor
- File: `src/pages/HelpSection.tsx`
- Current: `const [completedSteps, setCompletedSteps] = useState<number[]>([])` (line 12)
- Fix: Replace with `useGuideProgress` hook. Load completed steps from DB on mount. `toggleStep` calls mutation instead of local state update.
- Add progress bar below the badge showing `X of Y completed`
- Mobile-first: Progress bar uses `<Progress>` component, full-width, `h-2`
- Dependencies: MOB-305
- Effort: S

---

### Phase 3: Content Expansion

**MOB-307 — Add Renter Safety Guidelines guide** (P2)
- Type: Content / Seed Data
- Method: Insert into `guides` table via migration or admin UI
- Content scope (per Recommendation Doc):
  - Emergency procedures and contacts
  - Accident reporting steps
  - Insurance claim process
  - Vehicle safety checks before driving
  - What to do if the car breaks down
- Role: `renter`, Section: `safety-guidelines`
- Steps: 6-8 steps with action buttons linking to relevant app pages
- Effort: S

**MOB-308 — Add Host Handover Process guide** (P2)
- Type: Content / Seed Data
- Content scope (per Recommendation Doc):
  - Pre-handover vehicle preparation checklist
  - Identity verification during handover
  - Condition report walkthrough
  - Key exchange protocol
  - Post-handover confirmation steps
- Role: `host`, Section: `handover-process`
- Steps: 6-8 steps with action buttons
- Effort: S

**MOB-309 — Add shared platform guides** (P2)
- Type: Content / Seed Data
- Guides to add:
  - Platform Terms of Service summary (role: `renter` + `host` duplicated or new `shared` role)
  - Cancellation & Refund Policy
  - Community Guidelines
  - Data Privacy & Security
- Requires decision: add `shared` as a role value, or duplicate content per role
- Effort: M

---

### Phase 4: Component Library & Contextual Help

**MOB-310 — Extract `GuideLayout` wrapper component** (P2)
- Type: Refactor
- Create: `src/components/guides/GuideLayout.tsx`
- Extracts common layout from `HelpSection.tsx`: header with back button, title, read time, "Need more help?" footer
- Props: `title`, `readTime`, `role`, `children`
- Mobile-first: Sticky header, safe-area padding, scroll container
- Effort: S

**MOB-311 — Build `GuideProgressTracker` component** (P2)
- Type: Feature
- Create: `src/components/guides/GuideProgressTracker.tsx`
- Visual progress indicator: circular progress ring or horizontal bar
- Shows: steps completed / total, percentage, "Completed" badge when 100%
- Uses data from `useGuideProgress` hook
- Mobile-first: Compact inline display, fits in header or below title
- Dependencies: MOB-305
- Effort: S

**MOB-312 — Build `ContextualHelp` tooltip component** (P3)
- Type: Feature
- Create: `src/components/guides/ContextualHelp.tsx`
- Renders a `?` icon button that opens a popover with:
  - Brief explanation text
  - "Learn more" link to relevant guide section
- Props: `guideSection`, `role`, `helpText`
- Uses `@radix-ui/react-popover` (already installed)
- Mobile-first: Popover uses `side="top"` on mobile to avoid keyboard overlap, max-width constrained
- Effort: S

**MOB-313 — Integrate contextual help into key flows** (P3)
- Type: Integration
- Files to modify:
  - `BookingDialog.tsx` — tooltip on date selection, insurance, destination type
  - Car listing form — tooltip on pricing, features, vehicle type
  - Verification pages — tooltip on document requirements
- Each integration: add `<ContextualHelp guideSection="booking" helpText="..." />` next to relevant form labels
- Dependencies: MOB-312
- Effort: M

---

## Implementation Order

```
Phase 1 (Bugs):     MOB-301 → MOB-302 → MOB-303
Phase 2 (Persist):  MOB-304 → MOB-305 → MOB-306
Phase 3 (Content):  MOB-307 → MOB-308 → MOB-309
Phase 4 (UX):       MOB-310 → MOB-311 → MOB-312 → MOB-313
```

## Effort Summary

| Phase | Tickets | Total Effort |
|---|---|---|
| Phase 1: Bug Fixes | 3 | XS + XS + XS = ~2 hours |
| Phase 2: Persistence | 3 | S + S + S = ~1 day |
| Phase 3: Content | 3 | S + S + M = ~1.5 days |
| Phase 4: Components | 4 | S + S + S + M = ~2 days |
| **Total** | **13 tickets** | **~5 days** |

## Migration Checklist

Per project standards, before applying MOB-304 migration:
1. ✅ No existing table modifications (new table only)
2. ✅ RLS enabled with user-scoped policies
3. ✅ Foreign keys to `auth.users` and `guides` with CASCADE delete
4. ✅ Unique constraint prevents duplicate progress records
5. ✅ No impact on existing `guides` table or queries

## Notes

- The Recommendation Doc specifies admin content management (CRUD for guides). This is deferred to a future epic as it requires admin dashboard integration (Epic MOB-100 scope).
- Analytics (view counts, search tracking) are deferred — can be added incrementally via `guides.view_count` column and search event logging.
- The `slug` and `is_published` columns are nice-to-haves. Current `section` field serves as the URL identifier adequately. Can be added when admin publishing workflow is built.
