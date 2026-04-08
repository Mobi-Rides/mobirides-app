# MobiRides Pre-Launch Testing Protocol
**Document Date:** January 5, 2026 (Week 1 Q1 2026)  
**Last Updated:** March 2, 2026  
**Version:** v2.0.0  
**Prepared By:** MobiRides Technical Team  
**Testing Lead:** Arnold (Technical Lead)  
**Support:** Duma, Tebogo  
**First Round Testers:** Oratile (Community & PR), Pearl (Customer Success), Loago (Chief of Staff)  
**Extended Team:** Natasha & Kelvin (Creative), Ella (Finance), Jessica (Marketing)

> **📊 Latest Testing Coverage Report:** [TESTING_COVERAGE_STATUS_2026_03_02.md](./TESTING_COVERAGE_STATUS_2026_03_02.md)  
> **🔧 Active Hotfix Tracker:** [HOTFIX_ADMIN_PORTAL_2026_02_24.md](../hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md)  
> **🗑️ Anonymize-on-Delete Plan:** [ANONYMIZE_ON_DELETE_2026_03_02.md](../plans/ANONYMIZE_ON_DELETE_2026_03_02.md)

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#-executive-summary)
2. [Current Testing Status (March 2026)](#-current-testing-status-march-2026)
3. [Testing Objectives](#-testing-objectives)
4. [Testing Phases & Timeline](#-testing-phases--timeline)
5. [Team Roles & Responsibilities](#-team-roles--responsibilities)
6. [Slack Bug Reporting Protocol](#-slack-bug-reporting-protocol)
7. [Test Environment Setup](#-test-environment-setup)
8. [User Role Definitions](#-user-role-definitions)
9. [Module Testing Specifications](#-module-testing-specifications)
10. [User Journey Tests](#-user-journey-tests)
11. [Route & Navigation Testing](#-route--navigation-testing)
12. [Edge Case Testing](#-edge-case-testing)
13. [Known Issues & Previous Bugs](#-known-issues--previous-bugs)
14. [Security Testing](#-security-testing)
15. [Performance Testing](#-performance-testing)
16. [Mobile Responsiveness Testing](#-mobile-responsiveness-testing)
17. [Accessibility Testing](#-accessibility-testing)
18. [Test Sign-Off Checklist](#-test-sign-off-checklist)
19. [Appendix: Test Case Templates](#-appendix-test-case-templates)

---

## 🎯 EXECUTIVE SUMMARY

This document establishes the comprehensive pre-launch testing protocol for MobiRides v2.5.0. Testing is conducted across multiple phases with cross-functional team involvement.

1. **Internal Testing (Phase 1):** Technical team + first-round business testers
2. **Extended Team Testing (Phase 2):** Creative, Finance, Marketing testers
3. **Beta Group Testing (Phase 3):** External beta users

### Testing Scope

| Category | Test Cases | Priority |
|----------|-----------|----------|
| User Journey Tests | 47 | Critical |
| Module Unit Tests | 156 | Critical |
| Route Navigation Tests | 72 | High |
| Edge Case Tests | 89 | High |
| Security Tests | 24 | Critical |
| Performance Tests | 18 | Medium |
| Accessibility Tests | 32 | Medium |

### Success Criteria

- **Zero** critical bugs in production release
- **<5** high-priority bugs (with documented workarounds)
- **100%** core user journey completion rate
- **100%** route accessibility (no 404 errors)
- **All** security vulnerabilities resolved

### Current Status (as of March 2, 2026)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Critical bugs | 0 | 1 (HAND-011 return handover) | ❌ Not met |
| High-priority bugs | <5 | 5 (MSG-005, AUTH-009, HAND-012/013, REV-001) | ❌ Not met |
| Medium-priority bugs | — | 15 | ⚠️ Under review |
| Test execution rate | 100% | ~62% (271/438 test executions) | ⚠️ In progress |
| Unique test cases covered | 197 | 197 executed of 197 defined | ✅ All attempted |

> ⚠️ **Action Required:** See [Testing Coverage Status Report](./TESTING_COVERAGE_STATUS_2026_03_02.md) for the full bug registry (MOB-201 through MOB-225) and Round 2 test assignments.

---

## 📊 CURRENT TESTING STATUS (March 2026)

### Tester Execution Summary

| Tester | Passed | Failed | Blocked | Execution % | Primary Focus |
|--------|--------|--------|---------|-------------|---------------|
| Arnold | 13 | 0 | 2 | 89.8% | Admin/Host (partial results) |
| Kelvin | 69 | 0 | 0 | 71.1% | Renter/Host (all pass) |
| Loago | 106 | 11 | 4 | 87.8% | Renter/Host/Admin (most bugs found) |
| Pearl | 52 | 1 | 0 | 36% | Renter (partial) |
| Teboho | 31 | 0 | 0 | 20.8% | SuperAdmin (limited) |

**Combined:** ~271 pass, 12 fail, 6 blocked across 197 test cases.

### Critical & High-Priority Open Bugs

| Ticket | Test ID | Description | Severity | Confirmed By |
|--------|---------|-------------|----------|--------------|
| MOB-202 | HAND-011 | Return handover flow broken | 🔴 Critical | Loago |
| MOB-201 | MSG-005 | Mark-as-read badge persists | 🔴 High | Kelvin, Loago, Pearl |
| MOB-210 | AUTH-009 | Signup broken for some users | 🔴 High | Loago |
| MOB-203 | HAND-012/013 | GPS + real-time sync broken | 🔴 High | Arnold, Loago |
| MOB-204 | REV-001 | Review submission fails | 🔴 High | Arnold |

### Coverage Gaps Requiring Round 2 Testing

| Module | Gap | Assigned To (Round 2) |
|--------|-----|-----------------------|
| Wallet (host ops) | 0% coverage on WALL-005–010 | Kelvin |
| Reviews | 62% untested, 2 fails | Arnold (renter perspective) |
| Handover (host-side) | No host-side testing | Loago (as host) |
| Admin | Single tester, 4 blocked/failed | Teboho |
| Promo Codes | Single tester validation only | Kelvin |

> 📋 **Full details:** [TESTING_COVERAGE_STATUS_2026_03_02.md](./TESTING_COVERAGE_STATUS_2026_03_02.md)

---

## 🎯 TESTING OBJECTIVES

### Primary Objectives

1. **Validate Core Functionality:** Ensure all features work as specified in PRD
2. **Identify 404/Broken Routes:** Map all incomplete or dead-end navigation paths
3. **Discover Edge Cases:** Find edge cases and boundary conditions that break logic
4. **Verify Role-Based Access:** Confirm proper access control across all user roles
5. **Test Navigation Flows:** Validate forward/backward navigation throughout the app
6. **Confirm Data Integrity:** Ensure data persists correctly across all operations

### Secondary Objectives

1. Document user experience friction points
2. Validate error message clarity and helpfulness
3. Confirm loading states and feedback mechanisms
4. Test offline/poor connectivity scenarios
5. Validate cross-browser compatibility

---

## 📅 TESTING PHASES & TIMELINE

### Phase 1: Internal Testing (January 6-17, 2026) — ✅ Complete

| Week | Focus | Testers | Status | Deliverables |
|------|-------|---------|--------|--------------|
| Week 1 (Jan 6-10) | Core flows + Admin | Arnold, Duma, Tebogo | ✅ Done | Bug reports, route audit |
| Week 2 (Jan 13-17) | User journeys + Edge cases | Oratile, Pearl, Loago | ✅ Done | UX feedback, journey maps |

### Phase 2: Extended Team Testing (January 20 – February 28, 2026) — ✅ Complete

| Period | Focus | Testers | Status | Deliverables |
|--------|-------|---------|--------|--------------|
| Jan 20-22 | Full platform walkthrough | Natasha, Kelvin | ✅ Done | Visual/UI bugs |
| Jan 22-23 | Financial flows | Ella (Finance) | ✅ Done | Payment/wallet bugs |
| Jan 23-24 | Marketing features | Jessica (Marketing) | ✅ Done | Promo code, sharing bugs |
| Feb 10-28 | Comprehensive UAT | Arnold, Kelvin, Loago, Pearl, Teboho | ✅ Done | [Coverage Report](./TESTING_COVERAGE_STATUS_2026_03_02.md) |

### Phase 3: Bug Fix & Re-Test (March 2026) — 🔄 In Progress

| Week | Focus | Testers | Status | Deliverables |
|------|-------|---------|--------|--------------|
| Mar 3-7 | Fix critical/high bugs (MOB-201–225) | Technical team | 🔄 Active | Hotfix patches |
| Mar 3-7 | Round 2: Coverage gap filling | Kelvin, Pearl, Teboho, Loago | 📋 Planned | Re-test results |
| Mar 10-14 | Regression testing | All testers | 📋 Planned | Sign-off |

### Phase 4: Beta Group Testing — 📋 Planned (Post Phase 3)

| Week | Focus | Testers | Status | Deliverables |
|------|-------|---------|--------|--------------|
| TBD | Real-world usage | 50 beta users | 📋 Pending | Live bug reports |
| TBD | Stress testing | 100 beta users | 📋 Pending | Performance data |

---

## 👥 TEAM ROLES & RESPONSIBILITIES

### Technical Team

| Name | Role | Responsibilities |
|------|------|------------------|
| **Arnold** | Testing Lead | Coordinate testing, triage bugs, assign fixes, run regression tests |
| **Duma** | QA Support | Execute test cases, document bugs, verify fixes |
| **Tebogo** | QA Support | Execute test cases, focus on SuperAdmin features |

### First Round Business Testers

| Name | Role | Testing Focus |
|------|------|---------------|
| **Oratile** | Community & PR Lead | Renter journey, social features, messaging |
| **Pearl** | Customer Success Lead | End-to-end user experience, error messaging, help center |
| **Loago** | Chief of Staff | Admin dashboard, overall platform coherence |

### Extended Team Testers

| Name | Role | Testing Focus |
|------|------|---------------|
| **Natasha** | Creative Team | Visual consistency, UI/UX issues, branding |
| **Kelvin** | Creative Team | Image uploads, car photos, avatar handling |
| **Ella** | Finance | Wallet, transactions, commission calculations |
| **Jessica** | Marketing | Promo codes, referrals, campaign features |

---

## 📢 SLACK BUG REPORTING PROTOCOL

### Channel: `#testing`

All bugs must be reported in the `#testing` Slack channel using the following format:

### Bug Report Template

```
🐛 **BUG REPORT**

**Bug ID:** [Auto-generated or leave blank]
**Reporter:** [Your Name]
**Date/Time:** [YYYY-MM-DD HH:MM]
**Severity:** [🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low]

**Category:** [Select One]
- [ ] UI/Visual
- [ ] Functionality
- [ ] Navigation/Routing
- [ ] Performance
- [ ] Security
- [ ] Data/Database
- [ ] Integration

**Module:** [e.g., Booking, Messaging, Handover, Admin]

**User Role:** [Renter | Host | Admin | SuperAdmin | Guest]

**Device/Browser:** [e.g., Chrome 120 on Windows 11, Safari on iPhone 15]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Video:**
[Attach media or paste links]

**Console Errors (if any):**
```
[Paste console errors here]
```

**Additional Context:**
[Any other relevant information]
```

### Severity Definitions

| Severity | Definition | Response Time | Example |
|----------|------------|---------------|---------|
| 🔴 **Critical** | App crash, data loss, security breach, complete feature failure | 4 hours | Payment fails silently, user data exposed |
| 🟠 **High** | Major feature broken, workaround exists but difficult | 24 hours | Booking can't be confirmed, images don't upload |
| 🟡 **Medium** | Feature partially broken, easy workaround exists | 48 hours | Filter doesn't work correctly, styling issues |
| 🟢 **Low** | Minor issue, cosmetic, enhancement request | 1 week | Typo, minor alignment, nice-to-have feature |

### Bug Lifecycle in Slack

1. **New Bug Posted** → React with 👀 (Arnold acknowledges)
2. **Under Investigation** → React with 🔍 (Team investigating)
3. **Assigned** → Reply with assignee name and ETA
4. **Fix Deployed** → React with ✅ and reply with fix details
5. **Verified Fixed** → Original reporter reacts with ✅✅
6. **Won't Fix** → React with ⏸️ and explain reason

### Bug Triage Meetings

| Meeting | Time | Attendees | Purpose |
|---------|------|-----------|---------|
| Daily Standup | 9:00 AM | Arnold, Duma, Tebogo | Review new bugs, assign priorities |
| Triage Session | 2:00 PM (Wed/Fri) | Technical Team + Loago | Deep dive on complex bugs |

---

## 🖥️ TEST ENVIRONMENT SETUP

### Test Accounts

Each tester will receive pre-configured test accounts:

| Role | Email Pattern | Password | Notes |
|------|---------------|----------|-------|
| Renter | `test.renter.[name]@mobirides.test` | Provided separately | Has verified status |
| Host | `test.host.[name]@mobirides.test` | Provided separately | Has listed cars |
| Admin | `test.admin.[name]@mobirides.test` | Provided separately | Admin access |
| SuperAdmin | `test.superadmin@mobirides.test` | Provided separately | Full access |
| Unverified | `test.unverified.[name]@mobirides.test` | Provided separately | New user state |

### Test Data

The test environment includes:

- **50 Test Cars:** Various brands, locations, price points
- **100 Test Users:** Mix of renters and hosts
- **200 Test Bookings:** All status types (pending, confirmed, completed, cancelled)
- **50 Test Conversations:** With message history
- **20 Insurance Policies:** Various packages and claim states
- **Wallet Balances:** Pre-loaded for transaction testing

### Browser Requirements

Test on the following browsers:

| Browser | Version | Priority |
|---------|---------|----------|
| Chrome | 120+ | Critical |
| Safari | 17+ | Critical |
| Firefox | 121+ | High |
| Edge | 120+ | Medium |
| Mobile Safari | iOS 17+ | Critical |
| Chrome Mobile | Android 13+ | Critical |

---

## 👤 USER ROLE DEFINITIONS

### Guest (Unauthenticated)

**Access Level:** Public pages only

| Can Access | Cannot Access |
|------------|---------------|
| Home page (`/`) | Dashboard |
| Car listing (`/car-listing`) | Bookings |
| Car details (`/cars/:id`) | Messages |
| Login/Signup | Profile |
| Help center (public) | Wallet |

### Renter (Authenticated - Default Role)

**Access Level:** Consumer features

| Feature | Access |
|---------|--------|
| Browse/Search Cars | ✅ Full |
| Book Cars | ✅ Full |
| Messaging (Renter-Host) | ✅ Full |
| Reviews (Write as Renter) | ✅ Full |
| Wallet (View Balance) | ✅ View Only |
| Insurance | ✅ Purchase |
| Claims | ✅ Submit |
| Verification | ✅ Full |

### Host (Authenticated - Host Role)

**Access Level:** Vehicle owner features

| Feature | Access |
|---------|--------|
| List Cars | ✅ Full |
| Edit Cars | ✅ Own Cars |
| Manage Bookings | ✅ For Own Cars |
| Accept/Decline Requests | ✅ Full |
| Wallet (Earnings) | ✅ Full |
| Handover Management | ✅ Full |
| Reviews (Respond) | ✅ Full |

### Admin (Admin Role)

**Access Level:** Platform management

| Feature | Access |
|---------|--------|
| Admin Dashboard | ✅ Full |
| User Management | ✅ View/Moderate |
| Car Management | ✅ Approve/Reject |
| Booking Oversight | ✅ View All |
| Verification Review | ✅ Approve/Reject |
| Transaction View | ✅ View Only |
| Message Monitoring | ✅ Read Only |

### SuperAdmin (Super Admin Role)

**Access Level:** Full platform control

| Feature | Access |
|---------|--------|
| All Admin Features | ✅ Full |
| Admin Management | ✅ Create/Edit/Delete |
| Role Assignment | ✅ Full |
| Capability Assignment | ✅ Full |
| Audit Logs | ✅ Full |
| System Analytics | ✅ Full |
| Promo Code Management | ✅ Full |

---

## 📦 MODULE TESTING SPECIFICATIONS

### Module 1: Authentication & Profile

**Priority:** 🔴 Critical  
**Reference:** Epic 1, `src/pages/Login.tsx`, `src/pages/signup.tsx`, `src/pages/Profile.tsx`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| AUTH-001 | Valid email/password login | Enter valid credentials, click Login | Redirect to dashboard | Guest |
| AUTH-002 | Invalid email login | Enter non-existent email | Error: "Invalid credentials" | Guest |
| AUTH-003 | Invalid password login | Enter wrong password | Error: "Invalid credentials" | Guest |
| AUTH-004 | Empty field validation | Submit empty form | Validation errors shown | Guest |
| AUTH-005 | Password visibility toggle | Click eye icon | Password shows/hides | Guest |
| AUTH-006 | Forgot password flow | Click "Forgot password" | Navigate to reset page | Guest |
| AUTH-007 | Password reset email | Submit valid email | Success message, email sent | Guest |
| AUTH-008 | Password reset with token | Use reset link | Can set new password | Guest |
| AUTH-009 | Signup with valid data | Fill all fields correctly | Account created, redirected | Guest |
| AUTH-010 | Signup duplicate email | Use existing email | Error: "Email already exists" | Guest |
| AUTH-011 | Logout functionality | Click logout | Session ended, redirect to home | All |
| AUTH-012 | Session persistence | Refresh page | Stay logged in | All |
| AUTH-013 | Profile view | Navigate to profile | Profile data displays correctly | All |
| AUTH-014 | Profile edit | Update profile fields | Changes saved successfully | All |
| AUTH-015 | Avatar upload | Upload new avatar | Avatar updates | All |
| AUTH-016 | Role switch (Renter→Host) | Switch to Host | Role changes, UI updates | Renter |
| AUTH-017 | Role switch (Host→Renter) | Switch to Renter | Role changes, UI updates | Host |

#### Navigation Tests

| Test ID | From Route | To Route | Action | Expected |
|---------|------------|----------|--------|----------|
| AUTH-NAV-001 | `/login` | `/` | Successful login | Redirect to home |
| AUTH-NAV-002 | `/signup` | `/` | Successful signup | Redirect to home |
| AUTH-NAV-003 | `/login` | `/signup` | Click "Sign up" link | Navigate to signup |
| AUTH-NAV-004 | `/signup` | `/login` | Click "Login" link | Navigate to login |
| AUTH-NAV-005 | `/forgot-password` | `/password-reset-sent` | Submit email | Navigate to confirmation |
| AUTH-NAV-006 | `/profile` | `/edit-profile` | Click edit button | Navigate to edit |
| AUTH-NAV-007 | `/edit-profile` | `/profile` | Save or cancel | Return to profile |
| AUTH-NAV-008 | Any protected | `/login` | Access when logged out | Redirect to login |

---

### Module 2: Verification (KYC)

**Priority:** 🔴 Critical  
**Reference:** Epic 2, `src/pages/Verification.tsx`, `src/components/verification/`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| VER-001 | Start verification | Click "Start Verification" | Step 1 displays | Renter/Host |
| VER-002 | Step 1: Personal Info | Fill required fields | Proceed to Step 2 | Renter/Host |
| VER-003 | Step 1: Invalid data | Submit empty/invalid | Validation errors | Renter/Host |
| VER-004 | Step 2: Address | Enter address details | Proceed to Step 3 | Renter/Host |
| VER-005 | Step 3: Phone verify | Enter phone number | OTP sent (mock) | Renter/Host |
| VER-006 | Step 3: OTP validation | Enter correct OTP | Proceed to Step 4 | Renter/Host |
| VER-007 | Step 3: Invalid OTP | Enter wrong OTP | Error message | Renter/Host |
| VER-008 | Step 4: ID upload front | Upload ID front | Image uploaded | Renter/Host |
| VER-009 | Step 4: ID upload back | Upload ID back | Image uploaded | Renter/Host |
| VER-010 | Step 4: Invalid file type | Upload non-image | Error: invalid type | Renter/Host |
| VER-011 | Step 5: License upload | Upload license | Image uploaded | Renter/Host |
| VER-012 | Step 6: Selfie capture | Take selfie | Selfie captured | Renter/Host |
| VER-013 | Step 7: Review & Submit | Submit verification | Status: Pending | Renter/Host |
| VER-014 | View verification status | Check status page | Shows current status | Renter/Host |
| VER-015 | Resume incomplete verification | Return to verification | Continues from last step | Renter/Host |
| VER-016 | Admin: View pending | Navigate to verifications | List of pending reviews | Admin |
| VER-017 | Admin: Approve | Click approve | Status: Approved | Admin |
| VER-018 | Admin: Reject with reason | Click reject, add reason | Status: Rejected with reason | Admin |

---

### Module 3: Vehicle Management

**Priority:** 🔴 Critical  
**Reference:** Epic 3, `src/pages/AddCar.tsx`, `src/pages/EditCar.tsx`, `src/components/add-car/`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| CAR-001 | View car listing | Navigate to `/car-listing` | Cars display in grid | Guest/All |
| CAR-002 | Car search by brand | Enter brand in search | Filtered results | Guest/All |
| CAR-003 | Car filter by location | Select location filter | Filtered results | Guest/All |
| CAR-004 | Car filter by price | Set price range | Filtered results | Guest/All |
| CAR-005 | Car filter by type | Select vehicle type | Filtered results | Guest/All |
| CAR-006 | View car details | Click on car card | Navigate to details page | Guest/All |
| CAR-007 | Car image carousel | Swipe/click arrows | Images change | Guest/All |
| CAR-008 | Save car to wishlist | Click save/heart icon | Car saved | Renter |
| CAR-009 | Remove from wishlist | Click unsave icon | Car removed | Renter |
| CAR-010 | View saved cars | Navigate to `/saved-cars` | List of saved cars | Renter |
| CAR-011 | Add new car - Step 1 | Fill basic info | Proceed to next step | Host |
| CAR-012 | Add new car - Step 2 | Fill car details | Proceed to next step | Host |
| CAR-013 | Add new car - Features | Select features | Features saved | Host |
| CAR-014 | Add new car - Images | Upload multiple images | Images uploaded | Host |
| CAR-015 | Add new car - Set primary | Select primary image | Primary marked | Host |
| CAR-016 | Add new car - Location | Set pickup location | Location saved on map | Host |
| CAR-017 | Add new car - Price | Set daily rate | Price saved | Host |
| CAR-018 | Add new car - Submit | Submit car listing | Car created, pending approval | Host |
| CAR-019 | Edit existing car | Modify car details | Changes saved | Host |
| CAR-020 | Delete car image | Remove image | Image deleted | Host |
| CAR-021 | Set car availability | Toggle availability | Status updated | Host |
| CAR-022 | Block specific dates | Select dates to block | Dates blocked | Host |
| CAR-023 | Admin: View all cars | Navigate to admin cars | All cars listed | Admin |
| CAR-024 | Admin: Approve car | Approve pending car | Status: Approved | Admin |
| CAR-025 | Admin: Reject car | Reject with reason | Status: Rejected | Admin |

---

### Module 4: Booking System

**Priority:** 🔴 Critical  
**Reference:** Epic 4, `src/components/booking/`, `src/pages/RenterBookings.tsx`, `src/pages/HostBookings.tsx`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| BOOK-001 | Open booking dialog | Click "Book Now" on car | Booking dialog opens | Renter |
| BOOK-002 | Select dates | Pick start/end dates | Dates shown, price calculated | Renter |
| BOOK-003 | Select times | Pick start/end times | Times shown | Renter |
| BOOK-004 | Date conflict detection | Select booked dates | Error: dates unavailable | Renter |
| BOOK-005 | View price breakdown | Review booking | Price breakdown shows | Renter |
| BOOK-006 | Apply promo code | Enter valid code | Discount applied | Renter |
| BOOK-007 | Invalid promo code | Enter invalid code | Error message | Renter |
| BOOK-008 | Select insurance | Choose package | Premium added to total | Renter |
| BOOK-009 | Set pickup location | Select on map | Location saved | Renter |
| BOOK-010 | Submit booking request | Confirm booking | Booking created, status: pending | Renter |
| BOOK-011 | View renter bookings | Navigate to bookings | List of bookings | Renter |
| BOOK-012 | View booking details | Click on booking | Full details shown | Renter |
| BOOK-013 | Cancel pending booking | Cancel booking | Status: cancelled | Renter |
| BOOK-014 | Host: View booking requests | Navigate to host bookings | Incoming requests shown | Host |
| BOOK-015 | Host: Accept booking | Click accept | Status: confirmed | Host |
| BOOK-016 | Host: Decline booking | Click decline | Status: cancelled | Host |
| BOOK-017 | Booking confirmation notification | Accept booking | Renter receives notification | Host |
| BOOK-018 | View confirmed booking | Check bookings | Shows confirmed status | Renter/Host |
| BOOK-019 | Booking extension request | Request extension | Extension request sent | Renter |
| BOOK-020 | Admin: View all bookings | Navigate to admin | All bookings visible | Admin |

---

### Module 5: Payment & Wallet

**Priority:** 🔴 Critical (Currently Mock)  
**Reference:** Epic 5, `src/pages/Wallet.tsx`

> ⚠️ **Note:** Payment integration is mock. Test wallet functionality only.

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| WALL-001 | View wallet balance | Navigate to wallet | Balance displayed | Host |
| WALL-002 | View transaction history | Scroll transactions | History loads | Host |
| WALL-003 | Filter transactions | Use filter options | Filtered results | Host |
| WALL-004 | Commission display | View completed booking | Commission shown | Host |
| WALL-005 | Earnings breakdown | View earnings tab | Breakdown displays | Host |
| WALL-006 | Top-up wallet (mock) | Initiate top-up | Mock success | Host |
| WALL-007 | Withdraw request (mock) | Request withdrawal | Mock success | Host |
| WALL-008 | Transaction details | Click transaction | Details modal | Host |
| WALL-009 | Admin: View transactions | Navigate to admin | All transactions | Admin |

---

### Module 6: Messaging

**Priority:** 🟠 High  
**Reference:** Epic 6, `src/pages/Messages.tsx`, `src/components/chat/`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| MSG-001 | View conversations | Navigate to messages | Conversation list shows | Renter/Host |
| MSG-002 | Open conversation | Click conversation | Chat window opens | Renter/Host |
| MSG-003 | Send text message | Type and send | Message appears | Renter/Host |
| MSG-004 | Receive real-time message | Other user sends | Message appears instantly | Renter/Host |
| MSG-005 | Mark as read | Open unread | Read status updates | Renter/Host |
| MSG-006 | Send image | Attach and send image | Image sent | Renter/Host |
| MSG-007 | Start new conversation | Message from car page | New conversation created | Renter |
| MSG-008 | Search conversations | Use search bar | Filtered results | Renter/Host |
| MSG-009 | Mobile: Back to list | Press back button | Returns to list | Renter/Host |
| MSG-010 | Desktop: Sidebar visible | Select conversation | Both list and chat visible | Renter/Host |
| MSG-011 | Empty state | No conversations | "No messages" shown | Renter/Host |
| MSG-012 | Admin: View messages | Navigate to admin | All conversations visible | Admin |

---

### Module 7: Handover Process

**Priority:** 🟠 High  
**Reference:** Epic 7, `src/components/handover/`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| HAND-001 | Start handover (pickup) | Click "Start Handover" | Handover sheet opens | Host |
| HAND-002 | Step 1: Identity verify | Verify renter identity | Step complete | Host |
| HAND-003 | Step 2: Vehicle inspection | Complete inspection | Step complete | Host |
| HAND-004 | Step 3: Damage documentation | Take photos | Photos uploaded | Host |
| HAND-005 | Step 4: Key transfer | Confirm key transfer | Step complete | Host |
| HAND-006 | Step 5: Fuel level | Record fuel level | Level saved | Host |
| HAND-007 | Step 6: Mileage | Record odometer | Mileage saved | Host |
| HAND-008 | Step 7: Signature (host) | Sign digitally | Signature captured | Host |
| HAND-009 | Step 8: Signature (renter) | Sign digitally | Signature captured | Renter |
| HAND-010 | Step 9: Complete | Finalize handover | Handover complete | Both |
| HAND-011 | Return handover | Initiate return | Return flow starts | Renter |
| HAND-012 | GPS location tracking | View location | Location shows on map | Both |
| HAND-013 | Real-time status sync | Complete step | Other party sees update | Both |
| HAND-014 | Handover notifications | Complete handover | Notifications sent | Both |
| HAND-015 | Resume interrupted | Return after disconnect | State preserved | Both |

---

### Module 8: Reviews & Ratings

**Priority:** 🟡 Medium  
**Reference:** Epic 8, `src/pages/RentalReview.tsx`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| REV-001 | Leave car review | Complete rental, review | Review submitted | Renter |
| REV-002 | Rate categories | Select star ratings | Ratings saved | Renter |
| REV-003 | Add review text | Write review | Text saved | Renter |
| REV-004 | Host response | Respond to review | Response visible | Host |
| REV-005 | View car reviews | View car details | Reviews displayed | Guest/All |
| REV-006 | Average rating display | View car card | Average shown | Guest/All |
| REV-007 | Cannot review twice | Try second review | Error: already reviewed | Renter |
| REV-008 | Review before rental | Try to review | Error: not eligible | Renter |

---

### Module 9: Navigation & Maps

**Priority:** 🟠 High  
**Reference:** Epic 9, `src/pages/Map.tsx`, `src/components/map/`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| MAP-001 | View map page | Navigate to `/map` | Map loads | All |
| MAP-002 | Current location | Allow location | Map centers on user | All |
| MAP-003 | Search location | Enter address | Results shown | All |
| MAP-004 | View cars on map | Enable car layer | Car markers show | All |
| MAP-005 | Click car marker | Click marker | Car info popup | All |
| MAP-006 | Get directions | Click "Directions" | Route displayed | All |
| MAP-007 | Turn-by-turn nav | Start navigation | Voice guidance | All |
| MAP-008 | Off-route detection | Deviate from route | Reroute triggered | All |
| MAP-009 | Traffic layer | Enable traffic | Traffic shown | All |
| MAP-010 | Share ETA | Click share ETA | Share dialog | All |

---

### Module 10: Notifications

**Priority:** 🟠 High  
**Reference:** Epic 10, `src/pages/NotificationsRefactored.tsx`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| NOTIF-001 | View notifications | Navigate to notifications | List displays | All |
| NOTIF-002 | Notification badge | Have unread | Badge shows count | All |
| NOTIF-003 | Mark as read | Click notification | Read status | All |
| NOTIF-004 | Mark all as read | Click "Mark all" | All marked read | All |
| NOTIF-005 | Delete notification | Swipe/click delete | Notification removed | All |
| NOTIF-006 | Booking notification | Booking event | Notification received | All |
| NOTIF-007 | Wallet notification | Transaction event | Notification received | Host |
| NOTIF-008 | Handover notification | Handover event | Notification in Active tab | All |
| NOTIF-009 | Notification preferences | Update preferences | Settings saved | All |
| NOTIF-010 | Filter by category | Select category | Filtered list | All |
| NOTIF-011 | Navigate from notification | Click action | Navigate to related | All |

---

### Module 11: Admin Dashboard

**Priority:** 🟠 High  
**Reference:** Epic 11, `src/pages/admin/`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| ADM-001 | Access admin dashboard | Navigate to `/admin` | Dashboard loads | Admin |
| ADM-002 | View statistics | Check dashboard | Stats display | Admin |
| ADM-003 | Manage users | Navigate to users | User list shows | Admin |
| ADM-004 | Search users | Use search | Filtered results | Admin |
| ADM-005 | View user details | Click user | Details modal | Admin |
| ADM-006 | Suspend user | Click suspend | User suspended | Admin |
| ADM-007 | Manage cars | Navigate to cars | Car list shows | Admin |
| ADM-008 | Approve car | Click approve | Car approved | Admin |
| ADM-009 | View bookings | Navigate to bookings | All bookings | Admin |
| ADM-010 | View transactions | Navigate to transactions | All transactions | Admin |
| ADM-011 | Verification review | Navigate to verifications | Pending list | Admin |
| ADM-012 | Approve verification | Click approve | Status updated | Admin |
| ADM-013 | Reject verification | Click reject | Status updated | Admin |
| ADM-014 | View audit logs | Navigate to audit | Logs display | SuperAdmin |
| ADM-015 | Manage admins | Navigate to management | Admin list | SuperAdmin |
| ADM-016 | Create admin | Add new admin | Admin created | SuperAdmin |
| ADM-017 | Assign capabilities | Set capabilities | Capabilities saved | SuperAdmin |
| ADM-018 | Revoke admin | Remove admin | Admin removed | SuperAdmin |
| ADM-019 | Manage promo codes | Navigate to promos | Promo list | Admin |
| ADM-020 | Create promo code | Add new code | Code created | Admin |

---

### Module 12: Insurance System

**Priority:** 🟠 High  
**Reference:** Epic 12, `src/components/insurance/`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| INS-001 | View packages | During booking | 4 packages shown | Renter |
| INS-002 | Select package | Choose tier | Package selected | Renter |
| INS-003 | View premium calc | Select package | Premium displayed | Renter |
| INS-004 | Policy creation | Complete booking | Policy created | Renter |
| INS-005 | View policies | Navigate to policies | Policy list | Renter |
| INS-006 | Download policy PDF | Click download | PDF downloads | Renter |
| INS-007 | Submit claim | Start claim form | Claim form opens | Renter |
| INS-008 | Claim: Incident details | Fill form | Details saved | Renter |
| INS-009 | Claim: Evidence upload | Upload photos | Photos uploaded | Renter |
| INS-010 | Claim: Submit | Submit claim | Claim created | Renter |
| INS-011 | View claim status | Check claims | Status visible | Renter |
| INS-012 | Admin: View claims | Navigate to claims | All claims | Admin |
| INS-013 | Admin: Approve claim | Approve claim | Payout processed | Admin |
| INS-014 | Admin: Reject claim | Reject with reason | Status updated | Admin |
| INS-015 | Admin: Request info | Request more info | Status updated | Admin |

---

### Module 13: Promo Codes

**Priority:** 🟡 Medium  
**Reference:** Epic 13, `src/components/promo/`

#### Unit Tests

| Test ID | Test Case | Steps | Expected Result | Role |
|---------|-----------|-------|-----------------|------|
| PROMO-001 | Apply valid code | Enter code at booking | Discount applied | Renter |
| PROMO-002 | Apply invalid code | Enter wrong code | Error message | Renter |
| PROMO-003 | Apply expired code | Enter expired | Error message | Renter |
| PROMO-004 | Apply used code | Reuse same code | Error message | Renter |
| PROMO-005 | View promo history | Navigate to history | Used codes shown | Renter |
| PROMO-006 | Admin: View codes | Navigate to promos | All codes listed | Admin |
| PROMO-007 | Admin: Create code | Add new code | Code created | Admin |
| PROMO-008 | Admin: Deactivate | Deactivate code | Code inactive | Admin |
| PROMO-009 | Admin: View usage | Check code stats | Usage displayed | Admin |

---

## 🚶 USER JOURNEY TESTS

### Journey 1: New Renter - First Booking

**Priority:** 🔴 Critical  
**Estimated Time:** 20 minutes

| Step | Action | Expected Result | Checkpoint |
|------|--------|-----------------|------------|
| 1 | Visit homepage | Homepage loads | ✅ |
| 2 | Browse cars | Car grid displays | ✅ |
| 3 | Click "Sign Up" | Signup modal opens | ✅ |
| 4 | Complete registration | Account created | ✅ |
| 5 | Start verification | Verification flow begins | ✅ |
| 6 | Complete all 7 steps | Verification submitted | ✅ |
| 7 | Browse cars again | Cars visible | ✅ |
| 8 | Select a car | Car details page | ✅ |
| 9 | Click "Book Now" | Booking dialog opens | ✅ |
| 10 | Select dates | Price calculated | ✅ |
| 11 | Apply promo "FIRST100" | Discount applied | ✅ |
| 12 | Select insurance | Premium added | ✅ |
| 13 | Confirm booking | Booking created | ✅ |
| 14 | View booking in list | Booking shows pending | ✅ |
| 15 | Receive confirmation | Notification arrives | ✅ |

### Journey 2: Host - List First Car

**Priority:** 🔴 Critical  
**Estimated Time:** 15 minutes

| Step | Action | Expected Result | Checkpoint |
|------|--------|-----------------|------------|
| 1 | Login as host | Dashboard loads | ✅ |
| 2 | Navigate to "Add Car" | Car form opens | ✅ |
| 3 | Fill basic info | Form accepts data | ✅ |
| 4 | Fill car details | Details saved | ✅ |
| 5 | Select features | Features selected | ✅ |
| 6 | Upload 5 images | Images uploaded | ✅ |
| 7 | Set primary image | Primary marked | ✅ |
| 8 | Set location on map | Location saved | ✅ |
| 9 | Set price | Price saved | ✅ |
| 10 | Submit listing | Car created | ✅ |
| 11 | View my cars | New car in list | ✅ |
| 12 | Car pending approval | Status: pending | ✅ |

### Journey 3: Host - Accept Booking & Handover

**Priority:** 🔴 Critical  
**Estimated Time:** 25 minutes

| Step | Action | Expected Result | Checkpoint |
|------|--------|-----------------|------------|
| 1 | Login as host | Dashboard loads | ✅ |
| 2 | View booking requests | Pending request visible | ✅ |
| 3 | Click on request | Request details shown | ✅ |
| 4 | Accept booking | Status: confirmed | ✅ |
| 5 | Renter notified | Notification sent | ✅ |
| 6 | View confirmed booking | Booking details | ✅ |
| 7 | On rental day, start handover | Handover sheet opens | ✅ |
| 8 | Complete identity check | Step 1 complete | ✅ |
| 9 | Complete vehicle inspection | Step 2 complete | ✅ |
| 10 | Document any damage | Photos uploaded | ✅ |
| 11 | Confirm key transfer | Step 4 complete | ✅ |
| 12 | Record fuel level | Fuel saved | ✅ |
| 13 | Record mileage | Mileage saved | ✅ |
| 14 | Sign as host | Signature captured | ✅ |
| 15 | Renter signs | Signature captured | ✅ |
| 16 | Complete handover | Handover finished | ✅ |
| 17 | View wallet | Earnings pending | ✅ |

### Journey 4: Complete Rental Cycle

**Priority:** 🔴 Critical  
**Estimated Time:** 30 minutes

| Step | Action | Expected Result | Checkpoint |
|------|--------|-----------------|------------|
| 1-16 | (Journey 3 steps) | Handover complete | ✅ |
| 17 | Rental period ends | Return date arrives | ✅ |
| 18 | Initiate return handover | Return flow starts | ✅ |
| 19 | Complete return inspection | Inspection done | ✅ |
| 20 | Document return condition | Photos uploaded | ✅ |
| 21 | Confirm key return | Keys returned | ✅ |
| 22 | Record final fuel | Fuel recorded | ✅ |
| 23 | Record final mileage | Mileage recorded | ✅ |
| 24 | Both parties sign | Signatures captured | ✅ |
| 25 | Complete return | Rental complete | ✅ |
| 26 | Leave review | Review submitted | ✅ |
| 27 | Host wallet credited | Balance updated | ✅ |

### Journey 5: Admin - User Verification Review

**Priority:** 🟠 High  
**Estimated Time:** 10 minutes

| Step | Action | Expected Result | Checkpoint |
|------|--------|-----------------|------------|
| 1 | Login as admin | Admin dashboard | ✅ |
| 2 | Navigate to verifications | Pending list | ✅ |
| 3 | Select pending user | User details open | ✅ |
| 4 | Review documents | Documents visible | ✅ |
| 5 | Verify ID | ID checked | ✅ |
| 6 | Verify selfie | Selfie matched | ✅ |
| 7 | Approve verification | Status: verified | ✅ |
| 8 | User notified | Notification sent | ✅ |

### Journey 6: SuperAdmin - Admin Management

**Priority:** 🟠 High  
**Estimated Time:** 15 minutes

| Step | Action | Expected Result | Checkpoint |
|------|--------|-----------------|------------|
| 1 | Login as superadmin | Dashboard loads | ✅ |
| 2 | Navigate to admin management | Admin list | ✅ |
| 3 | Click "Add Admin" | Creation form | ✅ |
| 4 | Enter admin details | Details saved | ✅ |
| 5 | Assign capabilities | Capabilities set | ✅ |
| 6 | Create admin | Admin created | ✅ |
| 7 | View audit logs | Creation logged | ✅ |
| 8 | Test new admin login | Admin can login | ✅ |
| 9 | Verify capability limits | Access controlled | ✅ |
| 10 | Revoke admin access | Admin removed | ✅ |

### Journey 7: Insurance Claim Flow

**Priority:** 🟠 High  
**Estimated Time:** 15 minutes

| Step | Action | Expected Result | Checkpoint |
|------|--------|-----------------|------------|
| 1 | Login as renter | Dashboard loads | ✅ |
| 2 | View booking with policy | Policy visible | ✅ |
| 3 | Click "File Claim" | Claim form opens | ✅ |
| 4 | Enter incident details | Details saved | ✅ |
| 5 | Describe damage | Description saved | ✅ |
| 6 | Upload evidence photos | Photos uploaded | ✅ |
| 7 | Submit claim | Claim created | ✅ |
| 8 | View claim status | Status: pending | ✅ |
| 9 | Admin reviews claim | Claim in admin queue | ✅ |
| 10 | Admin approves claim | Claim approved | ✅ |
| 11 | Payout processed | Wallet credited | ✅ |
| 12 | Renter notified | Notification received | ✅ |

---

## 🔀 ROUTE & NAVIGATION TESTING

### All Application Routes

| Route | Page | Auth Required | Admin Only | Status to Verify |
|-------|------|---------------|------------|------------------|
| `/` | Home | ❌ | ❌ | ✅ Loads |
| `/login` | Login | ❌ | ❌ | ✅ Loads |
| `/signup` | Signup | ❌ | ❌ | ✅ Loads |
| `/forgot-password` | Forgot Password | ❌ | ❌ | ✅ Loads |
| `/reset-password` | Reset Password | ❌ | ❌ | ✅ Loads |
| `/password-reset-sent` | Reset Confirmation | ❌ | ❌ | ✅ Loads |
| `/confirm-email` | Email Confirmation | ❌ | ❌ | Redirects to login |
| `/car-listing` | Car Listing | ❌ | ❌ | ✅ Loads |
| `/cars/:carId` | Car Details | ❌ | ❌ | ✅ Loads |
| `/profile` | Profile View | ✅ | ❌ | ✅ Loads |
| `/profile-view` | Profile View Alt | ✅ | ❌ | ✅ Loads |
| `/edit-profile` | Edit Profile | ✅ | ❌ | ✅ Loads |
| `/dashboard` | User Dashboard | ✅ | ❌ | ✅ Loads |
| `/add-car` | Add Car | ✅ | ❌ | ✅ Loads |
| `/create-car` | Create Car Alt | ✅ | ❌ | ✅ Loads |
| `/edit-car/:id` | Edit Car | ✅ | ❌ | ✅ Loads |
| `/saved-cars` | Saved Cars | ✅ | ❌ | ✅ Loads |
| `/driver-license` | License Upload | ✅ | ❌ | ✅ Loads |
| `/verification` | KYC Verification | ✅ | ❌ | ✅ Loads |
| `/bookings` | Booking Redirect | ✅ | ❌ | Redirects by role |
| `/bookings/:id` | Booking Details | ✅ | ❌ | ✅ Loads |
| `/host-bookings` | Host Bookings | ✅ | ❌ | ✅ Loads |
| `/renter-bookings` | Renter Bookings | ✅ | ❌ | ✅ Loads |
| `/booking-requests/:id` | Request Details | ✅ | ❌ | ✅ Loads |
| `/rental-details/:id` | Rental Details | ✅ | ❌ | ✅ Loads |
| `/rental-review/:bookingId` | Leave Review | ✅ | ❌ | ✅ Loads |
| `/notifications` | Notifications | ✅ | ❌ | ✅ Loads |
| `/notifications/:id` | Notification Detail | ✅ | ❌ | ✅ Loads |
| `/notification-preferences` | Preferences | ✅ | ❌ | ✅ Loads |
| `/messages` | Messaging | ✅ | ❌ | ✅ Loads |
| `/wallet` | Wallet | ✅ | ❌ | ✅ Loads |
| `/map` | Map View | ✅ | ❌ | ✅ Loads |
| `/more` | More Menu | ✅ | ❌ | ✅ Loads |
| `/promo-codes` | Promo History | ✅ | ❌ | ✅ Loads |
| `/settings/profile` | Profile Settings | ✅ | ❌ | ✅ Loads |
| `/settings/verification` | Verification Settings | ✅ | ❌ | ✅ Loads |
| `/settings/display` | Display Settings | ✅ | ❌ | ✅ Loads |
| `/settings/security` | Security Settings | ✅ | ❌ | ✅ Loads |
| `/help/:role` | Help Center | ✅ | ❌ | ✅ Loads |
| `/help/:role/:section` | Help Section | ✅ | ❌ | ✅ Loads |
| `/claims` | User Claims | ✅ | ❌ | ✅ Loads |
| `/insurance/policies` | Insurance Policies | ✅ | ❌ | ✅ Loads |
| `/admin` | Admin Dashboard | ✅ | ✅ | ✅ Loads |
| `/admin/users` | Admin Users | ✅ | ✅ | ✅ Loads |
| `/admin/cars` | Admin Cars | ✅ | ✅ | ✅ Loads |
| `/admin/bookings` | Admin Bookings | ✅ | ✅ | ✅ Loads |
| `/admin/transactions` | Admin Transactions | ✅ | ✅ | ✅ Loads |
| `/admin/verifications` | Admin Verifications | ✅ | ✅ | ✅ Loads |
| `/admin/messages` | Admin Messages | ✅ | ✅ | ✅ Loads |
| `/admin/management` | Admin Management | ✅ | SuperAdmin | ✅ Loads |
| `/admin/audit` | Audit Logs | ✅ | SuperAdmin | ✅ Loads |
| `/admin/analytics` | Analytics | ✅ | SuperAdmin | ✅ Loads |
| `/admin/promo-codes` | Promo Codes | ✅ | ✅ | ✅ Loads |
| `/admin/claims` | Claims Dashboard | ✅ | ✅ | ✅ Loads |
| `/*` (404) | Not Found | ❌ | ❌ | ✅ Shows 404 page |

### Navigation Flow Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| NAV-001 | Back button - Car details | View car → Back | Returns to listing |
| NAV-002 | Back button - Booking | View booking → Back | Returns to list |
| NAV-003 | Back button - Profile edit | Edit profile → Cancel | Returns to profile |
| NAV-004 | Deep link - Car | Direct URL to car | Car loads |
| NAV-005 | Deep link - Booking | Direct URL to booking | Booking loads (if authorized) |
| NAV-006 | Deep link - Admin | Direct admin URL | Loads or access denied |
| NAV-007 | Bottom nav - Home | Click Home | Navigate to home |
| NAV-008 | Bottom nav - Bookings | Click Bookings | Navigate to bookings |
| NAV-009 | Bottom nav - Messages | Click Messages | Navigate to messages |
| NAV-010 | Bottom nav - More | Click More | Navigate to more |
| NAV-011 | Header - Profile | Click profile icon | Profile dropdown |
| NAV-012 | Header - Notifications | Click bell icon | Notifications page |
| NAV-013 | 404 handling | Invalid URL | 404 page shown |
| NAV-014 | Auth redirect | Access protected | Redirect to login |
| NAV-015 | Admin redirect | Non-admin access admin | Access denied |
| NAV-016 | Session expired | Token expires | Redirect to login |

---

## ⚡ EDGE CASE TESTING

### Authentication Edge Cases

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| EDGE-AUTH-001 | Multiple tabs | Login in two tabs | Both show logged in |
| EDGE-AUTH-002 | Concurrent logout | Logout in one tab | Both logged out |
| EDGE-AUTH-003 | Token expiry during action | Submit form with expired token | Graceful redirect to login |
| EDGE-AUTH-004 | Email with special chars | Register with `user+test@email.com` | Successful registration |
| EDGE-AUTH-005 | Very long password | 100+ character password | Should work |
| EDGE-AUTH-006 | Unicode in name | Name with emojis/unicode | Should handle gracefully |
| EDGE-AUTH-007 | Rapid login/logout | Quick successive login/logout | No state issues |
| EDGE-AUTH-008 | Clear cookies mid-session | Delete cookies while logged in | Graceful logout |

### Booking Edge Cases

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| EDGE-BOOK-001 | Same day booking | Book car for today | Should work or show error |
| EDGE-BOOK-002 | 1 year future booking | Book 365 days ahead | Should work |
| EDGE-BOOK-003 | Exact overlap dates | Book same dates as existing | Error: unavailable |
| EDGE-BOOK-004 | Partial overlap | Overlapping date range | Error: unavailable |
| EDGE-BOOK-005 | Book own car | Host books their car | Should prevent |
| EDGE-BOOK-006 | Double submit | Click confirm twice | Only one booking |
| EDGE-BOOK-007 | Cancel mid-creation | Close dialog halfway | No ghost bookings |
| EDGE-BOOK-008 | Very long rental | 90+ day rental | Price calculates correctly |
| EDGE-BOOK-009 | Maximum price | High value booking | Handles large numbers |
| EDGE-BOOK-010 | Currency edge | Amounts with many decimals | Rounds correctly |

### Upload Edge Cases

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| EDGE-UPL-001 | Very large image | Upload 10MB+ image | Handles or shows limit error |
| EDGE-UPL-002 | Invalid file type | Upload .exe file | Rejected |
| EDGE-UPL-003 | Corrupted image | Upload corrupted file | Error handling |
| EDGE-UPL-004 | Slow upload | Large file on slow connection | Progress shown, no timeout |
| EDGE-UPL-005 | Cancel upload | Cancel mid-upload | Clean cancel |
| EDGE-UPL-006 | Duplicate image | Upload same image twice | Handles appropriately |
| EDGE-UPL-007 | No file selected | Submit without file | Validation error |
| EDGE-UPL-008 | Many files | Upload 20+ images | Handles or shows limit |

### Messaging Edge Cases

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| EDGE-MSG-001 | Very long message | 5000+ character message | Handles or shows limit |
| EDGE-MSG-002 | Empty message | Send empty | Prevented |
| EDGE-MSG-003 | Special characters | Messages with HTML/script | Sanitized display |
| EDGE-MSG-004 | Rapid messages | Send 10 messages quickly | All appear in order |
| EDGE-MSG-005 | Offline then online | Send while offline | Queued and sent |
| EDGE-MSG-006 | Message to blocked user | (If feature exists) | Appropriate handling |
| EDGE-MSG-007 | Self-conversation | Try to message self | Should prevent |

### Handover Edge Cases

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| EDGE-HAND-001 | GPS denied | Deny location permission | Fallback or error |
| EDGE-HAND-002 | Lost connection | Disconnect mid-handover | State preserved |
| EDGE-HAND-003 | Back navigation | Navigate away mid-handover | State preserved |
| EDGE-HAND-004 | Phone call interruption | Receive call during handover | State preserved |
| EDGE-HAND-005 | Complete out of order | Try to skip steps | Prevented |
| EDGE-HAND-006 | Signature cancel | Cancel during signature | Can retry |
| EDGE-HAND-007 | Photo upload fail | Upload fails | Retry option |
| EDGE-HAND-008 | Concurrent completion | Both try to complete | Handles gracefully |

### Payment/Wallet Edge Cases

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| EDGE-PAY-001 | Zero balance operation | Withdraw with 0 balance | Error message |
| EDGE-PAY-002 | Negative prevention | Try negative transaction | Prevented |
| EDGE-PAY-003 | Concurrent transactions | Two transactions at once | Both handled correctly |
| EDGE-PAY-004 | Very large amount | P1,000,000 transaction | Handles or has limit |
| EDGE-PAY-005 | Decimal precision | P1.999 transaction | Rounds correctly |

### Admin Edge Cases

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| EDGE-ADM-001 | Delete only admin | Try to delete last admin | Prevented |
| EDGE-ADM-002 | Self-demotion | Remove own admin rights | Prevented or warned |
| EDGE-ADM-003 | Bulk action large set | Bulk action on 1000+ users | Handles gracefully |
| EDGE-ADM-004 | Approve deleted car | Car deleted while reviewing | Graceful handling |
| EDGE-ADM-005 | Concurrent approval | Two admins approve same item | No duplicates |

---

## 🐛 KNOWN ISSUES & PREVIOUS BUGS

### Resolved Issues (Q4 2025)

| Issue | Description | Resolution Date | Fix Details |
|-------|-------------|-----------------|-------------|
| Messaging RLS Recursion | Infinite loop in message queries | Dec 4, 2025 | RLS policies rewritten |
| Storage RLS Recursion | Storage access causing loops | Dec 2, 2025 | SECURITY DEFINER function |
| Dual Message Systems | Two active messaging tables | Dec 5, 2025 | Legacy archived |
| Wallet Balance Confusion | Earnings vs balance unclear | Dec 2025 | Wallet RPCs added |
| Navigation 404s | Several routes broken | Dec 2025 | Routes consolidated |
| TypeScript Build Errors | 21 critical errors | Oct 2025 | All resolved |

### Known Remaining Issues

| Issue ID | Description | Severity | Workaround | Module |
|----------|-------------|----------|------------|--------|
| BUG-001 | GPS permission denial blocks handover | High | Manual coordinate entry planned | Handover |
| BUG-002 | Push notifications not delivered | High | In-app only for now | Notifications |
| BUG-003 | SMS verification mock only | Medium | Skip or mock OTP | Verification |
| BUG-004 | Payment processing is mock | Critical | N/A - must implement | Payments |
| BUG-005 | Message sidebar disappears on mobile | Medium | Use back button | Messaging |
| BUG-006 | Large image uploads slow | Low | Resize before upload | Cars |
| BUG-007 | Search filters reset on navigation | Low | Reapply filters | Car Listing |
| BUG-008 | Notification badge sometimes stale | Low | Refresh page | Notifications |

### Q4 2025 Feature Gaps (from Status Report)

| Gap | Impact | Planned Fix |
|-----|--------|-------------|
| Payment Integration | Production blocker | Q1 2026 Sprint 1-2 |
| Push Notifications | User engagement | Q1 2026 Sprint 3 |
| SMS Delivery | Phone verification | Q1 2026 |
| Mobile App | Market reach | Q1 2026 Sprint 4-5 |
| 2FA | Security | Q1 2026 |

---

## 🔐 SECURITY TESTING

### Authentication Security

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SEC-001 | SQL injection - login | Enter `' OR 1=1 --` | No injection, error shown |
| SEC-002 | XSS - profile name | Enter `<script>alert(1)</script>` | Sanitized display |
| SEC-003 | CSRF protection | Forge cross-site request | Request rejected |
| SEC-004 | Brute force login | 10+ failed attempts | Rate limited/locked |
| SEC-005 | Password in URL | Check URLs for passwords | Never exposed |
| SEC-006 | Session hijacking | Copy session token | Token validation |
| SEC-007 | Logout invalidation | Logout and reuse token | Token rejected |

### Authorization Security

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SEC-008 | Access other's booking | Modify URL to other's booking ID | Access denied |
| SEC-009 | Access other's wallet | Direct API call to other's wallet | Access denied |
| SEC-010 | Access other's messages | Direct API to other's messages | Access denied |
| SEC-011 | Admin route as user | Access /admin as regular user | Access denied |
| SEC-012 | SuperAdmin route as admin | Access management as admin | Access denied |
| SEC-013 | Modify other's car | Edit car not owned | Access denied |
| SEC-014 | Delete other's car | Delete car not owned | Access denied |

### Data Security

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SEC-015 | View other's personal data | API call for other user's profile | Limited data only |
| SEC-016 | View verification documents | Access other's verification docs | Access denied |
| SEC-017 | View license images | Access other's license | Access denied |
| SEC-018 | Export all users | Try to export user list | Admin only or denied |

---

## ⚡ PERFORMANCE TESTING

### Page Load Performance

| Test ID | Page | Target | Measurement |
|---------|------|--------|-------------|
| PERF-001 | Home page | <2s | Time to interactive |
| PERF-002 | Car listing | <2s | First contentful paint |
| PERF-003 | Car details | <2s | Images load |
| PERF-004 | Dashboard | <3s | Data populated |
| PERF-005 | Messages | <2s | Conversations load |
| PERF-006 | Map | <3s | Map renders |
| PERF-007 | Admin dashboard | <3s | Stats load |

### Scalability Tests

| Test ID | Scenario | Volume | Expected |
|---------|----------|--------|----------|
| PERF-008 | Car listing pagination | 1000 cars | Smooth scrolling |
| PERF-009 | Booking history | 500 bookings | Pagination works |
| PERF-010 | Message history | 1000 messages | Lazy loads |
| PERF-011 | Notification list | 500 notifications | Pagination |
| PERF-012 | Admin user list | 10000 users | Search/filter works |

### API Performance

| Test ID | Endpoint | Target | Method |
|---------|----------|--------|--------|
| PERF-013 | Cars list | <500ms | GET |
| PERF-014 | Create booking | <1s | POST |
| PERF-015 | Send message | <300ms | POST |
| PERF-016 | Upload image | <5s | POST |
| PERF-017 | Wallet balance | <300ms | GET |

---

## 📱 MOBILE RESPONSIVENESS TESTING

### Breakpoints to Test

| Breakpoint | Width | Device Example |
|------------|-------|----------------|
| xs | 320px | iPhone SE |
| sm | 375px | iPhone 12 Mini |
| md | 768px | iPad |
| lg | 1024px | iPad Pro |
| xl | 1280px+ | Desktop |

### Mobile-Specific Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MOB-001 | Bottom navigation visible | View on mobile | Nav bar at bottom |
| MOB-002 | Touch targets | Tap buttons | Large enough (44px) |
| MOB-003 | Horizontal scroll | Check all pages | No horizontal scroll |
| MOB-004 | Form inputs | Fill forms | Keyboard doesn't obscure |
| MOB-005 | Image scaling | View car images | Images fit screen |
| MOB-006 | Modal dialogs | Open dialogs | Full screen on mobile |
| MOB-007 | Table responsiveness | View tables | Cards on mobile |
| MOB-008 | Map touch | Pan/zoom map | Touch gestures work |
| MOB-009 | Swipe actions | Swipe notifications | Swipe gestures work |
| MOB-010 | Portrait/Landscape | Rotate device | Layout adapts |

---

## ♿ ACCESSIBILITY TESTING

### WCAG 2.1 Compliance

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| A11Y-001 | Keyboard navigation | Tab through page | All interactive elements reachable |
| A11Y-002 | Screen reader | Use VoiceOver/NVDA | Content announced correctly |
| A11Y-003 | Focus indicators | Tab through | Clear focus visible |
| A11Y-004 | Color contrast | Check text/bg | 4.5:1 ratio minimum |
| A11Y-005 | Alt text | Check images | All images have alt |
| A11Y-006 | Form labels | Check forms | All inputs labeled |
| A11Y-007 | Error messages | Trigger errors | Errors announced |
| A11Y-008 | Skip links | Tab from top | Skip to content works |
| A11Y-009 | Heading hierarchy | Check headings | Logical H1-H6 |
| A11Y-010 | ARIA labels | Interactive elements | Proper ARIA attributes |

---

## ✅ TEST SIGN-OFF CHECKLIST

### Phase 1 Sign-Off (Internal Team)

| Category | Tester | Status | Date | Notes |
|----------|--------|--------|------|-------|
| Authentication | Kelvin, Loago, Pearl | ✅ Pass (9/10) | Feb 2026 | AUTH-009 fail (MOB-210) |
| Verification | Kelvin, Loago | ✅ Pass (8/10) | Feb 2026 | VER-006/007 blocked (OTP mock) |
| Vehicle Management | Kelvin, Loago, Pearl | ✅ Pass (11/12) | Feb 2026 | CAR-003 fail (MOB-225) |
| Booking System | Kelvin, Loago, Pearl | ⚠️ Partial (15/19) | Feb 2026 | BOOK-003 blocked, BOOK-009/019 fail |
| Wallet | Kelvin, Loago | ⚠️ Partial (4/10) | Feb 2026 | Host wallet untested (WALL-005–010) |
| Messaging | Kelvin, Loago, Pearl | ⚠️ Partial (4/8) | Feb 2026 | MSG-005 fail (MOB-201), MSG-006/008 blocked |
| Handover | Loago, Arnold | ❌ Fails (5 fails) | Feb 2026 | HAND-011–015 fail, no host-side testing |
| Reviews | Arnold | ❌ Fails (2/3) | Feb 2026 | REV-001/004 fail (MOB-204/205) |
| Navigation | All | ✅ Pass | Feb 2026 | Core navigation verified |
| Notifications | Loago, Arnold | ⚠️ Partial (7/10) | Feb 2026 | NOTIF-003/008/009 fail |
| Admin Dashboard | Arnold, Teboho | ⚠️ Partial (10/18) | Feb 2026 | ADM-002/014/017/018 blocked/fail |
| Insurance | Arnold, Loago | ⚠️ Partial (8/15) | Feb 2026 | INS-001/009/011/013/015 fail |
| Promo Codes | Arnold | ✅ Pass (5/5) | Feb 2026 | Single tester — needs validation |
| Route Audit | All | ✅ Pass | Feb 2026 | No 404 errors found |
| Edge Cases | All | ⚠️ Partial | Feb 2026 | Ongoing |

### Phase 2 Sign-Off (UAT — Business Testers)

| Journey | Tester | Status | Date | Notes |
|---------|--------|--------|------|-------|
| New Renter Flow | Kelvin, Pearl | ✅ Pass | Feb 2026 | Core renter journey verified |
| Host Listing Flow | Kelvin, Loago | ✅ Pass | Feb 2026 | Car creation/editing working |
| Booking & Handover | Loago | ⚠️ Partial | Feb 2026 | Booking OK, handover has critical failures |
| Complete Rental | Loago | ❌ Blocked | Feb 2026 | Return handover broken (MOB-202) |
| Admin Verification | Arnold | ⚠️ Partial | Feb 2026 | Stats/capabilities broken |
| SuperAdmin Flow | Teboho | ✅ Pass | Feb 2026 | Basic admin ops verified |
| Insurance Claim | Arnold, Loago | ⚠️ Partial | Feb 2026 | Visibility issues (MOB-207/208) |

### Phase 3 Sign-Off (Round 2 Re-Test) — 📋 Planned

| Area | Tester | Status | Date | Notes |
|------|--------|--------|------|-------|
| MSG-005 re-test | Kelvin, Pearl | 📋 Pending | Mar 2026 | After fix deployed |
| Host wallet flows | Kelvin | 📋 Pending | Mar 2026 | WALL-005–010 |
| Handover (host-side) | Loago | 📋 Pending | Mar 2026 | Full dual-party test |
| Admin re-test | Teboho | 📋 Pending | Mar 2026 | ADM blocked items |
| Reviews (renter) | Arnold | 📋 Pending | Mar 2026 | REV-001–008 |
| Remaining renter tests | Pearl | 📋 Pending | Mar 2026 | Increase from 36% |
| Promo codes validation | Kelvin | 📋 Pending | Mar 2026 | Second tester confirmation |

### Final Sign-Off

| Requirement | Owner | Status | Date | Notes |
|-------------|-------|--------|------|-------|
| Zero Critical Bugs | Arnold | ❌ 1 critical (MOB-202) | — | HAND-011 return handover |
| <5 High Priority Bugs | Arnold | ❌ 5 high-priority | — | MOB-201/203/204/210 |
| All Routes Accessible | Duma | ✅ Pass | Feb 2026 | No 404 errors |
| Security Tests Passed | Arnold | ⬜ Pending | — | Awaiting Phase 3 |
| Performance Targets Met | Tebogo | ⬜ Pending | — | Awaiting Phase 4 |
| UX Approved | Oratile | ⬜ Pending | — | Awaiting Round 2 |

---

## 📋 APPENDIX: TEST CASE TEMPLATES

### Bug Report Template (Detailed)

```markdown
## Bug Report

**Bug ID:** BUG-YYYY-MM-XXX
**Title:** [Short descriptive title]
**Reporter:** [Name]
**Date Reported:** [YYYY-MM-DD]
**Module:** [Module name]
**Severity:** [Critical/High/Medium/Low]
**Priority:** [P0/P1/P2/P3]
**Status:** [New/Assigned/In Progress/Fixed/Verified/Closed/Won't Fix]

### Environment
- **Browser:** 
- **OS:** 
- **Device:** 
- **User Role:** 
- **Test Account:** 

### Description
[Detailed description of the issue]

### Steps to Reproduce
1. 
2. 
3. 

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Screenshots/Video
[Attach or link media]

### Console Logs
```
[Console output]
```

### Network Requests
[Relevant API calls and responses]

### Additional Context
[Any other relevant information]

### Assigned To
[Developer name]

### Fix Notes
[Notes about the fix when resolved]

### Verification
- **Verified By:** 
- **Verification Date:** 
- **Verification Notes:** 
```

### Test Case Template

```markdown
## Test Case

**Test ID:** [MODULE]-XXX
**Title:** [Test case title]
**Module:** [Module name]
**Priority:** [Critical/High/Medium/Low]
**Type:** [Unit/Integration/E2E/Regression]

### Preconditions
- [Required setup]
- [User state]
- [Data requirements]

### Test Steps
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | | |
| 2 | | |
| 3 | | |

### Test Data
- [Required test data]

### Expected Results
[Overall expected outcome]

### Actual Results
[Fill during execution]

### Status
- [ ] Pass
- [ ] Fail
- [ ] Blocked
- [ ] Skipped

### Notes
[Execution notes]

### Executed By
**Tester:** 
**Date:** 
**Environment:** 
```

---

## 📞 CONTACT & ESCALATION

### Testing Escalation Path

1. **First Line:** Report in `#testing` Slack channel
2. **Triage:** Arnold reviews and assigns
3. **Escalation:** If no response in 4 hours (critical) or 24 hours (high), escalate to Loago
4. **Emergency:** Direct message Arnold + Loago for production-blocking issues

### Key Contacts

| Role | Name | Slack Handle |
|------|------|--------------|
| Testing Lead | Arnold | @arnold |
| QA Support | Duma | @duma |
| QA Support | Tebogo | @tebogo |
| Chief of Staff | Loago | @loago |
| Customer Success | Pearl | @pearl |
| Community Lead | Oratile | @oratile |

---

**Document Prepared By:** Arnold (Technical Lead)  
**Document Date:** January 5, 2026  
**Last Updated:** March 2, 2026 (v2.0.0 — added execution results, coverage status, Round 2 plan)  
**Next Review:** March 7, 2026 (End of Phase 3 bug fixes)  
**Distribution:** Technical Team, Business Stakeholders, Beta Coordinators

### Related Documents

| Document | Purpose |
|----------|---------|
| [TESTING_COVERAGE_STATUS_2026_03_02.md](./TESTING_COVERAGE_STATUS_2026_03_02.md) | Consolidated test results, bug registry (MOB-201–225), Round 2 assignments |
| [HOTFIX_ADMIN_PORTAL_2026_02_24.md](../hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md) | Active hotfix tracker (MOB-101–138) |
| [ANONYMIZE_ON_DELETE_2026_03_02.md](../plans/ANONYMIZE_ON_DELETE_2026_03_02.md) | User deletion anonymization plan (MOB-130–138) |

---

*This document serves as the comprehensive testing protocol for MobiRides v2.5.0 pre-launch validation. All team members should reference this document and the linked coverage report for test execution, bug tracking, and reporting procedures.*
