

# Plan: Update UI Display Issues Doc, Cross-Reference Hotfix, Fix Week 4 Report Gaps

## Findings

1. **`VerificationRequiredDialog.tsx` missing from both documents** — 3 instances of `bg-gray-50` (lines 145, 152, 159) not tracked anywhere.

2. **`UI_DISPLAY_ISSUES_2026-02-02.md` has no cross-references** — No link to the hotfix tracker where its tasks were promoted to MOB tickets (MOB-118 through MOB-126). No status updates since original creation.

3. **Hotfix doc references UI Display Issues in Section E context (line 527) but only in prose** — No formal "Related Documents" section exists in the hotfix doc.

4. **Week 4 report gaps:**
   - References UI Display Issues on line 506 but only as a link — no discussion of its relationship to hotfix MOB tickets
   - `docs/20260225_HOST_LINKED_PROMO_CODES.md` (Host-Linked Promo Codes feature spec, created Feb 25) is **not referenced** in the Week 4 report
   - GTM Plan path is wrong: listed as `docs/COMMERCIALIZATION_GTM_PLAN_V2.4.md` but the actual file is `docs/20260206_MobiRides_Commercialization_GTM_Plan.md`
   - `docs/NAVIGATION_UX_IMPROVEMENT_PLAN_2026-02-02.md` is not referenced in Week 4
   - `docs/Advisory_Meeting_Agenda_06-02-2026.md` and `docs/MobiRides_Valuation_Framework_06-02-2026.md` are not referenced

## Changes

### 1. Update `docs/UI_DISPLAY_ISSUES_2026-02-02.md`

- Add `VerificationRequiredDialog.tsx` to Issue 3 (Color Contrast) affected files table
- Add implementation status column to all task tables showing which are now tracked as MOB tickets
- Add a "Related Documents" section at the top linking to:
  - `docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md` (MOB-118 to MOB-126)
  - `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
- Update the Summary section with current status (e.g., "Issues 1, 5, 6, 7 promoted to hotfix MOB-118 to MOB-122")
- Bump document version / last-updated date

### 2. Update `docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md`

- Add a "Related Documents" section (after the Definition of Done) linking back to `UI_DISPLAY_ISSUES_2026-02-02.md` as the source audit
- Add `VerificationRequiredDialog.tsx` to Section E (MOB-121 audit table) as an additional component needing `bg-gray-50 → bg-muted` fix
- Optionally note the color contrast issue class from Issue 3 as a separate concern from avatar fixes

### 3. Update `docs/Product Status/WEEK_4_FEBRUARY_2026_STATUS_REPORT.md`

- Fix the GTM Plan path in Document References (line 503)
- Add missing document references:
  - `docs/20260225_HOST_LINKED_PROMO_CODES.md`
  - `docs/NAVIGATION_UX_IMPROVEMENT_PLAN_2026-02-02.md`
  - `docs/Advisory_Meeting_Agenda_06-02-2026.md`
  - `docs/MobiRides_Valuation_Framework_06-02-2026.md`

### Files to Modify

| File | Changes |
|------|---------|
| `docs/UI_DISPLAY_ISSUES_2026-02-02.md` | Add VerificationRequiredDialog, status tracking, cross-references |
| `docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md` | Add Related Documents section, add VerificationRequiredDialog to MOB-121 |
| `docs/Product Status/WEEK_4_FEBRUARY_2026_STATUS_REPORT.md` | Fix GTM path, add 4 missing doc references |

