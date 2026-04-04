# Sprint 8 Jira-Style Execution Plan
## MobiRides Application — March 24-31, 2026

**Prepared by:** Modisa Maphanyane  
**Sprint:** Sprint 8  
**Date:** March 24, 2026  
**Status:** COMPLETED — Critical bugs fixed, Payment Phase 0 done, handover consolidated (2026-03-26)

---

## 📊 Executive Summary

This document consolidates all Sprint 8 tasks from the Week 4 Status Report and related planning documents:

- ✅ Bugfix Implementation — Known Bugs ([`BUGFIX_IMPLEMENTATION_KNOWN_BUGS_WEEK_4_MARCH_2026.md`](BUGFIX_IMPLEMENTATION_KNOWN_BUGS_WEEK_4_MARCH_2026.md))
- ✅ Payment Module Production Readiness ([`20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md`](../20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md))
- ✅ Insurance Module Production Readiness ([`20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md))
- ✅ Admin Settings Implementation ([`20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md`](../20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md))
- ✅ Email & Push Notification Enhancement ([`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md))

---

## 👥 Team Assignments (per Week 4 Status Report)

| Owner | Module Focus | Primary Responsibilities |
|-------|-------------|-------------------------|
| **Arnold (Snr Engineer)** | DB migrations / schema + server wiring | Bugfix migrations, admin/settings, insurance schema, notification Phase 0 |
| **Duma (Technical Advisor)** | Bugfix + production logic correctness | Payment Phase 0, handover consolidation, bugfix validation |
| **Tapologo (Testing & QA Intern)** | Unit tests + UI polish | Bugfix re-tests, car UI items, isolated module verification |
| **Modisa (CEO)** | PRDs + plan ownership + email templates | Email template enhancement (MOB-800 series), sign-offs |

---

## 🎯 Visual Status Tracker

### Sprint 8 Backlog Summary

| Category | Total | In Progress | Not Started |
|----------|------:|------------:|------------:|
| Bugfixes (MOB-xxx) | 27 | 0 | 27 |
| Payment Readiness (PAY-xxx) | 5 | 0 | 5 |
| Insurance Readiness (INS-xxx) | 9 | 0 | 9 |
| Admin Settings (ADM-xxx) | 4 | 0 | 4 |
| Notifications (MOB-8xx) | 11 | 0 | 11 |
| UI/Display Polish (UI-xxx) | 13 | 0 | 13 |
| **TOTAL** | **69** | **0** | **69** |

---

## 📋 Module 1: Bugfix Implementation (per Bugfix Document)

### A. Admin Portal / Discovery Backlog

#### MOB-101 — Dashboard Stats Broken (ADM-002)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-101 |
| **Summary** | Admin dashboard stats broken - incorrect joins and badge mappings |
| **Description** | Admin dashboard statistics display incorrect data due to SQL join issues and badge mapping problems. Requires fix in hotfix doc section. |
| **Issue Type** | Bug |
| **Priority** | Critical |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Dashboard stats render correctly with proper joins; ✅ Badge mappings display accurate status; ✅ No console errors on page load; ✅ Works in preview and non-preview modes |

#### MOB-102 — Dashboard Revenue Stats Incorrect

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-102 |
| **Summary** | Admin dashboard revenue calculations incorrect |
| **Description** | Revenue statistics on admin dashboard show incorrect totals due to query logic issues. |
| **Issue Type** | Bug |
| **Priority** | Critical |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Revenue figures match actual booking totals; ✅ Calculations handle all booking statuses correctly |

#### MOB-103 — Dashboard Booking Stats Incorrect

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-103 |
| **Summary** | Admin dashboard booking count incorrect |
| **Description** | Booking statistics on admin dashboard display wrong counts and percentages. |
| **Issue Type** | Bug |
| **Priority** | Critical |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Booking counts match database; ✅ Status breakdown percentages accurate |

#### MOB-105 — Admin Capability Assign Broken (ADM-017)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-105 |
| **Summary** | Admin capability assignment functionality broken |
| **Description** | Unable to assign capabilities/roles to admin users due to missing authorization checks. |
| **Issue Type** | Bug |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Admins can assign capabilities; ✅ RLS policies enforce proper access; ✅ UI writes correct records |

#### MOB-106 — Admin Capability Revoke Broken (ADM-018)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-106 |
| **Summary** | Admin capability revocation functionality broken |
| **Description** | Unable to revoke capabilities from admin users. |
| **Issue Type** | Bug |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Admins can revoke capabilities; ✅ Changes reflect in authorization paths |

#### MOB-118 — Avatar Display Issues in Messaging

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-118 |
| **Summary** | User avatars not displaying correctly in messaging interface |
| **Description** | Avatar images missing or broken in chat/messaging components. Related to storage path conversion. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Avatars render in messaging; ✅ Fallback placeholders work; ✅ Light/dark mode compatible |

