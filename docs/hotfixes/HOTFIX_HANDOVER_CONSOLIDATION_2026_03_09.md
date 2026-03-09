# MOB-500: Handover Step Consolidation (14 → 8)

**Date:** 2026-03-09  
**Priority:** P1 — High  
**Epic:** Handover UX Optimization  
**Status:** Ready for Implementation  
**Owner:** Modisa Maphanyane

---

## Summary

Reduce the interactive handover flow from 14 steps to 8 by merging redundant steps, replacing manual fuel/mileage entry with a mandatory dashboard photo, and adding post-rental handover data access for hosts (30-day window) and admins (permanent via Booking Management).

---

## Current vs Proposed Steps

```text
CURRENT (14 steps)                         PROPOSED (8 steps)
─────────────────                          ──────────────────
 1. Location Selection (host)         →  1. Select Location (host)
 2. Location Confirmation (renter)    ┐
 3. En Route — Renter (renter)        ┘→ 2. Confirm & Head Out (renter)
 4. En Route — Host (host)            ┐
 5. Arrival Confirmation (both)       ┘→ 3. Arrival Confirmation (both)
 6. Identity Verification (host)      →  4. Identity Verification (host)
 7. Exterior Inspection (renter*)     ┐
 8. Interior Inspection (renter*)     │
10. Fuel & Mileage (renter*)          ┘→ 5. Vehicle Inspection (renter*/host*)
 9. Damage Documentation (both)       →  6. Damage Documentation (both)
11. Key Transfer (host)               ┐
12. Key Receipt (renter)              ┘→ 7. Key Exchange (both)
13. Digital Signature (both)          ┐
14. Completion (both)                 ┘→ 8. Sign & Complete (both)

* PICKUP: renter takes inspection photos
* RETURN: host takes inspection photos
```

---

## Key Business Rules

| Rule | Detail |
|------|--------|
| Pickup inspection | **Renter** takes all vehicle photos |
| Return inspection | **Host** takes all vehicle photos |
| Identity verification | Always **host** verifies **renter** (both pickup & return) |
| Dashboard photo | Replaces manual fuel slider + mileage number input — photo must clearly show odometer, fuel gauge, and any warning lights |
| Minimum photos | 5 required per inspection (front, rear, left, right, dashboard) |
| Host handover access | 30 days from rental end date, via Booking Details |
| Admin handover access | Permanent, via Booking Management tab (disputes & insurance claims) |

---

## Ticket Breakdown

### MOB-501: Update step definitions and validation

| Field | Value |
|-------|-------|
| **Type** | Task |
| **Priority** | P1 |
| **Status** | Todo |
| **File** | `src/services/enhancedHandoverService.ts` |
| **Depends on** | — |
| **Blocks** | MOB-502 – MOB-507 |

**Description:**
Replace the 14-entry `HANDOVER_STEPS` array with the new 8-step definition. Update types and validation.

**Acceptance Criteria:**
- [ ] `HANDOVER_STEPS` contains exactly 8 entries with correct names, orders, owners
- [ ] `VehiclePhoto.type` union adds `'dashboard'`, removes `'interior_seats'`, `'fuel_gauge'`, `'odometer'`
- [ ] `validateStepCompletion` updated:
  - `vehicle_inspection`: requires `photos` array with min 5 items including a `dashboard` type
  - Removes `fuel_mileage_check` case (no longer exists)
  - Adds `confirm_and_head_out`, `key_exchange`, `sign_and_complete` cases
- [ ] `fuel_level` and `mileage` fields on `VehicleConditionReport` become optional (backward compat)

