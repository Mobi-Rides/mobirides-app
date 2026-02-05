
# Plan: Align GTM Document Sections with Verified Figures

## Overview

After reviewing all 4,277 lines of the GTM document, I've identified **significant inconsistencies** between sections. While Sections 0-8 and Section 12 have been updated with verified figures, several later sections still contain **USD figures** and **projections that don't match** the confirmed P1.368M Year 1 target.

---

## Inconsistencies Found

### Section 10: Sales & Customer Acquisition (Lines 1817-2173)

**Problem:** Uses USD figures that conflict with confirmed BWP metrics

| Issue | Current (Incorrect) | Should Be (BWP) |
|-------|---------------------|-----------------|
| Line 1998: Renter CAC | $35 | P250 |
| Line 1999: Host CAC | $150 | P150 |
| Line 2000: Blended CAC | $48 | N/A - recalculate |
| Lines 2026-2039: Renter LTV | $684 | P1,012.50 |
| Lines 2046-2059: Host LTV | $3,648 | P9,112.50 |
| Lines 2067-2069: LTV:CAC ratios | 19.5:1 / 24.3:1 | 4.05:1 / 60.75:1 |
| Lines 2089-2144: Sales Forecast | All in USD | Convert to BWP |
| Lines 2146-2150: Year 2 projections | $1.56M | ~P2.7M (aligned) |

### Section 11: GTM Roadmap (Lines 2176-2689)

**Problem:** User growth targets don't match confirmed targets

| Issue | Current | Confirmed |
|-------|---------|-----------|
| Line 2209: Marketing budget | $40K | P6,150 (Month 3) |
| Lines 2214-2220: Month 3 targets | 1,000 completed bookings | Needs review |
| Lines 2234: Marketing budget | $50K | ~P7,600 (Month 4-5) |
| Lines 2253-2259: Month 6 success metrics | $100K MRR | ~P101K revenue |
| Lines 2296-2298: Month 9 success metrics | $250K MRR | ~P138K/month |
| Lines 2324-2335: Month 12 success metrics | $500K MRR | P157.5K/month |

### Section 13: Financial Plan (Lines 2787-3152)

**Problem:** USD budgets and projections, wrong Year 1 total

| Issue | Current | Should Be |
|-------|---------|-----------|
| Line 2791: Year 1 Budget | P27.14M | Needs recalculation |
| Lines 2795-2806: Personnel costs | BWP values too high | Review against actuals |
| Lines 2836-2841: Monthly burn rate | P1.2M-2.7M/month | Seems too high for startup |
| Lines 2853-2891: Funding requirements | P27-40.5M seed | May need adjustment |
| Lines 2900-2930: Revenue projections | P5.4M Year 1 | P1.368M (confirmed) |
| Lines 2968-2991: Year 1 & 2 P&L | USD figures | Convert to BWP |

### Section 14: Performance Metrics (Lines 3541-4056)

**Problem:** KPI targets don't match confirmed projections

| Issue | Current | Confirmed |
|-------|---------|-----------|
| Lines 3547-3553: User targets | 3,500 hosts, 30,000 renters | 200 vehicles, 500 users |
| Lines 3584-3588: Booking cumulative | 50,000 Month 12 | Needs recalculation |
| Lines 3606-3614: GMV targets | $2.125M Year 1 | Recalculate from P1.368M |
| Lines 3619-3627: MRR targets | $54K Month 12 | P157.5K/month (confirmed) |
| Lines 3642-3672: CAC/LTV | USD values | BWP confirmed values |

### Document Footer (Lines 4265-4277)

**Problem:** Version number inconsistent

| Issue | Current | Should Be |
|-------|---------|-----------|
| Line 4265: Document Version | 1.1 | 2.1 (to match header) |

---

## Key Conversion Notes

When converting, the confirmed metrics to use are:

| Metric | Confirmed Value | Source |
|--------|-----------------|--------|
| Year 1 Revenue Target | **P1.368M** | Stakeholder confirmed |
| December 2025 Baseline | **P54,000** | Management accounts |
| Host CAC | **P150** | User-provided actual |
| Renter CAC | **P250** | User-provided actual |
| Host LTV | **P9,112.50** | Recalculated |
| Renter LTV | **P1,012.50** | Recalculated |
| Host LTV:CAC | **60.75:1** | Recalculated |
| Renter LTV:CAC | **4.05:1** | Recalculated |
| Year 1 Fleet Target | **200 vehicles** | Section 1 |
| Year 1 User Target | **500 registered users** | Section 1 |
| Month 12 Revenue | **P157,500** | Projection table |
| Marketing Year 1 | **~P110,000** | 8.3% of revenue |