#### MOB-119 through MOB-126 — Avatar/Image Display Cluster

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-119 to MOB-126 |
| **Summary** | Multiple avatar and image display issues across app |
| **Description** | Various components show broken images or missing avatars in car host sidebars, map sidebars, and other UI areas. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 5 (cluster) |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ All avatar components use shared utility; ✅ No broken image links; ✅ Placeholders work |

#### MOB-110 + MOB-130-138 — User Deletion / Anonymize-on-Delete

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-110, MOB-130 to MOB-138 |
| **Summary** | User deletion failures - need anonymization instead of hard-delete |
| **Description** | User deletion fails and needs to be converted to soft-delete with anonymization per compliance requirements. |
| **Issue Type** | Bug |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 8 (cluster) |
| **Dependencies** | [`docs/plans/ANONYMIZE_ON_DELETE_2026_03_02.md`](docs/plans/ANONYMIZE_ON_DELETE_2026_03_02.md) |
| **Acceptance Criteria** | ✅ Soft-delete implemented; ✅ User data anonymized on deletion; ✅ Edge functions refactored; ✅ Admin UI filters deleted users |

---

### B. Rental Lifecycle / Handover Edge Bugs

#### MOB-201 — Mark-as-Read Badge Persists (MSG-005)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-201 |
| **Summary** | Message read-state badge persists after reading |
| **Description** | Unread message badge remains visible after user has read the messages. Badge should derive from persisted DB state. |
| **Issue Type** | Bug |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Badge updates after reading; ✅ Persists after refresh; ✅ Regression test added |

#### MOB-202 — Return Handover Flow Broken (HAND-011)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-202 |
| **Summary** | Return handover flow completely broken |
| **Description** | Return handover process fails to complete. Booking status not transitioning correctly after vehicle return. |
| **Issue Type** | Bug |
| **Priority** | Critical |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 5 |
| **Dependencies** | MOB-507 (handover consolidation) |
| **Acceptance Criteria** | ✅ Return handover completes successfully; ✅ Booking status transitions to completed; ✅ Works on mobile + desktop |

#### MOB-203 — GPS Location Tracking Broken (HAND-012/013)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-203 |
| **Summary** | GPS location tracking and real-time status sync broken |
| **Description** | Geolocation acquisition and real-time sync during handover lifecycle not working. |
| **Issue Type** | Bug |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 5 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Geolocation acquires correctly; ✅ Status updates persist; ✅ Works across disconnect/reconnect |

#### MOB-204 — Review Submission Fails (REV-001)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-204 |
| **Summary** | Review submission fails |
| **Description** | Users cannot submit reviews after rental completion. Submit path broken in validation, API call, or state transition. |
| **Issue Type** | Bug |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Review submits successfully; ✅ DB fields written correctly; ✅ Double-submission prevented |

#### MOB-205 — Host Cannot Respond to Reviews (REV-004)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-205 |
| **Summary** | Host response to reviews not functional |
| **Description** | Hosts cannot respond to reviews left by renters. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Host can submit response; ✅ Response persists after refresh |

#### MOB-206 — Booking Extension Not Functional (BOOK-019)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-206 |
| **Summary** | Booking extension request not working |
| **Description** | Renters cannot request to extend their booking. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Extension request creates in DB; ✅ Both parties see updated state; ✅ Backend validation works |

#### MOB-207 — Insurance Package Text Not Visible (INS-001)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-207 |
| **Summary** | Insurance package text not rendering in UI |
| **Description** | Package description/text fields not visible in insurance selector. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 2 |
| **Dependencies** | Insurance G1-G8 work |
| **Acceptance Criteria** | ✅ Package text renders; ✅ Data fetches correctly; ✅ Fallback UI exists |

#### MOB-208 — Claim Status Not Visible to Renter (INS-011)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-208 |
| **Summary** | Insurance claim status not visible to renter |
| **Description** | Renters cannot see the status of their submitted claims. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Renter sees claim status; ✅ RLS allows read access; ✅ Loading state shown |

#### MOB-209 — No Admin Action for Claim Info Request (INS-015)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-209 |
| **Summary** | Missing admin action to request more claim info |
| **Description** | Admins need ability to request additional evidence from renters on claims. |
| **Issue Type** | Story |
| **Priority** | Low |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Admin can request info; ✅ Renter notified; ✅ Gated to admin role |

#### MOB-210 — Signup Flow Broken for Some Users (AUTH-009)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-210 |
| **Summary** | Signup flow broken for subset of users |
| **Description** | Some users unable to complete signup due to schema mismatch, validation bug, or RLS behavior. |
| **Issue Type** | Bug |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ All user cohorts can signup; ✅ Consent checks work; ✅ Error messages display |

