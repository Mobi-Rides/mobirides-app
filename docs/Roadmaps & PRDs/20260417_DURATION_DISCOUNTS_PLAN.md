# Duration Discounts Implementation Plan

**Date**: 2026-04-17
**Epic**: Pricing & Promotional Capabilities

## 1. Goal Description
The objective is to re-integrate Duration Discounts (e.g., Weekly and Monthly price breaks) into the existing dynamic pricing engine. Following global best practices for the vehicle rental industry, long-term rentals (7+ days, 28+ days) expect progressive base-price discounting to incentivize longer durations. This will be implemented seamlessly into the current `DynamicPricingService` pipeline which evaluates rule multipliers natively, allowing these discounts to be configurable via the Admin UI.

## 2. User Stories & Acceptance Criteria

### Story 1: Applying Duration Multipliers
**As a** prospective renter booking a long-term rental,
**I want** to obtain an automatic discount for duration milestones (e.g., Weekly or Monthly limits),
**So that** I am incentivized financially to commit to long-term usage.

**Acceptance Criteria:**
- If the calculated booking duration meets or exceeds 7 days (and is under 28 days), a configurable "Weekly Discount" multiplier is applied (e.g., 0.9 for 10% off).
- If the booking duration meets or exceeds 28 days, a stronger "Monthly Discount" multiplier is applied (e.g., 0.8 for 20% off).
- Only the highest eligible duration discount should apply rather than compounding (i.e., a 30-day rental should only get the Monthly discount, not both Weekly + Monthly).

### Story 2: Configurable Admin Rule Base
**As an** administrator,
**I want** to manage duration discount thresholds and multipliers via the Dynamic Pricing settings UI,
**So that** I have total flexibility as market and fleet economics shift.

**Acceptance Criteria:**
- The `DynamicPricingRulesSection` (Admin Settings) contains a new dropdown label for 'Duration'.
- When the 'Duration' rule type is selected, the Administrator can set absolute conditions for `min_duration_days` and `max_duration_days` alongside the price `multiplier`.

---

## 3. Technical Implementation Overview

### Component 1: `src/types/pricing.ts`
- **Updates**:
  - Add `DURATION = "duration"` to the `PricingRuleType` enumerator.
  - Extend `PricingConditions` interface to include `min_duration_days?: number` and `max_duration_days?: number`.

### Component 2: `src/services/dynamicPricingService.ts`
- **Evaluation Logic Updates**:
  - Extend `evaluateRule` switch block with `case PricingRuleType.DURATION: return this.evaluateDurationRule(...)`.
  - Implement `evaluateDurationRule(rule, pickupDate, returnDate)`: Extracts total rental days via `differenceInDays(returnDate, pickupDate)`. Evaluates it strictly against `rule.conditions.min_duration_days` ensuring boundaries pass.
- **Default Hardcodes**:
  - Add two baseline default rules to `getDefaultPricingRules()`:
    1. 'Weekly Discount' (`min_duration_days: 7`, `max_duration_days: 27`, multiplier `0.9`).
    2. 'Monthly Discount' (`min_duration_days: 28`, multiplier `0.8`).
- **Rule Description**:
  - Extend `generateRuleDescription` string builder for `PricingRuleType.DURATION` to explicitly say "Duration discount (-X%)".

### Component 3: `src/components/admin/settings/DynamicPricingRulesSection.tsx` & `PricingRuleConditionFields.tsx`
- Add `[PricingRuleType.DURATION]: 'Duration'` to `RULE_TYPE_LABELS`.
- In `PricingRuleConditionFields.tsx`, yield two discrete number input fields for "Minimum Days" and "Maximum Days (Optional)" whenever the user selects the Duration type.

---

## 4. Impact Assessment

### Risks & Mitigations
- **Risk: Compounding Discounts Collisions** 
  - *Context*: If an "Early Bird" discount pairs with a "Monthly Discount" along with a "Loyalty" reward, multipliers can aggressively compress the final price to a loss-making margin.
  - *Mitigation*: The system already evaluates a sequence of dynamic pricing impacts. We will enforce priority assignments or create a "maximum discount floor limit" setting in future roadmap features if margins compress. For now, duration rules should be given a standard priority (e.g., 60).
- **Risk: Disconnected Slider / Pricing Hooks**
  - *Context*: The new UI "Plan" view sends the newly computed `endDate` rapidly format.
  - *Mitigation*: Our dynamic pricing hook passes `startDate` and `endDate` explicitly. No direct coupling with UI components limits breakage risk here. Ensure `endDate` resolves to identical timezone midnights to stop `differenceInDays` dropping a day conditionally.

### Backend Data Schemas
- The `dynamic_pricing_rules` Supabase table's `condition_type` enum (or string) and JSONB `condition_value` will natively absorb these new structures dynamically. Ensure no strict PostgreSQL triggers block the insertion of the "duration" keyword.

## 5. Execution Strategy
1. **Branch Definitions**: Open feature branch `feat/pricing-duration-rules`.
2. **Types & Models**: Update TypeScript interfaces in `pricing.ts`.
3. **Core Engine Updates**: Add `evaluateDurationRule` mathematical resolver in `DynamicPricingService`. Include default fallbacks logic.
4. **UI Connectors**: Surface "Duration" bounds logic accurately via Admin tooling (`PricingRuleConditionFields.tsx`).
5. **Testing phase**: Hard-code tests simulating identical booking dates but 7, 28, and 30-day endpoints parsing log trails locally.