**New Step Array:**
```typescript
export const HANDOVER_STEPS = [
  { name: "location_selection",    order: 1, owner: "host",   title: "Select Location",        description: "Host selects handover location" },
  { name: "confirm_and_head_out",  order: 2, owner: "renter", title: "Confirm & Head Out",      description: "Renter confirms location and marks en route" },
  { name: "arrival_confirmation",  order: 3, owner: "both",   title: "Arrival Confirmation",    description: "Both confirm arrival at location" },
  { name: "identity_verification", order: 4, owner: "host",   title: "Identity Verification",   description: "Host verifies renter's identity" },
  { name: "vehicle_inspection",    order: 5, owner: "dynamic",title: "Vehicle Inspection",       description: "Pickup: renter inspects; Return: host inspects" },
  { name: "damage_documentation",  order: 6, owner: "both",   title: "Damage Documentation",    description: "Both acknowledge damage state" },
  { name: "key_exchange",          order: 7, owner: "both",   title: "Key Exchange",            description: "Both confirm key handover" },
  { name: "sign_and_complete",     order: 8, owner: "both",   title: "Sign & Complete",         description: "Both sign and confirm handover complete" },
];
```

---

### MOB-502: Create ConfirmAndEnRouteStep component

| Field | Value |
|-------|-------|
| **Type** | Task |
| **Priority** | P1 |
| **Status** | Todo |
| **File** | `src/components/handover/interactive/steps/ConfirmAndEnRouteStep.tsx` |
| **Depends on** | MOB-501 |

**Description:**
New component merging location confirmation + en route into a single screen. Shows the selected location on a map card with the address, and a single CTA button: "Confirm & I'm On My Way".

**Acceptance Criteria:**
- [ ] Displays handover location (address, optional mini-map)
- [ ] Single button completes the step
- [ ] Calls `completeHandoverStep` with `step_name: 'confirm_and_head_out'`
- [ ] Shows loading state during submission

---

### MOB-503: Create VehicleInspectionConsolidatedStep component

| Field | Value |
|-------|-------|
| **Type** | Story |
| **Priority** | P1 |
| **Status** | Todo |
| **File** | `src/components/handover/interactive/steps/VehicleInspectionConsolidatedStep.tsx` |
| **Depends on** | MOB-501 |

**Description:**
Single consolidated inspection step replacing exterior inspection, interior inspection, and fuel/mileage check. Role-aware: determines who takes photos based on handover type.

**Props:**
```typescript
interface VehicleInspectionConsolidatedStepProps {
  handoverSessionId: string;
  handoverType: 'pickup' | 'return';
  userRole: 'host' | 'renter';
  bookingId: string;
  carId: string;
  onComplete: () => void;
}
```

**Required Photo Slots:**
| Slot | Label | Instructions |
|------|-------|-------------|
| `exterior_front` | Front | "Photograph the front of the vehicle including bumper and headlights" |
| `exterior_back` | Rear | "Photograph the rear including bumper and tail lights" |
| `exterior_left` | Left Side | "Photograph the full left side of the vehicle" |
| `exterior_right` | Right Side | "Photograph the full right side of the vehicle" |
| `dashboard` | Dashboard | **"Take a clear photo of the dashboard showing: odometer reading, fuel gauge level, and any warning lights or error indicators"** |

**Acceptance Criteria:**
- [ ] Pickup: only renter can take photos; Return: only host can take photos
- [ ] Non-inspector sees read-only view with status
- [ ] 5 photo slots with upload progress indicators
- [ ] Dashboard slot has prominent instruction callout (info card / alert)
- [ ] Minimum 5 photos required to proceed
- [ ] Photos uploaded via `uploadHandoverPhoto` with compression
- [ ] Creates `VehicleConditionReport` on completion
- [ ] Optional text field for additional condition notes

---

### MOB-504: Create KeyExchangeStep component

| Field | Value |
|-------|-------|
| **Type** | Task |
| **Priority** | P1 |
| **Status** | Todo |
| **File** | `src/components/handover/interactive/steps/KeyExchangeStep.tsx` |
| **Depends on** | MOB-501 |

**Description:**
Dual-party confirmation step. Host confirms "Keys handed over" and renter confirms "Keys received". Both must confirm to complete.