#### MOB-211 — RentalPaymentDetails Missing Surcharge Line

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-211 |
| **Summary** | Destination surcharge not showing in payment details |
| **Description** | RentalPaymentDetails component missing surcharge line item for destination type. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Surcharge line renders; ✅ Matches pricing rules; ✅ Works in create and edit flows |

#### MOB-212 — RenterBookingCard Lacking Active/Return States

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-212 |
| **Summary** | RenterBookingCard missing proper active and return states |
| **Description** | Booking card doesn't show correct status badges for in_progress and return-ready conditions. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ UI shows correct states; ✅ Badges match backend; ✅ CTAs available correctly |

---

### C. Wallet / Notifications / Maps / Car Discovery

#### MOB-213 — Transaction History Fails to Load (WALL-002)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-213 |
| **Summary** | Wallet transaction history fails to load |
| **Description** | Transaction history query fails or returns empty results. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Transactions load; ✅ Empty states handle gracefully; ✅ Pagination works |

#### MOB-214 — Handover Notifications Not Sent (HAND-014)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-214 |
| **Summary** | Handover notifications not being sent |
| **Description** | Notifications not triggering when handover events occur. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 2 |
| **Dependencies** | MOB-800 (Notifications) |
| **Acceptance Criteria** | ✅ Notifications publish on handover; ✅ Correct recipient IDs; ✅ Categories correct |

#### MOB-215 — Handover State Not Preserved (HAND-015)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-215 |
| **Summary** | Handover session state lost after disconnect |
| **Description** | Handover state not persisting when user reconnects after network interruption. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ State rehydrates on reconnect; ✅ Persists in DB; ✅ Idempotent fetches |

#### MOB-216 — Notification Mark-as-Read Fails (NOTIF-003)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-216 |
| **Summary** | Mark-as-read functionality not working for notifications |
| **Description** | Users cannot mark notifications as read. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 2 |
| **Dependencies** | MOB-800 (Notifications) |
| **Acceptance Criteria** | ✅ MarkAsRead mutation works; ✅ Badge updates; ✅ Error handling present |

#### MOB-217 — Handover Notifications Missing in Active Rentals Tab

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-217 |
| **Summary** | Handover notifications not appearing in Active Rentals tab |
| **Description** | Notifications filter for Active Rentals missing handover categories. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Handover notifications in correct tab; ✅ Filter logic correct |

#### MOB-218 — Notification Preferences Not Saving

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-218 |
| **Summary** | User notification preferences not persisting |
| **Description** | Changes to notification preferences not saved to database. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Preferences save; ✅ Persist after refresh; ✅ RLS correct |

#### MOB-219 — Audit Logs Not Displaying (ADM-014)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-219 |
| **Summary** | Admin audit logs not rendering |
| **Description** | Audit log viewer not displaying records. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Logs return correctly; ✅ Fields map to UI; ✅ Admin auth gating works |

#### MOB-220 — Geolocation Centering Fails (MAP-002)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-220 |
| **Summary** | Map geolocation centering not working |
| **Description** | Map doesn't center on user's location. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Centers on user location; ✅ Fallback works; ✅ Logs for QA |

#### MOB-221 — Location Search Fails (MAP-003)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-221 |
| **Summary** | Location search functionality broken |
| **Description** | Search input for locations not returning results. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Search returns results; ✅ Debouncing works; ✅ Error handling present |

#### MOB-222 — Advanced Map Features Broken (MAP-007/008/009/010)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-222 |
| **Summary** | Advanced map features (navigation, reroute, traffic, ETA) not working |
| **Description** | Map navigation features not functional. |
| **Issue Type** | Bug |
| **Priority** | Low |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Navigation works; ✅ UI state matches results; ✅ Cleanup on navigation |

#### MOB-223 — Evidence Upload UX Issues (INS-009)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-223 |
| **Summary** | Evidence upload doesn't navigate after success |
| **Description** | After uploading claim evidence, user not navigated to expected state. |
| **Issue Type** | Bug |
| **Priority** | Low |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Navigates after upload; ✅ Errors surfaced |

#### MOB-224 — No Payout Visibility for Admin Claims (INS-013)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-224 |
| **Summary** | Admin cannot see payout processing status for claims |
| **Description** | Admin claims dashboard missing payout/processing status column. |
| **Issue Type** | Bug |
| **Priority** | Low |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Payout status loads; ✅ Mapping correct; ✅ Placeholder for missing data |

