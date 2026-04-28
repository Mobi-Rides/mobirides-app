# Sprint 13 Jira-Style Execution Plan
## MobiRides Application — April 27 – May 3, 2026

**Prepared by:** Modisa Maphanyane  
**Sprint:** Sprint 13  
**Date:** April 28, 2026  
**Status:** 📅 PLANNED  
**Week 1 May Status Report:** `WEEK_1_MAY_2026_STATUS_REPORT.md` (to be created May 3)

---

## 🏛️ Past Sprint Reviews

| Sprint | Date | Focus | Review Link |
|--------|------|-------|-------------|
| Sprint 10 | Apr 6-12 | Security & Standardization | [View Review](SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md#🏁-sprint-review) |
| Sprint 11 | Apr 13-20 | Email Restoration & Hardening | [View Review](SPRINT_11_APRIL_2026_JIRA_EXECUTION_PLAN.md#🏁-sprint-review) |
| Sprint 12 | Apr 18-28 | Stabilization & Integrity | [View Review](SPRINT_12_APRIL_2026_JIRA_EXECUTION_PLAN.md#🏁-sprint-12-retrospective) |

---

## 📊 Executive Summary

Sprint 13 is laser-focused on hitting our May exit criteria for commercial readiness. Following Sprint 12's massive infrastructural cleanup (Vite 8 migration, database migration fixes, and SuperAdmin logic resolution), the runway is clear for deep feature execution.

This sprint carries over critical paths from Sprint 12 (Payment Phase 0 and Booking UX Redesign) and introduces newly scoped, high-impact fixes for the Map Navigation system (`MAP_NAVIGATION_REMEDIATION_PLAN`) and booking routing (`ROUTE_CONSOLIDATION_PLAN`).

**Primary Targets for Sprint 13:**
1. Complete Payment Phase 0 mock bug fixes.
2. Finalize Security MOB-700 close-out.
3. Overhaul the Booking UX ("Build Your Plan") & replace Insurance Stubs.
4. Modernize Map Navigation (Hooks, Center-Pin, Bottom Sheets).
5. Consolidate duplicate booking routes.
6. Fix Admin Analytics export consistency (BUG-015/016).
7. Initiate Google Native Integration (Firebase Push Notifications).

---

## 👥 Team Assignments

| Owner | Module Focus | Primary Responsibilities |
|-------|-------------|--------------------------|
| **Arnold (Snr Engineer)** | Payments, Security, Admin Data | Payment P0, MOB-700 security, BUG-015/016 Analytics Export |
| **Tapologo (QA / Test Engineer)** | UX, Maps, Test Coverage | Booking UX, Route Consolidation, Test Coverage Gaps |
| **Modisa (CEO)** | Architecture, Pricing, Maps | Map & Navigation Remediation, Duration Discounts, Oversight |

---

## 🎯 Sprint Objectives

1. **Payment Phase 0**: Finish the 5 mock-flow misalignments to clear the way for real provider integration.
2. **Security Close-out**: Ship the last 4 tickets for MOB-700 compliance.
3. **Booking UX Redesign**: Flatten booking steps into a single configuration card.
4. **Duration Discounts**: Integrate weekly/monthly pricing limits natively into the pricing engine.
5. **Route Consolidation**: Eliminate duplicate `/bookings/:id` routes and orphan components.
6. **Map Navigation Modernization**: Move to a center-pin selector, modularize the Mapbox component, and adopt bottom sheets.
7. **Admin Analytics Export**: Fix BUG-015/016 regarding inconsistent export data types.
8. **Insurance Production Readiness**: Replace UI stubs (G5/G6) and deploy email templates (G8).
9. **Native Mobile Integration**: Resolve MOB-13 by adding Firebase Push Notifications.
10. **SuperAdmin Core Logic**: Implement Session Anomaly Detection, OCR, Health Monitoring, and Signed Audit Logs.

---

## 📋 Sprint Backlog

### Category 1: Payment Phase 0 (P0) — Carried Over
**Linear:** MOB-22 (BUG-012)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-001** | Arnold | P0 | 3 | ✅ DONE | Fix double commission bug in `BookingRequestDetails.tsx`. |
| **S13-002** | Arnold | P0 | 5 | ✅ DONE | Wire payment webhook flow path. |
| **S13-003** | Arnold | P0 | 3 | ✅ DONE | Create `payment_transaction` records natively. |
| **S13-004** | Arnold | P0 | 3 | ✅ DONE | Stub real provider interface (remove setTimeout mock payout). |
| **S13-005** | Arnold | P0 | 2 | ✅ DONE | Add refund flow placeholder service interface. |

---

### Category 2: Security Remediation (P0) — Carried Over
**H1 Requirement:** MOB-700 at 100% by May

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-006** | Arnold | P1 | 2 | 🔴 To Do | MOB-708: Remove author email exposure from public APIs. |

---

### Category 3: Booking UX Redesign (P1) — Carried Over
**Source:** [Booking Screen UX Redesign Plan](../Roadmaps%20&%20PRDs/20260417_BOOKING_SCREEN_UX_PLAN.md)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-010** | Tapologo | P1 | 5 | 🔴 To Do | Extract existing wizard stages 1 & 2 into `PlanBookingStep.tsx`. |
| **S13-011** | Tapologo | P1 | 5 | 🔴 To Do | Implement Duration Slider with unit toggle. |
| **S13-012** | Tapologo | P2 | 3 | 🔴 To Do | Migrate Trip Type & Collection Location to `<Select>` dropdowns. |
| **S13-013** | Tapologo | P1 | 3 | 🔴 To Do | Implement 500ms debounce on derived `endDate`. |

---

### Category 4: Duration Discounts Integration (P1) — Carried Over
**Source:** [Duration Discounts Implementation Plan](../Roadmaps%20&%20PRDs/20260417_DURATION_DISCOUNTS_PLAN.md)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-014** | Modisa | P1 | 2 | 🔴 To Do | Update `pricing.ts` types with `PricingRuleType.DURATION`. |
| **S13-015** | Modisa | P1 | 5 | 🔴 To Do | Implement `evaluateDurationRule()` within DynamicPricingService. |
| **S13-016** | Modisa | P2 | 3 | 🔴 To Do | Update Admin UI to surface Duration Rule configuration. |

---

### Category 5: Map & Navigation Remediation (P1) — NEW
**Source:** [Map Navigation Remediation Plan](../plans/20260428_MAP_NAVIGATION_REMEDIATION_PLAN.md)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-017** | Modisa | P0 | 5 | 🔴 To Do | Modularize `CustomMapbox.tsx` & extract hooks (`useMapMarkers`, `useMapRouting`). |
| **S13-018** | Modisa | P1 | 3 | 🔴 To Do | Implement Center-Pin Selector to fix thumb-block selection issues. |
| **S13-019** | Modisa | P1 | 5 | 🔴 To Do | Migrate Side Trays to Mobile Bottom Sheets (`@gorhom/bottom-sheet`). |
| **S13-020** | Modisa | P2 | 5 | 🔴 To Do | Refactor `NavigationService` rerouting logic & stabilize audio feedback. |
| **S13-021** | Modisa | P2 | 3 | 🔴 To Do | Implement real-time Host Fleet View mapping. |

---

### Category 6: Route Consolidation (P1) — NEW
**Source:** [Route Consolidation Plan](../plans/20260428_ROUTE_CONSOLIDATION_PLAN.md)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-022** | Tapologo | P1 | 5 | 🔴 To Do | Consolidate duplicate booking routes: Delete `BookingDetails.tsx`, remove `/bookings/:id`, point to `/rental-details/:id`, fix "approved" status error. |

---

### Category 7: Admin Analytics Export Fixes (P2) — NEW
**Source:** BUG-015, BUG-016 

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-023** | Arnold | P2 | 3 | 🔴 To Do | Fix BUG-015: Admin analytics data export logic/consistency. |
| **S13-024** | Arnold | P2 | 2 | 🔴 To Do | Fix BUG-016: UI inconsistencies in analytics timeframe filtering. |

---

### Category 8: Test Coverage Extensions (P2) — Carried Over

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-025** | Tapologo | P1 | 5 | 🔴 To Do | Create unit tests for Vehicle Management. |
| **S13-026** | Tapologo | P1 | 3 | 🔴 To Do | Create unit tests for Reviews & Ratings. |
| **S13-027** | Tapologo | P1 | 2 | 🔴 To Do | Create unit tests for Promo Codes. |

---

### Category 9: Native Mobile Integration (P1) — Carried Over
**Source:** [Google Native Integration Plan](../plans/20260417_GOOGLE_NATIVE_INTEGRATION_PLAN.md)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-028** | Modisa | P1 | 5 | 🔴 To Do | MOB-13: Firebase/Google Services setup and `google-services.json` config. |

---

### Category 10: Insurance Production Readiness (P1) — Carried Over
**Source:** [Insurance Readiness Plan](../plans/20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-029** | Tapologo | P1 | 3 | 🔴 To Do | G5: Replace `InsuranceComparison.tsx` stub with full modal. |
| **S13-030** | Tapologo | P1 | 3 | 🔴 To Do | G6: Replace `PolicyDetailsCard.tsx` stub with full details card. |
| **S13-031** | Modisa | P2 | 2 | 🔴 To Do | G8: Deploy 4 Resend templates for Insurance claims. |

---

### Category 11: SuperAdmin Core Logic Remediation (P1/P2) — NEW
**Source:** [SuperAdmin Remediation Plan](../plans/20260423_SUPERADMIN_CORE_LOGIC_REMEDIATION_PLAN.md)

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-032** | Arnold | P0 | 5 | 🔴 To Do | SAR-001: Implement `suspend`, `ban`, and `transfer` RPCs (if not fully closed by BUG-011). |
| **S13-033** | Arnold | P1 | 8 | 🔴 To Do | SAR-002: Session Anomaly Detection & Lockdown Engine. |
| **S13-034** | Modisa | P1 | 5 | 🔴 To Do | SAR-003: System Health Monitoring & Auto-Cleanup tools. |
| **S13-035** | Arnold | P2 | 8 | 🔴 To Do | SAR-004: Document OCR & Automated Content Moderation. |
| **S13-036** | Arnold | P2 | 5 | 🔴 To Do | SAR-005: Signed Audit Log PDF Generation. |

---

### Category 12: Strategy Harmonization (P1) — Carried Over
**Source:** S12-010, S12-011

| Ticket | Owner | Priority | Points | Status | Summary |
|--------|-------|----------|--------|--------|---------|
| **S13-037** | Modisa | P1 | 3 | ✅ DONE | MOB-43: Refactor H1 Roadmap terminology (V1.0 Official Commercial Launch). |
| **S13-038** | Modisa | P1 | 3 | ✅ DONE | MOB-44: Update GTM Plan launch timelines & traction metrics. |

---

## 🚦 Execution Tracker

### Overall Progress
| Metric | Status |
|--------|--------|
| **Tasks Completed** | 2 of 35 |
| **Current Blockers** | Missing `google-services.json` (MOB-13) |

---

*Document generated for Sprint 13 planning review — April 28, 2026.*  
*Signed off by: Modisa Maphanyane*
