# Destination Selector for Dynamic Pricing -- Step 2 of Booking Wizard

## Context

Step 2 of the booking wizard currently shows only the pickup location with a "Change" button and a date summary. The approved plan calls for a **destination type selector** on this same step, tied to dynamic pricing multipliers. This scoping document details the UX/UI design and technical integration.

## Current State (Step 2)

```text
+------------------------------------+
|  Step 2: Pickup Location           |
|                                    |
|  [Pin icon] Pickup Location        |
|  Default: Gaborone, Botswana       |
|                                    |
|  [ Change Location ]  (full width) |
|                                    |
|  Feb 15 - Feb 18, 2026 . 4 days   |
+------------------------------------+
|       [ Back ]    [ Next ]         |
+------------------------------------+
```

No destination selector exists. The `useDynamicPricing` hook feeds location coordinates to `DynamicPricingService`, which currently only has rules for weekend, seasonal, early bird, demand, and loyalty -- no destination/distance rule.

## Proposed UX/UI (Mobile-First)

Step 2 becomes two sections stacked vertically -- pickup location (existing) followed by the new destination selector. One screen, one scroll, two clear sections.

```text
+------------------------------------+
| [1] [2*] [3] [4]  progress bar    |
+------------------------------------+
|  Pickup & Destination              |
|  Confirm pickup and trip type      |
+------------------------------------+
|                                    |
|  PICKUP LOCATION                   |
|  [Pin] Default: Gaborone          |
|  [ Change Location ]              |
|                                    |
|  --------------------------------  |
|                                    |
|  WHERE ARE YOU HEADING?            |
|                                    |
|  [  Local Trip                  ]  |
|  Within 90km of pickup             |
|  No distance surcharge             |
|                                    |
|  [  Out of Zone                 ]  |
|  Beyond 90km from pickup           |
|  +50% distance premium             |
|                                    |
|  [  Cross-Border                ]  |
|  Traveling to another country      |
|  +100% cross-border premium         |
|                                    |
|  Feb 15 - Feb 18 . 4 days         |
+------------------------------------+
|       [ Back ]    [ Next ]         |
+------------------------------------+
```

### Design Principles Applied

1. **One action per screen** -- The user makes one decision: trip type. Pickup location is pre-filled and only changes if they tap "Change."
2. **Radio-card pattern** -- Each option is a tappable card with a radio indicator, title, subtitle, and pricing impact. Selected card gets a primary border + subtle background. This is a standard mobile pattern (similar to Uber's ride type selector).
3. **Immediate price feedback** -- Each card shows the surcharge percentage. No hidden costs.
4. **Default selection** -- "Local Trip" is pre-selected (no surcharge), so the user can tap "Next" without interaction if they are staying local.
5. **No extra screens** -- Three options fit comfortably on one mobile screen without scrolling past the fold on 390x844 viewports (iPhone 14 / similar).

### Visual Specs

- **Section label**: "WHERE ARE YOU HEADING?" -- uppercase muted text, 10px, matches existing section header patterns
- **Cards**: `border rounded-lg p-4` with `space-y-3` between them
- **Selected state**: `border-primary bg-primary/5` with a filled radio circle
- **Unselected state**: `border-border` with an empty radio circle
- **Title**: `text-sm font-medium`
- **Subtitle**: `text-xs text-muted-foreground`
- **Badge**: Inline text showing surcharge (e.g., "+15%") in `text-orange-500` for premiums, `text-green-600` for "No surcharge"

## Technical Integration

### New State in BookingDialog

A single state variable:

```typescript
type DestinationType = 'local' | 'out_of_zone' | 'cross_border';
const [destinationType, setDestinationType] = useState<DestinationType>('local');
```

### New Pricing Rule in DynamicPricingService

Add a `DESTINATION` rule type to `PricingRuleType` enum and two new rules in `getDefaultPricingRules()`:


| Destination    | Multiplier | Priority |
| -------------- | ---------- | -------- |
| Local (< 90km) | 1.0        | N/A      |
| Out of Zone    | 1.50       | 105      |
| Cross-Border   | 2          | 105      |


The rule evaluation will check a new `destination_type` field on `PricingRequest` rather than calculating distance from coordinates.

### Data Flow

1. User selects destination type on Step 2
2. `destinationType` state updates
3. `useDynamicPricing` hook is extended to accept an optional `destinationType` parameter
4. `DynamicPricingService.calculatePrice` evaluates the destination rule alongside existing rules
5. `UnifiedPriceSummary` on Step 4 displays it as an applied rule line item (e.g., "Cross-border premium (+30%)")

### New Component

`**DestinationTypeSelector.tsx**` -- a self-contained component:

- Props: `selectedType: DestinationType`, `onSelect: (type: DestinationType) => void`
- Renders three radio-cards
- No external dependencies beyond shadcn primitives

## File Changes


| File                                                 | Change                                                                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/components/booking/DestinationTypeSelector.tsx` | New component -- three radio-cards                                                                              |
| `src/components/booking/BookingDialog.tsx`           | Add `destinationType` state, render selector in Step 2, pass to pricing hook                                    |
| `src/types/pricing.ts`                               | Add `DESTINATION` to `PricingRuleType` enum, add `destination_type` to `PricingRequest` and `PricingConditions` |
| `src/services/dynamicPricingService.ts`              | Add two destination rules, add `evaluateDestinationRule` method                                                 |
| `src/hooks/useDynamicPricing.ts`                     | Accept optional `destinationType` param, pass to service                                                        |


## Edge Cases

- **Default**: "Local Trip" pre-selected so the wizard "Next" button works immediately without forcing a tap
- **Changing pickup location**: Does NOT auto-detect destination type (we cannot know where they are driving). The user must explicitly select.
- **Price recalculation**: Changing destination type triggers a debounced recalc via `useDynamicPricing` (existing 250ms debounce)