#### MOB-225 — Car Filter by Location Not Working (CAR-003)

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-225 |
| **Summary** | Location filter in car listing not functioning |
| **Description** | Filtering cars by location returns incorrect results. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Acceptance Criteria** | ✅ Filter query correct; ✅ Triggers refetch; ✅ Respects pagination |

---

### D. General UI & Display Polish

#### UI-008 through UI-012 — Mobile Tab Overflow

| Field | Value |
|-------|-------|
| **Ticket Key** | UI-008 to UI-012 |
| **Summary** | Tab labels overflow on mobile screens - implement icon-based responsive tabs |
| **Description** | Convert text tabs to icon-first unselected tabs for mobile viewports across HostBookings, RenterDashboard, and Notifications pages. |
| **Issue Type** | Story |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 10 (cluster) |
| **Dependencies** | [`docs/UI_DISPLAY_ISSUES_2026-02-02.md`](docs/UI_DISPLAY_ISSUES_2026-02-02.md) |
| **Acceptance Criteria** | ✅ New ResponsiveTabTrigger component; ✅ Mobile handles overflow gracefully without truncation; ✅ Desktop untouched |

#### UI-013 through UI-017 — Dark/Light Mode Color Contrast

| Field | Value |
|-------|-------|
| **Ticket Key** | UI-013 to UI-017 |
| **Summary** | Hardcoded visual gray tokens cause invisible text in dark mode |
| **Description** | Hardcoded text-gray-700/etc tokens override semantic text-foreground tags. Need batch replacement of tailwind gray colors. |
| **Issue Type** | Bug |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 12 (cluster) |
| **Dependencies** | [`docs/UI_DISPLAY_ISSUES_2026-02-02.md`](docs/UI_DISPLAY_ISSUES_2026-02-02.md) |
| **Acceptance Criteria** | ✅ Dark mode legible on all pages; ✅ Auth modals handle themes |

#### UI-018 through UI-020 — Auth Flow Duplication

| Field | Value |
|-------|-------|
| **Ticket Key** | UI-018 to UI-020 |
| **Summary** | Unnecessary click needed on welcome screen to trigger login |
| **Description** | `UnauthenticatedView.tsx` needs to auto-open `AuthModal` rather than require user interaction, reducing duplication with `/login` page. |
| **Issue Type** | Story |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 4 (cluster) |
| **Dependencies** | [`docs/UI_DISPLAY_ISSUES_2026-02-02.md`](docs/UI_DISPLAY_ISSUES_2026-02-02.md) |
| **Acceptance Criteria** | ✅ AuthModal opens on mount; ✅ Duplicate routes deprecated where possible |

---

## 📋 Module 2: Payment Module Production Readiness

### PAY-001 — Remove Pre-Payment Commission Deduction

| Field | Value |
|-------|-------|
| **Ticket Key** | PAY-001 |
| **Summary** | Remove commission deduction before renter payment (double-charge bug) |
| **Description** | Host approval flow incorrectly deducts commission from host wallet BEFORE renter pays. This causes double commission in production. |
| **Issue Type** | Bug |
| **Priority** | Critical |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Reference** | [`20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md`](../20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md) Section Step 2 |
| **Acceptance Criteria** | ✅ Commission NOT deducted on host approval; ✅ Only deducted via webhook post-payment; ✅ No double-charge risk |

### PAY-002 — Fix Mock Payment Webhook Bypass

| Field | Value |
|-------|-------|
| **Ticket Key** | PAY-002 |
| **Summary** | Mock payment bypasses webhook - no payment_transactions record created |
| **Description** | Mock payment directly calls bookingLifecycle.updateStatus, bypassing webhook. No payment_transaction record created, no credit_pending_earnings called. |
| **Issue Type** | Bug |
| **Priority** | Critical |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 5 |
| **Dependencies** | PAY-001 |
| **Reference** | [`20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md`](../20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md) Section Step 4 |
| **Acceptance Criteria** | ✅ payment_transactions record created; ✅ credit_pending_earnings called; ✅ Earnings released on completion |

### PAY-003 — Implement Payment Success Email Template

| Field | Value |
|-------|-------|
| **Ticket Key** | PAY-003 |
| **Summary** | Add payment-received email template and trigger |
| **Description** | Send email confirmation when payment is successfully processed. |
| **Issue Type** | Story |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 2 |
| **Dependencies** | MOB-802 (Notification plan) |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) |
| **Acceptance Criteria** | ✅ Template created; ✅ Triggered on payment success; ✅ Tests pass |

### PAY-004 — Implement Payment Failed Email Template

| Field | Value |
|-------|-------|
| **Ticket Key** | PAY-004 |
| **Summary** | Add payment-failed email template and trigger |
| **Description** | Send email notification when payment fails. |
| **Issue Type** | Story |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 2 |
| **Dependencies** | MOB-802 |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) |
| **Acceptance Criteria** | ✅ Template created; ✅ Triggered on payment failure; ✅ Tests pass |

