
# Plan: Update Commercialisation Plan Review with Confirmed Figures

## Confirmed Inputs from User

| Item | Confirmed Value | Notes |
|------|-----------------|-------|
| December 2025 Baseline | **P54,000** | From draft management accounts |
| Year 1 Revenue Target | **P1.368M** | From v1.9 document |
| Renter CAC | **P250** | User-provided actual |
| Host CAC | **P150** | User-provided actual |
| Month 1 Marketing | **P5,000** | Starting point, scales with revenue |

---

## Revised Unit Economics (With Corrected CAC)

### Customer Acquisition Costs (User Actuals)

| Metric | Previous AI Proposal | **Corrected (User)** |
|--------|---------------------|----------------------|
| Host CAC | P5,000 | **P150** |
| Renter CAC | P600 | **P250** |

### Recalculated LTV:CAC Ratios

**Host Economics:**
- Host CAC: P150
- Host LTV: P9,112.50 (18 months × 3 bookings/mo × P168.75)
- **Host LTV:CAC = 60.75:1** ✅ Excellent

**Renter Economics:**
- Renter CAC: P250
- Renter LTV: P1,012.50 (12 months × 6 bookings × P168.75)
- **Renter LTV:CAC = 4.05:1** ✅ Healthy (above 3:1 industry standard)

These ratios are exceptional and validate the unit economics model.

---

## Revised Marketing Budget (Scaling with Revenue)

### Calculation Basis

Starting from P5,000/month and scaling proportionally to revenue growth:

| Month | Revenue (P) | Marketing Budget (P) | % of Revenue |
|-------|-------------|---------------------|--------------|
| Month 1 | P60,000 | P5,000 | 8.3% |
| Month 2 | P66,600 | P5,550 | 8.3% |
| Month 3 | P73,926 | P6,150 | 8.3% |
| Month 4 | P82,038 | P6,800 | 8.3% |
| Month 5 | P91,062 | P7,600 | 8.3% |
| Month 6 | P101,079 | P8,400 | 8.3% |
| Month 7 | P112,197 | P9,350 | 8.3% |
| Month 8 | P124,539 | P10,400 | 8.3% |
| Month 9 | P138,238 | P11,500 | 8.3% |
| Month 10 | P153,444 | P12,800 | 8.3% |
| Month 11 | P157,500 | P13,100 | 8.3% |
| Month 12 | P157,500 | P13,100 | 8.3% |
| **Year 1 Total** | **~P1.368M** | **~P110,000** | ~8% |

*Note: Using 11% MoM growth to reach P157.5k by Q4, then stabilizing*

### Alternative: 10% of Revenue Scaling

If we use 10% of revenue (slightly more aggressive):

| Period | Revenue | Marketing | % |
|--------|---------|-----------|---|
| Q1 2026 | P200k | P20k | 10% |
| Q2 2026 | P285k | P28.5k | 10% |
| Q3 2026 | P360k | P36k | 10% |
| Q4 2026 | P473k | P47.3k | 10% |
| **Year 1** | **P1.368M** | **~P137k** | 10% |

---

## Updated Projections Summary

### Revenue Projections (Year 1)

| Quarter | Monthly Target | Quarterly Total |
|---------|----------------|-----------------|
| Q1 2026 | P60k → P74k | P200,526 |
| Q2 2026 | P82k → P101k | P284,679 |
| Q3 2026 | P112k → P138k | P374,974 |
| Q4 2026 | P153k → P157.5k | P507,944 |
| **Year 1 Total** | | **P1,368,123** |

### Unit Economics (Corrected)

| Metric | Value |
|--------|-------|
| Average Booking Value | P1,125 |
| Platform Commission (15%) | P168.75 |
| Host CAC | P150 |
| Renter CAC | P250 |
| Host LTV | P9,112.50 |
| Renter LTV | P1,012.50 |
| Host LTV:CAC | **60.75:1** |
| Renter LTV:CAC | **4.05:1** |

### Marketing Budget (8-10% of Revenue)

| Metric | Value |
|--------|-------|
| Month 1 Starting Budget | P5,000 |
| Year 1 Total (8.3%) | ~P110,000 |
| Year 1 Total (10%) | ~P137,000 |
| **Recommended** | **P120,000** (9% of P1.368M) |

---

## Technical Implementation

### File to Update
`docs/Product Status/2026-02-04_Commercialisation_Plan_Review.md`

### Sections to Modify

| Section | Current Lines | Changes |
|---------|---------------|---------|
| Decision 2: December Baseline | 181-188 | Mark resolved: P54,000 confirmed |
| Decision 3: LTV:CAC Ratios | 191-200 | Update with corrected ratios (60:1 / 4:1) |
| Decision 4: Marketing Budget | 204-214 | Replace with proportional scaling model |
| Phase 2: Unit Economics | 230-240 | Update CAC and LTV:CAC figures |
| Phase 3: Marketing Budget | 243-248 | Update with P5k start, proportional scaling |
| Next Steps | 254-258 | Mark items as resolved |

### New Content to Add

1. **Resolved Decisions Section** - documenting confirmed figures
2. **Marketing Scaling Table** - month-by-month budget aligned to revenue
3. **Updated LTV:CAC Analysis** - with corrected ratios and healthy metrics

---

## Story Points

| Task | SP |
|------|-----|
| Update Decision sections with confirmed figures | 1 |
| Recalculate and update Unit Economics section | 1 |
| Add marketing budget scaling table | 1 |
| Update Next Steps as resolved items | 0.5 |
| Version bump and changelog | 0.5 |
| **Total** | **4 SP** |

**Assignee:** Arnold

---

## Verification Criteria

After update:
1. December baseline shows P54,000 (confirmed)
2. Year 1 revenue target shows P1.368M (confirmed)
3. Host CAC shows P150 (corrected)
4. Renter CAC shows P250 (corrected)
5. Host LTV:CAC shows 60.75:1 (recalculated)
6. Renter LTV:CAC shows 4.05:1 (recalculated)
7. Marketing budget starts at P5k/month and scales proportionally
8. Year 1 marketing total is ~P110k-P137k (~8-10% of revenue)
