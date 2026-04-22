# Booking Screen UX Redesign Implementation Plan (Build Your Plan)

**Date**: 2026-04-17
**Epic**: Streamline Booking Configuration UX (Build Your Plan)

## 1. Goal Description
Refactor the Booking Dialog layout to substantially improve User Experience. The current implementation uses a multi-step wizard (`wizardStep` 1 to 4) that separates date range selection and location picking. The new UX aligns with a "Build Your Plan" mental model. It introduces a unified, single-screen configuration form that captures the start date, duration (with unit switching: Days/Weeks/Months), trip type, and pickup location within a single view.

## 2. User Stories & Acceptance Criteria

### Story 1: Unified Booking Form
**As a** prospective renter,
**I want** to configure my entire booking (dates, duration, and location) on a single unified screen,
**So that** I don't have to click through multiple wizard steps before reviewing my protection and payment options.

**Acceptance Criteria:**
- The initial wizard steps (Dates & Location) are merged into a single "Plan Your Booking" card.
- User can proceed to the next step (Protection/Insurance) only when Start Date, Duration, and Location are fully populated.

### Story 2: Duration Slider with Unit Toggle
**As a** prospective renter,
**I want** to select my rental duration dynamically using a slider (switchable between Days, Weeks, or Months),
**So that** I can easily plan long-term rentals without picking discrete dates on a calendar.

**Acceptance Criteria:**
- Instead of a start/end calendar range, the user selects a "Start Date" (via a simplified calendar popover) and a "Duration" via a Slider.
- The UI includes a toggle for "Days", "Weeks", and "Months".
  - Defaults to "Days".
  - Slider dynamically updates its parameters based on selection (e.g., Days: 1-30, Weeks: 1-8, Months: 1-6).
- The `endDate` is automatically derived behind the scenes using `date-fns` (e.g., `addDays(startDate, duration)`, etc.) so that pricing calculations and availability APIs continue to function perfectly.

### Story 3: Integrated Destination & Trip Type Selection
**As a** prospective renter,
**I want** to select my Trip Type (Local, Out-of-town) and Pickup Location directly on the primary plan screen,
**So that** my trip context is complete before proceeding.

**Acceptance Criteria:**
- "Trip Type" (e.g., local, out-of-town) is integrated into the card as a standardized Dropdown `<Select>` component matching the existing business logic.
- "Collection Location" is implemented as a Dropdown `<Select>` with three specific, hardcoded options representing existing behaviors:
  1. "Car Location" (Defaults to the vehicle's set coordinates)
  2. "My Location"
  3. "Set a Location" (Triggers the dynamic Google Map location picker modal when clicked)

---

## 3. Technical Implementation Overview

### Component: `BookingDialog.tsx`
- **Flatten State**: Consolidate `wizardStep === 1` and `wizardStep === 2` into the modified 1st step. Shift Insurance to Step 2 and Review to Step 3.
- **New State Variables**:
  - `durationUnit` (`'days' | 'weeks' | 'months'`)
  - `durationValue` (`number`)
  - `locationSelectionType` (`'car' | 'me' | 'custom'`)
- **UI Elements to Import/Implement**:
  - `<Slider />` from `src/components/ui/slider.tsx`
  - `<Select />` from `src/components/ui/select.tsx`
  - Unit toggle group (using horizontal pills/buttons).
- **Hooks & Computations**:
  - Replace explicit `endDate` setter with: `const computedEndDate = useMemo(() => adaptDuration(startDate, durationValue, durationUnit), [startDate, durationValue, durationUnit])`

---

## 4. Impact Assessment

### Risks & Mitigations
- **Risk: Dynamic Pricing & Availability Spikes** 
  - *Context*: Rapidly sliding the duration slider will rapidly alter the computed `endDate`. This could trigger immense bursts of requests to `useDynamicPricing` or `checkCarAvailability`.
  - *Mitigation*: We must implement a debounce (e.g., `useDebounce(computedEndDate, 500)`) on the derived end date before it is pushed to the availability checker or pricing hooks.

- **Risk: Downstream Dependency on `endDate`**
  - *Context*: The database insert relies heavily on explicit `start_date` and `end_date` structures.
  - *Mitigation*: No backend schema changes are necessary. The API call during the final checkout stage will simply pass the internally computed `endDate`. Tests must strictly verify that time zone clipping does not inadvertently subtract a day during the `addMonths` or `addDays` math.

- **Risk: Map Modal Sizing/Overlay**
  - *Context*: Triggering the map modal from a dropdown value change ("Set a Location") could cause focus/z-index issues on mobile viewports.
  - *Mitigation*: Ensure the `<BookingLocationPicker>` uses a properly layered Portal or Sheet component, testing specifically on smaller breakpoints.

## 5. Execution Strategy
1. **Branch Management**: Create a new feature branch `feat/booking-ux-build-your-plan`.
2. **Refactor UI Layer**: Extract the massive step 1 and step 2 switch blocks inside `BookingDialog.tsx` into a singular new sub-component `PlanBookingStep.tsx` for cleaner maintainability before adding slider logic.
3. **Logic Wiring**: Implement `date-fns` integration to dynamically compute end dates.
4. **Debouncing**: Ensure network hooks are wrapped efficiently.
5. **Testing**: Run end-to-end user validations locally simulating short (2 day) and long (3 month) rentals.