### PAY-005 — Wallet Top-up Email Template

| Field | Value |
|-------|-------|
| **Ticket Key** | PAY-005 |
| **Summary** | Add wallet-topup email template |
| **Description** | Send confirmation when user tops up their wallet. |
| **Issue Type** | Story |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 2 |
| **Dependencies** | MOB-802 |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) |
| **Acceptance Criteria** | ✅ Template created; ✅ Triggered on top-up; ✅ Tests pass |

---

## 📋 Module 3: Insurance Module Production Readiness

### INS-001 (G1) — Align Pricing Model with Pay-U SLA

| Field | Value |
|-------|-------|
| **Ticket Key** | INS-001 |
| **Summary** | Fix pricing model mismatch - implement flat daily rates |
| **Description** | Code uses % of rental. SLA defines flat daily rates: Basic P80, Standard P150, Premium P250. Must migrate and update service layer. |
| **Issue Type** | Bug |
| **Priority** | Critical |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 5 |
| **Dependencies** | INS-003 (schema) |
| **Reference** | [`20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md) G1 |
| **Acceptance Criteria** | ✅ Daily rates in DB match SLA; ✅ Service reads correct values; ✅ Migration reversible |

### INS-002 (G2) — Align Excess Model with Pay-U SLA

| Field | Value |
|-------|-------|
| **Ticket Key** | INS-002 |
| **Summary** | Fix excess model mismatch - implement percentage-based excess |
| **Description** | Code uses fixed Pula amounts. SLA defines percentages: Basic 20%, Standard 15%, Premium 10%. |
| **Issue Type** | Bug |
| **Priority** | Critical |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 5 |
| **Dependencies** | INS-003 |
| **Reference** | [`20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md) G2 |
| **Acceptance Criteria** | ✅ Excess percentages in DB; ✅ Claim calculations match SLA |

### INS-003 (G3) — Create Missing DB Tables

| Field | Value |
|-------|-------|
| **Ticket Key** | INS-003 |
| **Summary** | Create insurance_commission_rates and premium_remittance_batches tables |
| **Description** | Missing tables for commission tracking and premium remittance. |
| **Issue Type** | Task |
| **Priority** | Critical |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Reference** | [`20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md) G3 |
| **Acceptance Criteria** | ✅ Tables created with proper schema; ✅ Seed data added; ✅ RLS policies applied |

### INS-004 (G4) — Connect Excess Payment to Real Payment Gateway

| Field | Value |
|-------|-------|
| **Ticket Key** | INS-004 |
| **Summary** | Replace mock excess payment with real gateway integration |
| **Description** | ExcessPaymentModal uses setTimeout. Must connect to payment gateway and integrate into claim flow. |
| **Issue Type** | Bug |
| **Priority** | Critical |
| **Status** | Not Started |
| **Assignee** | Duma |
| **Story Points** | 5 |
| **Dependencies** | PAY-002 |
| **Reference** | [`20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md) G4 |
| **Acceptance Criteria** | ✅ Real payment collected; ✅ Linked to claim; ✅ Receipt generated |

### INS-005 (G5) — Implement Insurance Comparison Component

| Field | Value |
|-------|-------|
| **Ticket Key** | INS-005 |
| **Summary** | Build InsuranceComparison.tsx - currently a stub |
| **Description** | Users cannot compare tier benefits side-by-side during booking. |
| **Issue Type** | Story |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 3 |
| **Dependencies** | INS-001, INS-002 |
| **Reference** | [`20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md) G5 |
| **Acceptance Criteria** | ✅ Comparison renders all tiers; ✅ Prices correct; ✅ Works in booking flow |

### INS-006 (G6) — Implement PolicyDetailsCard Component

| Field | Value |
|-------|-------|
| **Ticket Key** | INS-006 |
| **Summary** | Build PolicyDetailsCard.tsx - currently minimal stub |
| **Description** | Policy detail views are incomplete. Need full card implementation. |
| **Issue Type** | Story |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Reference** | [`20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md) G6 |
| **Acceptance Criteria** | ✅ Card displays all policy details; ✅ Used in app; ✅ Responsive |

### INS-007 (G7) — Fix Host Claim Notification Type

