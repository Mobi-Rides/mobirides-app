

## MOB-312 & MOB-313: Contextual Help Tooltips

### MOB-312 — Build `ContextualHelp` component
Create `src/components/guides/ContextualHelp.tsx`:
- A `?` icon button that opens a Radix Popover
- Shows brief help text + a "Learn more" link routing to `/help/{role}/{section}`
- Props: `guideSection: string`, `role: 'renter' | 'host'`, `helpText: string`
- Mobile: `side="top"`, max-width constrained, small footprint next to form labels

### MOB-313 — Integrate into key flows
Add `<ContextualHelp>` next to form labels in:

1. **BookingDialog.tsx** — tooltips on:
   - Date selection ("Choose your rental dates")
   - Insurance/coverage selection
   - Destination type

2. **Car listing form (AddCar or equivalent)** — tooltips on:
   - Pricing fields
   - Vehicle type selector
   - Features checkboxes

3. **Verification pages** — tooltips on:
   - Document upload requirements
   - Selfie verification instructions

Each tooltip links to the matching guide section (e.g., `guideSection="booking"` → `/help/renter/booking`).

### Effort
~2-3 hours total. Component is straightforward (Popover already available), integration is mechanical.

