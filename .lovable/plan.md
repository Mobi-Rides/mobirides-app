

# MOB-309: Shared Platform Guides — Decision & Plan

## The Decision

The current system routes guides via `/help/:role/:section` where `role` is `renter` or `host`. The `guides` table has a `role TEXT` column. Shared guides (Terms of Service, Cancellation Policy, etc.) need to appear in **both** help centers.

### Option A: Duplicate content per role
- Insert each shared guide twice — once with `role = 'renter'`, once with `role = 'host'`
- **Pro:** Zero code changes. Works immediately with existing hooks, routes, and queries.
- **Con:** Content duplication in DB. Editing a policy requires updating two rows.

### Option B: Add a `shared` role value
- Insert shared guides with `role = 'shared'`
- Modify `useGuides(role)` query to fetch `.in('role', [role, 'shared'])`
- Modify `usePopularGuides(role)` similarly
- Modify `useGuideContent` to also check `role = 'shared'` when guide not found for the given role
- **Pro:** Single source of truth. Edit once, appears in both.
- **Con:** Requires changes to 2 hooks and `useGuideContent`. Route still shows `/help/renter/cancellation-policy` which is slightly misleading but functionally fine.

### Recommendation: Option B (single source of truth)

With only 4 shared guides planned, the duplication seems minor — but future policy updates become error-prone with Option A. Option B requires small query changes (~3 lines across 2 files) and is cleaner long-term.

## Implementation Plan

### 1. Seed 4 shared guides (data insert, no migration)
Insert into `guides` with `role = 'shared'`:

| Section | Title | Steps | Read Time |
|---|---|---|---|
| `terms-of-service` | Platform Terms of Service | 5 steps (account terms, liability, dispute resolution, termination, updates) | 5 min |
| `cancellation-policy` | Cancellation & Refund Policy | 5 steps (renter cancellation windows, host cancellation rules, refund timelines, no-show policy, exceptions) | 4 min |
| `community-guidelines` | Community Guidelines | 5 steps (respectful communication, vehicle care, honest listings, review etiquette, reporting violations) | 4 min |
| `data-privacy` | Data Privacy & Security | 5 steps (data collection, usage, sharing, your rights, account deletion) | 5 min |

### 2. Update hooks to include shared guides
**`src/hooks/useGuides.ts`** — Change `.eq('role', role)` to `.in('role', [role, 'shared'])` in:
- `useGuides(role)` (line 21)
- `usePopularGuides(role)` (line 46)
- `useSearchGuides(query, role)` (line 74)

**`src/hooks/useGuideContent.ts`** — Change `.eq('role', role)` to `.in('role', [role, 'shared'])` so shared guide sections resolve correctly from either `/help/renter/...` or `/help/host/...`.

### 3. Add icon mapping for new sections
**`src/pages/HelpCenter.tsx`** — Add entries to `iconMap` for the 4 new sections (e.g., `Shield`, `FileText`, `Heart`, `Lock` from lucide-react).

### Files changed
- `src/hooks/useGuides.ts` — 3 query changes (`.eq` → `.in`)
- `src/hooks/useGuideContent.ts` — 1 query change
- `src/pages/HelpCenter.tsx` — 4 icon mappings added
- Data insert (4 rows into `guides` table)

**Effort:** S (~1-2 hours)