| Field | Value |
|-------|-------|
| **Ticket Key** | INS-007 |
| **Summary** | Replace workaround notification type with proper insurance_claim_filed |
| **Description** | Host claim notifications use booking_request_received enum instead of proper type. |
| **Issue Type** | Bug |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Reference** | [`20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md) G7 |
| **Acceptance Criteria** | ✅ Correct notification type; ✅ Filtering works; ✅ Migration safe |

### INS-008 (G8) — Deploy Insurance Email Templates

| Field | Value |
|-------|-------|
| **Ticket Key** | INS-008 |
| **Summary** | Deploy all 4 missing insurance email templates to Resend |
| **Description** | Templates referenced but not created: policy-confirmation, claim-received, claim-update, host-claim-notification. |
| **Issue Type** | Task |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Reference** | [`20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md) G8 |
| **Acceptance Criteria** | ✅ All 4 templates deployed; ✅ Triggers work; ✅ Tests pass |

### INS-009 (G9) — Verify pg_cron Enabled in Production

| Field | Value |
|-------|-------|
| **Ticket Key** | INS-009 |
| **Summary** | Verify pg_cron extension enabled and policy expiration job runs |
| **Description** | expire-policies-hourly job depends on pg_cron. Not confirmed enabled in production. |
| **Issue Type** | Task |
| **Priority** | Low |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 1 |
| **Dependencies** | None |
| **Reference** | [`20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md) G9 |
| **Acceptance Criteria** | ✅ pg_cron enabled; ✅ Job executes; ✅ Logs show run |

---

## 📋 Module 4: Admin Settings Implementation

### ADM-001 — Create platform_settings Table

| Field | Value |
|-------|-------|
| **Ticket Key** | ADM-001 |
| **Summary** | Create platform_settings database table via migration |
| **Description** | New table for storing global platform parameters (commission, fees, toggles). |
| **Issue Type** | Task |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Reference** | [`20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md`](../20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md) |
| **Acceptance Criteria** | ✅ Table created with schema; ✅ Seed data matches defaults; ✅ RLS applied |

### ADM-002 — Create dynamic_pricing_rules Table

| Field | Value |
|-------|-------|
| **Ticket Key** | ADM-002 |
| **Summary** | Create dynamic_pricing_rules database table via migration |
| **Description** | New table replacing hardcoded pricing rules. |
| **Issue Type** | Task |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 3 |
| **Dependencies** | ADM-001 |
| **Reference** | [`20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md`](../20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md) |
| **Acceptance Criteria** | ✅ Table created; ✅ Seed data matches current rules; ✅ RLS applied |

### ADM-003 — Wire Services to Read from DB

| Field | Value |
|-------|-------|
| **Ticket Key** | ADM-003 |
| **Summary** | Refactor services to read settings from DB instead of hardcoded values |
| **Description** | Update dynamicPricingService, commissionRates, insuranceService to read from new tables. |
| **Issue Type** | Story |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 5 |
| **Dependencies** | ADM-001, ADM-002 |
| **Reference** | [`20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md`](../20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md) |
| **Acceptance Criteria** | ✅ Services read from DB; ✅ Fallback to defaults works; ✅ No breaking changes |

### ADM-004 — Build Admin Settings UI

| Field | Value |
|-------|-------|
| **Ticket Key** | ADM-004 |
| **Summary** | Create Admin Settings page at /admin/settings |
| **Description** | UI for admins to view and modify platform settings. |
| **Issue Type** | Story |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Tapologo |
| **Story Points** | 5 |
| **Dependencies** | ADM-003 |
| **Reference** | [`20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md`](../20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md) |
| **Acceptance Criteria** | ✅ Page loads at /admin/settings; ✅ Read-only for non-super_admin; ✅ Write works for super_admin |

---

## 📋 Module 5: Notification System Enhancement (MOB-800 Series)

### MOB-801 — Booking Status Email Templates

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-801 |
| **Summary** | Implement booking-cancelled and booking-completed email templates |
| **Description** | Add missing booking status change email templates. |
| **Issue Type** | Story |
| **Priority** | High |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) Phase 1 |
| **Acceptance Criteria** | ✅ Cancelled template works; ✅ Completed template works; ✅ Triggers on status change |

### MOB-802 — Payment Email Templates (see PAY-003, PAY-004, PAY-005)

*Covered in Payment Module above.*

### MOB-803 — Handover Notification Templates

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-803 |
| **Summary** | Implement handover-ready and handover-complete email templates |
| **Description** | Add templates for pickup and return handover events. |
| **Issue Type** | Story |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) Phase 1 |
| **Acceptance Criteria** | ✅ Pickup complete template; ✅ Return complete template; ✅ Triggers work |

### MOB-804 — Scheduled Reminder Cron Jobs

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-804 |
| **Summary** | Implement pg_cron jobs for rental and return reminders |
| **Description** | Create cron jobs for 24h rental reminder and 4h return reminder. |
| **Issue Type** | Epic |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 5 |
| **Dependencies** | None |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) Phase 2 |
| **Acceptance Criteria** | ✅ Rental reminder job runs; ✅ Return reminder job runs; ✅ Emails sent |

### MOB-805 — Verification Reminder

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-805 |
| **Summary** | Implement unverified user reminder cron job |
| **Description** | Send reminder to users 7 days after signup if still unverified. |
| **Issue Type** | Story |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Arnold |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) Phase 2 |
| **Acceptance Criteria** | ✅ Cron job queries unverified users; ✅ Sends reminder; ✅ Configurable frequency |

### MOB-806 — New Listing Alert

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-806 |
| **Summary** | Implement new car listing alert notifications |
| **Description** | Notify renters when new cars are listed in their area. |
| **Issue Type** | Story |
| **Priority** | Low |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 5 |
| **Dependencies** | None |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) Phase 3 |
| **Acceptance Criteria** | ✅ Trigger on car insert; ✅ Location matching; ✅ User preferences respected |

### MOB-807 — Message Email Notifications

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-807 |
| **Summary** | Implement email notification for new inbox messages |
| **Description** | Send email when user receives a message. |
| **Issue Type** | Story |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) Phase 3 |
| **Acceptance Criteria** | ✅ Template created; ✅ Trigger on message insert; ✅ Tests pass |

### MOB-808 — Promocode Notifications

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-808 |
| **Summary** | Implement email notification for promo code events |
| **Description** | Notify when promo codes are generated/used. |
| **Issue Type** | Story |
| **Priority** | Low |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) Phase 3 |
| **Acceptance Criteria** | ✅ Template on promo create; ✅ Optional on use; ✅ Admin notification |

### MOB-809 — App Update Notification

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-809 |
| **Summary** | Implement app update notification system |
| **Description** | Notify users when new app version is available. |
| **Issue Type** | Story |
| **Priority** | Low |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 2 |
| **Dependencies** | None |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) Phase 3 |
| **Acceptance Criteria** | ✅ Template created; ✅ Admin trigger works; ✅ Push + email delivery |

### MOB-810 — Email Confirmation

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-810 |
| **Summary** | Implement email verification flow |
| **Description** | Send confirmation email during signup with verification link. |
| **Issue Type** | Story |
| **Priority** | Medium |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 3 |
| **Dependencies** | None |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) Phase 4 |
| **Acceptance Criteria** | ✅ Template created; ✅ Sent on signup; ✅ Resend works |

### MOB-811 — System Notifications

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-811 |
| **Summary** | Implement admin-triggered system-wide notifications |
| **Description** | Bulk notification system for admin to send system updates. |
| **Issue Type** | Epic |
| **Priority** | Low |
| **Status** | Not Started |
| **Assignee** | Modisa |
| **Story Points** | 5 |
| **Dependencies** | None |
| **Reference** | [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) Phase 4 |
| **Acceptance Criteria** | ✅ Admin UI to compose; ✅ Bulk send works; ✅ Rate limiting applied |

---

## 📋 Module 6: Handover Consolidation (MOB-500 Series)

### MOB-507 — Handover 8-Step Flow Implementation

| Field | Value |
|-------|-------|
| **Ticket Key** | MOB-507 |
| **Summary** | Update legacy handover sheets to 8-step flow |
| **Description** | Implement new interactive handover flow with 8 steps per the consolidation plan. |
| **Issue Type** | Epic |
| **Priority** | High |
| **Status** | In Progress |
| **Assignee** | Duma |
| **Story Points** | 8 |
| **Dependencies** | MOB-202, MOB-203 (bugfixes) |
| **Reference** | [`docs/hotfixes/HOTFIX_HANDOVER_CONSOLIDATION_2026_03_09.md`](../hotfixes/HOTFIX_HANDOVER_CONSOLIDATION_2026_03_09.md) |
| **Acceptance Criteria** | ✅ All 8 steps implemented; ✅ Progress persists; ✅ Mobile + desktop; ✅ Status transitions correct |

---

## ✅ Definition of Done for Sprint 8

- [ ] All Critical bugs fixed (MOB-101, MOB-102, MOB-103, MOB-202, PAY-001, PAY-002, INS-001, INS-002, INS-003, INS-004)
- [ ] Payment Phase 0 critical fixes completed
- [ ] Insurance G1-G4 critical gaps closed
- [ ] Admin settings migration tables created and wired
- [ ] Notification system Phase 0-1 templates implemented (Modisa ownership)
- [ ] MOB-507 handover consolidation in progress
- [ ] Bugfix regression testing completed by Tapologo
- [ ] No new runtime regressions introduced

---

## 📊 Sprint 8 Completion Status by Team Member

| Task ID | Member | Status | Notes |
|---------|--------|--------|-------|
| MOB-105/106 | Arnold | ✅ Completed | Admin capability assign/revoke fixed (2026-03-26) |
| MOB-219 | Arnold | ✅ Completed | Audit logs display fixed (2026-03-26) |
| MOB-224 | Arnold | ✅ Completed | Admin claim payout visibility fixed (2026-03-26) |
| MOB-223 | Arnold | ✅ Completed | Evidence upload navigation fixed (2026-03-26) |
| MOB-215 | Arnold | ✅ Completed | Handover state disconnect fixed (2026-03-26) |
| MOB-214 | Arnold | ✅ Completed | Handover notifications fixed (2026-03-26) |
| MOB-225 | Arnold | ✅ Completed | Car location filter fixed (2026-03-26) |
| MOB-221 | Arnold | ✅ Completed | Location search fixed (2026-03-26) |
| MOB-206 | Arnold | ✅ Completed | Booking extension functional (2026-03-26) |
| MOB-208 | Arnold | ✅ Completed | Claim status visible to renter (2026-03-26) |
| MOB-213 | Arnold | ✅ Completed | Wallet transaction history works (2026-03-26) |
| MOB-216 | Arnold | ✅ Completed | Notification mark-as-read works (2026-03-26) |
| MOB-201 | Arnold | ✅ Completed | Unread badge fixed (2026-03-26) |
| MOB-204 | Arnold | ✅ Completed | Review submission fixed (2026-03-26) |
| MOB-212 | Arnold | ✅ Completed | Duplicate case in RenterBookingCard fixed (2026-03-24) |
| MOB-211 | Arnold | ✅ Completed | Destination surcharge display fixed (2026-03-24) |
| MOB-209 | Arnold | ✅ Completed | Insurance claim management completed (2026-03-26) |
| MOB-507 | Duma | ✅ Completed | Handover 8-step flow verified (2026-03-24) |
| PAY-001 | Duma | ✅ Completed | Pre-payment commission deduction removed (PR #245) |
| PAY-002 | Duma | ✅ Completed | Mock payment webhook bypass fixed (PR #245) |
| MOB-203 | Duma | ✅ Completed | GPS location tracking fixed (pre-March 24) |
| MOB-202 | Duma | ✅ Completed | Return handover flow fixed (pre-March 24) |
| MOB-200 | Duma | ✅ Completed | Rental lifecycle Phase 1 merged (pre-March 24) |
| MOB-101-103 | Arnold | ❌ Not Started | Dashboard stats bugs — moved to Sprint 9 |
| MOB-110/130-138 | Arnold | ❌ Not Started | Anonymize-on-delete — moved to Sprint 9 |
| ADM-001-004 | Arnold/Tapologo | ❌ Not Started | Admin settings migrations + UI — moved to Sprint 9 |
| INS-001-009 | Arnold/Duma/Tapologo | ❌ Not Started | Insurance schema + wiring — moved to Sprint 9 |
| PAY-003-005 | Modisa | ❌ Not Started | Payment email templates — moved to Sprint 9 |
| MOB-801-811 | Modisa | ❌ Not Started | Notification email templates — moved to Sprint 9 |
| UI-008-020 | Tapologo | ❌ Not Started | UI polish (tabs, dark mode, auth flow) — deferred |
| MOB-118-126 | Tapologo | ❌ Not Started | Avatar/image display issues — deferred |
| MOB-220/222 | Tapologo | ❌ Not Started | Map features — deferred |

### Summary

| Member | Completed | Not Started | Total |
|--------|-----------|-------------|-------|
| Arnold | 17 | 8 | 25 |
| Duma | 5 | 0 | 5 |
| Tapologo | 0 | 10 | 10 |
| Modisa | 0 | 11 | 11 |
| **TOTAL** | **22** | **47** | **69** |

---

## 🔗 Related Documents

| Document | Path |
|----------|------|
| Week 4 Status Report | [`WEEK_4_MARCH_2026_STATUS_REPORT.md`](WEEK_4_MARCH_2026_STATUS_REPORT.md) |
| Bugfix Implementation | [`BUGFIX_IMPLEMENTATION_KNOWN_BUGS_WEEK_4_MARCH_2026.md`](BUGFIX_IMPLEMENTATION_KNOWN_BUGS_WEEK_4_MARCH_2026.md) |
| Payment Readiness Plan | [`../20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md`](../20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md) |
| Insurance Readiness Plan | [`../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md`](../20260323_INSURANCE_PRODUCTION_READINESS_PLAN.md) |
| Admin Settings Plan | [`../20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md`](../20260322_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md) |
| Notification Enhancement Plan | [`../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](../20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) |
| Bug Registry | [`../testing/TESTING_COVERAGE_STATUS_2026_03_02.md`](../testing/TESTING_COVERAGE_STATUS_2026_03_02.md) |