**Acceptance Criteria:**
- [ ] Shows both-party confirmation UI (who has / hasn't confirmed)
- [ ] Each party sees their own confirm button
- [ ] Step completes only when both have confirmed
- [ ] Real-time status update (Supabase subscription or polling)

---

### MOB-505: Create SignAndCompleteStep component

| Field | Value |
|-------|-------|
| **Type** | Task |
| **Priority** | P1 |
| **Status** | Todo |
| **File** | `src/components/handover/interactive/steps/SignAndCompleteStep.tsx` |
| **Depends on** | MOB-501 |

**Description:**
Merges digital signature + completion into one screen. Signature canvas at top, "Sign & Complete Handover" button at bottom. Both parties must sign.

**Acceptance Criteria:**
- [ ] Signature canvas (reuse existing canvas logic from `InteractiveSignatureStep`)
- [ ] Both parties must sign to complete
- [ ] On completion triggers booking status transition:
  - Pickup → booking status `in_progress`
  - Return → booking status `completed`
- [ ] Stores signature data in `VehicleConditionReport.digital_signature_data`
- [ ] Shows completion success state with confetti/checkmark

---

### MOB-506: Update InteractiveHandoverSheet step routing

| Field | Value |
|-------|-------|
| **Type** | Task |
| **Priority** | P1 |
| **Status** | Todo |
| **File** | `src/components/handover/interactive/InteractiveHandoverSheet.tsx` |
| **Depends on** | MOB-502, MOB-503, MOB-504, MOB-505 |

**Description:**
Update `renderStepContent()` switch statement to route to the 8 new step components. Pass `handoverType` from session data to `VehicleInspectionConsolidatedStep`. Remove all cases for deprecated step names.

**Acceptance Criteria:**
- [ ] Switch cases match all 8 new step names
- [ ] `handoverType` (pickup/return) passed to vehicle inspection step
- [ ] No references to removed step names (`en_route_confirmation`, `host_en_route`, `vehicle_inspection_exterior`, `vehicle_inspection_interior`, `fuel_mileage_check`, `key_transfer`, `key_receipt`, `digital_signature`, `completion`)
- [ ] Step progress indicator shows 8 steps

---

### MOB-507: Update legacy handover sheets

| Field | Value |
|-------|-------|
| **Type** | Task |
| **Priority** | P2 |
| **Status** | Todo |
| **Files** | `src/components/handover/EnhancedHandoverSheet.tsx`, `src/components/handover/ResizableHandoverTray.tsx` |
| **Depends on** | MOB-506 |

**Description:**
Update `getStepComponent()` in both legacy sheet components to match the new 8-step names. Add a fallback guard: if an unrecognized step name is encountered (from a pre-migration session), log a warning and auto-advance.

**Acceptance Criteria:**
- [ ] Both files route to correct components for 8 new step names
- [ ] Unrecognized legacy step names don't crash — graceful fallback
- [ ] Console warning logged for legacy step names encountered

---

### MOB-508: Create HandoverDataViewer component

| Field | Value |
|-------|-------|
| **Type** | Story |
| **Priority** | P1 |
| **Status** | Todo |
| **File** | `src/components/handover/HandoverDataViewer.tsx` |
| **Depends on** | MOB-501 |

**Description:**
Reusable component that fetches and displays all handover session data for a given booking. Used by both host booking details (30-day window) and admin booking management (permanent).

**Props:**
```typescript
interface HandoverDataViewerProps {
  bookingId: string;
  accessLevel: 'host' | 'admin';
}
```

**Sections:**
1. **Session Summary** — Handover type, status, timestamps, participants
2. **Vehicle Photos Grid** — All inspection photos with labels, timestamps, and photographer identity
3. **Dashboard Photo Highlight** — Enlarged dashboard photo with callout (fuel/odometer/warnings)
4. **Damage Reports** — Any damage documented with photos and descriptions
5. **Identity Verification** — Verification photo and status
6. **Digital Signatures** — Signature images from both parties
7. **Step Completion Timeline** — Chronological list of all step completions with timestamps and who completed each

**Acceptance Criteria:**
- [ ] Fetches data from `handover_sessions`, `handover_step_completion`, `vehicle_condition_reports`, `identity_verification_checks`
- [ ] Photos displayed in responsive grid with lightbox on click
- [ ] Timeline shows chronological step completions
- [ ] Handles both pickup and return sessions (shows both if available)
- [ ] Loading and empty states handled
- [ ] `accessLevel='admin'` shows all data; `accessLevel='host'` respects 30-day window (enforced at caller level)

---

### MOB-509: Host handover data access in BookingDetails

| Field | Value |
|-------|-------|
| **Type** | Task |
| **Priority** | P1 |
| **Status** | Todo |
| **File** | `src/components/BookingDetails.tsx` |
| **Depends on** | MOB-508 |

**Description:**
Add a "View Handover Records" button to the booking details page for host users. Only visible on bookings with status `in_progress` or `completed`, within 30 days of the rental end date. Opens `HandoverDataViewer` in a dialog.

**Acceptance Criteria:**
- [ ] Button visible only to host users
- [ ] Button visible only for `in_progress` and `completed` bookings
- [ ] 30-day access window calculated from `actual_end_date` or `end_date`
- [ ] After 30 days: button shows "Handover records expired" (disabled, with tooltip explaining the time limit)
- [ ] Opens `HandoverDataViewer` in a `Dialog` with `accessLevel='host'`
- [ ] Button uses a camera/document icon for visual clarity

---

### MOB-510: Admin handover data access in Booking Management

| Field | Value |
|-------|-------|
| **Type** | Task |
| **Priority** | P1 |
| **Status** | Todo |
| **Files** | `src/components/admin/BookingManagementTable.tsx` |
| **Depends on** | MOB-508 |

**Description:**
Add a "View Handover" action button (eye icon) to each booking row in the admin booking management table. Opens `HandoverDataViewer` in a dialog with `accessLevel='admin'` — no time restriction.

**Acceptance Criteria:**
- [ ] Eye icon action button on each booking row
- [ ] Opens `HandoverDataViewer` dialog with `accessLevel='admin'`
- [ ] No time restriction — admins can view all historical handover data
- [ ] Button disabled with tooltip "No handover data" if no handover session exists for the booking
- [ ] Accessible from existing actions dropdown or as a standalone icon button

---

### MOB-511: Arrival step absorbs host en-route

| Field | Value |
|-------|-------|
| **Type** | Task |
| **Priority** | P2 |
| **Status** | Todo |
| **File** | `src/components/handover/interactive/steps/ArrivalConfirmationStep.tsx` |
| **Depends on** | MOB-501 |

**Description:**
Update the existing arrival confirmation step copy to reflect that it now implicitly covers the host's "en route" action. The host confirming arrival means they traveled to the location. No structural code change needed — this is a copy/UX update.

**Acceptance Criteria:**
- [ ] Updated step description and UI copy
- [ ] Both-party confirmation pattern intact
- [ ] No reference to a separate "host en route" step in UI text

---

## Dependency Graph

```text
MOB-501 ─┬─→ MOB-502 ──┐
         ├─→ MOB-503 ──┤
         ├─→ MOB-504 ──┤
         ├─→ MOB-505 ──┼─→ MOB-506 ──→ MOB-507
         ├─→ MOB-508 ──┬─→ MOB-509
         │             └─→ MOB-510
         └─→ MOB-511
```

---

## Files Created (5)

| File | Ticket |
|------|--------|
| `src/components/handover/interactive/steps/ConfirmAndEnRouteStep.tsx` | MOB-502 |
| `src/components/handover/interactive/steps/VehicleInspectionConsolidatedStep.tsx` | MOB-503 |
| `src/components/handover/interactive/steps/KeyExchangeStep.tsx` | MOB-504 |
| `src/components/handover/interactive/steps/SignAndCompleteStep.tsx` | MOB-505 |
| `src/components/handover/HandoverDataViewer.tsx` | MOB-508 |

## Files Modified (6)

| File | Ticket | Change |
|------|--------|--------|
| `src/services/enhancedHandoverService.ts` | MOB-501 | New 8-step array, updated types & validation |
| `src/components/handover/interactive/InteractiveHandoverSheet.tsx` | MOB-506 | New switch cases for 8 steps |
| `src/components/handover/EnhancedHandoverSheet.tsx` | MOB-507 | Updated step routing + legacy guard |
| `src/components/handover/ResizableHandoverTray.tsx` | MOB-507 | Updated step routing + legacy guard |
| `src/components/BookingDetails.tsx` | MOB-509 | Host handover data button (30-day window) |
| `src/components/admin/BookingManagementTable.tsx` | MOB-510 | Admin handover data action button |

---

## Migration & Backward Compatibility

### Active Sessions with Legacy Step Names
Existing active handover sessions in the database reference old 14-step names. Strategy:

1. **No DB migration required** — step names are stored in `handover_step_completion` rows per session
2. **Legacy guard in step routing:** If `renderStepContent()` encounters an unrecognized step name, log a warning and render a generic "Step completed" card with an auto-advance button
3. **New sessions** created after deployment will use the 8-step flow exclusively
4. **`advance_handover_step` RPC:** The existing RPC function operates on step order numbers, not names — it will continue to work. New sessions will have orders 1–8 instead of 1–14

### Data Continuity
- `VehicleConditionReport.fuel_level` and `.mileage` fields remain in the schema as optional
- Existing reports with fuel/mileage data are unaffected
- New reports will not populate these fields (dashboard photo replaces them)

---

## Acceptance Criteria (Epic Level)

- [ ] Handover flow completes in exactly 8 steps for both pickup and return
- [ ] Pickup: renter takes all vehicle inspection photos
- [ ] Return: host takes all vehicle inspection photos
- [ ] Identity verification: host verifies renter (both pickup and return)
- [ ] Dashboard photo required with clear on-screen instructions (fuel gauge, odometer, warning lights)
- [ ] No manual fuel slider or mileage number input anywhere in the flow
- [ ] Host can view handover photos/data for active and completed rentals (30-day window from end date)
- [ ] Host access button disabled with "expired" label after 30 days
- [ ] Admin can view all handover data permanently via Booking Management tab
- [ ] Admin can access handover data for any booking (for disputes and insurance claims)
- [ ] Existing active sessions with old step names degrade gracefully (no crash)
- [ ] Step progress indicator correctly shows 8 steps
- [ ] All new components follow existing design system (Tailwind semantic tokens, shadcn/ui)

---

## Testing Plan

| Test | Type | Scope |
|------|------|-------|
| 8-step pickup flow end-to-end | Manual | Full flow as renter + host |
| 8-step return flow end-to-end | Manual | Full flow with host taking photos |
| Dashboard photo validation | Manual | Attempt to skip dashboard photo |
| Legacy session fallback | Manual | Load a session with old step names |
| Host 30-day access window | Manual | Verify button state at day 29, 30, 31 |
| Admin permanent access | Manual | View handover data for old bookings |
| Photo upload + compression | Manual | Upload >500KB images, verify compression |
| Responsive layout | Manual | Test on mobile (375px) and desktop (1280px) |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Active sessions mid-handover break | High | Legacy guard auto-advances unrecognized steps |
| Dashboard photo quality too low to read odometer | Medium | Instruction callout + minimum resolution hint |
| Host forgets to take return photos | Medium | Step blocks progression until minimum photos uploaded |
| 30-day window edge case (timezone) | Low | Use UTC comparison consistently |

---

## Related Documents

- [MOB-400: Map Module Hotfix](.lovable/plan.md) — Previous hotfix epic
- [Enhanced Handover Service](src/services/enhancedHandoverService.ts) — Current 14-step definitions
- [Knowledge Base](custom-knowledge) — MobiRides platform overview