---

## Sections Already Aligned (No Changes Needed)

- **Section 0:** Executive Summary ✅
- **Section 1:** Business Context ✅
- **Section 7:** Revenue & Pricing (Unit Economics portion) ✅
- **Section 8:** Marketing Budget Allocation ✅
- **Section 12:** FY2025 Historical Performance ✅

---

## Implementation Plan

### Phase 1: Section 10 - Sales & Customer Acquisition
1. Convert all CAC figures from USD to confirmed BWP values
2. Update LTV calculations to match confirmed figures (P9,112.50 / P1,012.50)
3. Update LTV:CAC ratios (60.75:1 / 4.05:1)
4. Recalculate Sales Forecast to align with P1.368M Year 1 target
5. Update Year 2 projections to ~P2.7M

### Phase 2: Section 11 - GTM Roadmap
1. Update all marketing budget references to match proportional scaling
2. Update user growth milestones (200 hosts → 200 vehicles, 500 users)
3. Update MRR targets to match monthly revenue projections
4. Align quarterly revenue targets with confirmed values

### Phase 3: Section 13 - Financial Plan
1. Recalculate Year 1 budget based on actual FY2025 expense structure
2. Update revenue projections to P1.368M
3. Convert all USD figures to BWP
4. Align P&L with realistic startup costs (based on P102K FY2025 expenses)
5. Update funding requirements to reflect Botswana context (P700K pre-seed mentioned in Section 0)

### Phase 4: Section 14 - Performance Metrics
1. Update all KPI targets to match confirmed projections
2. Convert CAC/LTV figures to BWP confirmed values
3. Align booking and user targets with Year 1 goals
4. Update success metrics and milestones

### Phase 5: Document Cleanup
1. Update footer version to 2.1
2. Add changelog entry for this update
3. Ensure consistent terminology throughout

---

## Technical Summary

| Section | Lines | Changes Required |
|---------|-------|------------------|
| Section 10 | 1817-2173 | ~50 line updates (USD → BWP, LTV/CAC) |
| Section 11 | 2176-2689 | ~30 line updates (milestones, budgets) |
| Section 13 | 2787-3152 | ~80 line updates (budget, projections) |
| Section 14 | 3541-4056 | ~40 line updates (KPIs, metrics) |
| Footer | 4265-4277 | 3 line updates (version, changelog) |
| **Total** | | ~200 line updates |

---

## Story Points

| Task | SP |
|------|-----|
| Section 10 updates | 2 |
| Section 11 updates | 2 |
| Section 13 updates | 3 |
| Section 14 updates | 2 |
| Footer and changelog | 0.5 |
| Review and verification | 1.5 |
| **Total** | **11 SP** |

---

## Verification Criteria

After updates, all sections should reflect:
1. Year 1 Revenue: P1.368M (not $368K or P5.4M)
2. December Baseline: P54,000
3. Host CAC: P150 (not $150)
4. Renter CAC: P250 (not $35)
5. Host LTV:CAC: 60.75:1 (not 24.3:1)
6. Renter LTV:CAC: 4.05:1 (not 19.5:1)
7. Year 1 Fleet: 200 vehicles (not 3,500 hosts)
8. Year 1 Users: 500 registered (not 30,000 renters)
9. Marketing Budget: ~P110K Year 1 (not $720K or P9.72M)
10. All figures in BWP unless explicitly marked otherwise

---

## Priority Recommendation

Given the scope (11 SP), I recommend breaking this into 2-3 sessions:

**Session 1 (High Priority):** Sections 10 + 11 (Sales & GTM Roadmap)
- Most customer-facing projections
- Critical for investor discussions

**Session 2 (Medium Priority):** Section 13 (Financial Plan)
- Complex calculations
- Needs careful review

**Session 3 (Lower Priority):** Section 14 + Footer (Metrics & Cleanup)
- Internal operational metrics
- Document housekeeping
