# MobiRides Testing Coverage Status Report

**Date:** 2026-03-02  
**Protocol Reference:** [PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md](./PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md)  
**Hotfix Reference:** [HOTFIX_ADMIN_PORTAL_2026_02_24.md](../hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md)  
**Anonymize-on-Delete Plan:** [ANONYMIZE_ON_DELETE_2026_03_02.md](../plans/ANONYMIZE_ON_DELETE_2026_03_02.md)

---

## 1. Tester Progress Summary

| Tester | Passed | Failed | Blocked | Not Run | Execution % | Role Focus |
|--------|--------|--------|---------|---------|-------------|------------|
| Arnold | 13 | 0 | 2 | ~182 | 89.8% | Admin/Host (partial results, many Not Run) |
| Kelvin | 69 | 0 | 0 | ~128 | 71.1% | Renter/Host (comprehensive, all pass) |
| Loago | 106 | 11 | 4 | ~76 | 87.8% | Renter/Host/Admin (most complete, most bugs found) |
| Pearl | 52 | 1 | 0 | ~144 | 36% | Renter (partial coverage) |
| Teboho | 31 | 0 | 0 | ~166 | 20.8% | SuperAdmin (limited scope) |

**Totals (deduplicated):** ~271 pass, 12 fail, 6 blocked across 197 unique test cases.

### Key Observations
- **Loago** provided the most thorough coverage and surfaced the majority of bugs.
- **Kelvin** had the cleanest pass rate — 69/69 with zero failures.
- **Arnold** focused on Admin/Host but hit many blockers in advanced features (Handover, Maps).
- **Pearl** and **Teboho** had low execution rates and should be prioritized for Round 2.

---

## 2. Consolidated Test Results Matrix

Results use a "worst-case" rule: if any tester failed a test, it is marked **Fail**. If all who ran it passed, it is **Pass**. Discrepancies are noted.

### Authentication (AUTH)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| AUTH-001 | Login with valid credentials | ✅ Pass | Kelvin, Loago, Pearl | — |
| AUTH-002 | Login with invalid credentials | ✅ Pass | Kelvin, Loago, Pearl | — |
| AUTH-003 | Login with empty fields | ✅ Pass | Kelvin, Loago, Pearl | — |
| AUTH-004 | Forgot password | ✅ Pass | Kelvin, Loago | — |
| AUTH-005 | Reset password | ✅ Pass | Kelvin, Loago | — |
| AUTH-006 | Logout | ✅ Pass | Kelvin, Loago, Pearl | — |
| AUTH-007 | Protected route redirect | ✅ Pass | Kelvin, Loago | — |
| AUTH-008 | Session persistence | ✅ Pass | Kelvin, Loago | — |
| AUTH-009 | Signup with valid data | ❌ Fail | Loago (fail) | Signup flow broken for some users |
| AUTH-010 | Signup validation | ✅ Pass | Kelvin, Pearl | — |

### Car Management (CAR)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| CAR-001 | Browse car listings | ✅ Pass | Kelvin, Loago, Pearl | — |
| CAR-002 | View car details | ✅ Pass | Kelvin, Loago, Pearl | — |
| CAR-003 | Filter by location | ❌ Fail | Arnold (fail) | Location filter not working |
| CAR-004 | Filter by brand | ✅ Pass | Kelvin, Loago | — |
| CAR-005 | Filter by price | ✅ Pass | Kelvin, Loago | — |
| CAR-006 | Filter by vehicle type | ✅ Pass | Kelvin, Loago | — |
| CAR-007 | Save car | ✅ Pass | Kelvin, Loago, Pearl | — |
| CAR-008 | Unsave car | ✅ Pass | Kelvin, Loago | — |
| CAR-009 | Host: Create car | ✅ Pass | Kelvin, Loago | — |
| CAR-010 | Host: Edit car | ✅ Pass | Kelvin, Loago | — |
| CAR-011 | Host: Upload images | ✅ Pass | Kelvin, Loago | — |
| CAR-012 | Host: Set availability | ✅ Pass | Kelvin, Loago | — |

### Messaging (MSG)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| MSG-001 | View conversations | ✅ Pass | Kelvin, Loago, Pearl | — |
| MSG-002 | Send text message | ✅ Pass | Kelvin, Loago, Pearl | — |
| MSG-003 | Receive message | ✅ Pass | Kelvin, Loago | — |
| MSG-004 | Real-time delivery | ✅ Pass | Kelvin, Loago | — |
| MSG-005 | Mark as read | ❌ Fail | Kelvin, Loago (fail), Pearl (in-progress) | **HIGH PRIORITY** — Unread badge persists; confirmed by 3 testers |
| MSG-006 | Send image | 🚫 Blocked | Arnold | Works locally, fails in production |
| MSG-007 | Start new conversation | ❌ Fail | Loago (fail) | Cannot start conversation from car page |
| MSG-008 | Search conversations | 🚫 Blocked | Arnold | Search feature blocked |

### Bookings (BOOK)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| BOOK-001 | View available dates | ✅ Pass | Kelvin, Loago, Pearl | — |
| BOOK-002 | Select dates | ✅ Pass | Kelvin, Loago, Pearl | — |
| BOOK-003 | Select times | 🚫 Blocked | Arnold | Time picker blocked |
| BOOK-004 | Create booking | ✅ Pass | Kelvin, Loago, Pearl | — |
| BOOK-005 | View booking details | ✅ Pass | Kelvin, Loago, Pearl | — |
| BOOK-006 | Cancel booking | ✅ Pass | Kelvin, Loago | — |
| BOOK-007 | Host: Approve booking | ✅ Pass | Kelvin, Loago | — |
| BOOK-008 | Host: Decline booking | ✅ Pass | Kelvin, Loago | — |
| BOOK-009 | Set pickup location | ❌ Fail | Loago (fail) | Map location selection fails |
| BOOK-010–018 | Various booking flows | ✅ Pass | Kelvin, Loago | — |
| BOOK-019 | Booking extension request | ❌ Fail | Arnold (blocked), Loago (fail) | Extension feature not functional |

### Wallet (WALL)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| WALL-001 | View wallet balance | ✅ Pass | Kelvin, Loago | — |
| WALL-002 | View transaction history | ❌ Fail | Loago (fail) | Transaction history fails to load |
| WALL-003 | Filter transactions | 🚫 Blocked | Loago | Filter options blocked |
| WALL-004 | Top-up wallet | ✅ Pass | Kelvin | — |
| WALL-005–010 | Host wallet operations | ⚪ Not Run | — | No tester coverage |

### Handover (HAND)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| HAND-001 | Start handover | ✅ Pass | Loago | Renter side only |
| HAND-002 | Identity verify | 🚫 Blocked | Arnold | Identity step blocked |
| HAND-003–005 | Vehicle inspection steps | ✅ Pass | Loago | Renter side only |
| HAND-006 | Fuel level | 🚫 Blocked | Arnold | Fuel recording blocked |
| HAND-007–010 | Various handover steps | ✅ Pass | Loago | Renter side only |
| HAND-011 | Return handover | ❌ Fail | Loago (fail) | **CRITICAL** — Return flow broken |
| HAND-012 | GPS location tracking | ❌ Fail | Arnold (fail), Loago (blocked) | GPS tracking not working |
| HAND-013 | Real-time status sync | ❌ Fail | Arnold (fail), Loago (blocked) | Real-time sync between parties broken |
| HAND-014 | Handover notifications | ❌ Fail | Loago (fail) | Notifications not sent after handover |
| HAND-015 | Resume interrupted | ❌ Fail | Arnold (fail) | State not preserved after disconnect |

### Reviews (REV)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| REV-001 | Leave car review | ❌ Fail | Arnold (fail) | Review submission fails |
| REV-002 | View reviews | ✅ Pass | Loago | — |
| REV-003 | Category ratings | ⚪ Not Run | — | — |
| REV-004 | Host response | ❌ Fail | Arnold (fail) | Host cannot respond to reviews |
| REV-005–008 | Other review flows | ⚪ Not Run | — | — |

### Notifications (NOTIF)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| NOTIF-001 | View notifications | ✅ Pass | Loago, Arnold | — |
| NOTIF-002 | Booking notification | ✅ Pass | Loago | — |
| NOTIF-003 | Mark as read | ❌ Fail | Loago (fail) | Notification mark-as-read fails |
| NOTIF-004–007 | Various notification types | ✅ Pass | Loago | — |
| NOTIF-008 | Handover notification | ❌ Fail | Loago (fail) | Handover notifications not in Active tab |
| NOTIF-009 | Notification preferences | ❌ Fail | Arnold (fail) | Preferences not saving |
| NOTIF-010 | Delete notification | ✅ Pass | Loago | — |

### Verification (VER)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| VER-001–005 | Basic verification steps | ✅ Pass | Kelvin, Loago | — |
| VER-006 | OTP validation | 🚫 Blocked | Arnold | OTP mock not functional |
| VER-007 | OTP resend | 🚫 Blocked | Arnold | OTP mock not functional |
| VER-008–010 | License verification | ✅ Pass | Kelvin, Loago | — |

### Admin (ADM)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| ADM-001 | Admin login | ✅ Pass | Arnold, Teboho | — |
| ADM-002 | View statistics | 🚫 Blocked | Arnold | Dashboard stats broken — see MOB-101/102/103 |
| ADM-003–013 | User/car/booking mgmt | ✅ Pass | Arnold, Teboho (partial) | — |
| ADM-014 | View audit logs | ❌ Fail | Arnold (fail) | Audit logs not displaying |
| ADM-015–016 | Admin user management | ✅ Pass | Teboho | — |
| ADM-017 | Assign capabilities | 🚫 Blocked | Arnold | Capability assignment broken — see MOB-105/106 |
| ADM-018 | Revoke admin | 🚫 Blocked | Arnold | Admin revocation broken — see MOB-105/106 |

### Maps (MAP)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| MAP-001 | View map | ✅ Pass | Kelvin, Loago | — |
| MAP-002 | Current location | ❌ Fail | Arnold (fail) | Geolocation centering fails |
| MAP-003 | Search location | ❌ Fail | Arnold (fail) | Location search fails |
| MAP-004–006 | Basic map interaction | ✅ Pass | Loago | — |
| MAP-007 | Turn-by-turn nav | ❌ Fail | Arnold (fail) | Voice guidance not working |
| MAP-008 | Off-route detection | ❌ Fail | Arnold (fail) | Rerouting not triggered |
| MAP-009 | Traffic layer | ❌ Fail | Arnold (fail) | Traffic layer fails |
| MAP-010 | Share ETA | ❌ Fail | Arnold (fail) | Share dialog fails |

### Insurance (INS)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| INS-001 | View packages | ❌ Fail | Loago (fail) | Package text not visible |
| INS-002–008 | Insurance selection/policy | ✅ Pass | Arnold, Loago (partial) | — |
| INS-009 | Claim: Evidence upload | ❌ Fail | Arnold (fail) | UX issue — doesn't navigate to upload page |
| INS-010 | Submit claim | ✅ Pass | Arnold | — |
| INS-011 | View claim status | ❌ Fail | Loago (fail) | Claim status not visible |
| INS-012 | Admin: View claims | ✅ Pass | Arnold | — |
| INS-013 | Admin: Approve claim | ❌ Fail | Arnold (fail) | No payout processing visibility |
| INS-014 | Admin: Reject claim | ✅ Pass | Arnold | — |
| INS-015 | Admin: Request info | ❌ Fail | Arnold (fail) | No "request more info" option exists |

### Promo Codes (PROMO)

| Test ID | Test Case | Result | Testers | Notes |
|---------|-----------|--------|---------|-------|
| PROMO-001–005 | All promo code tests | ✅ Pass | Arnold | Single tester only — needs validation |

---

## 3. Confirmed Bug Registry

### Bugs Already Tracked in Hotfix

| Test ID | Bug | Hotfix Ticket | Status |
|---------|-----|---------------|--------|
| ADM-002 | Dashboard stats broken | MOB-101, MOB-102, MOB-103 | In hotfix backlog |
| ADM-017/018 | Admin capability assign/revoke broken | MOB-105, MOB-106 | In hotfix backlog |
| — | Avatar/image display issues | MOB-118 through MOB-126 | In hotfix backlog |
| — | User deletion failures | MOB-110, MOB-130 through MOB-138 | Anonymize-on-delete plan created |

### NEW Bugs — Not Yet in Hotfix (Require New MOB Tickets)

| Ticket | Test ID | Bug Description | Severity | Confirmed By |
|--------|---------|-----------------|----------|--------------|
| **MOB-201** | MSG-005 | Mark-as-read badge persists after reading messages | 🔴 High | Kelvin, Loago, Pearl (3 testers) |
| **MOB-202** | HAND-011 | Return handover flow completely broken | 🔴 Critical | Loago |
| **MOB-203** | HAND-012/013 | GPS location tracking + real-time status sync broken | 🔴 High | Arnold, Loago |
| **MOB-204** | REV-001 | Review submission fails | 🔴 High | Arnold |
| **MOB-205** | REV-004 | Host cannot respond to reviews | 🟡 Medium | Arnold |
| **MOB-206** | BOOK-019 | Booking extension request not functional | 🟡 Medium | Arnold, Loago |
| **MOB-207** | INS-001 | Insurance package text not visible | 🟡 Medium | Loago |
| **MOB-208** | INS-011 | Claim status not visible to renter | 🟡 Medium | Loago |
| **MOB-209** | INS-015 | No "request more info" admin action on claims | 🟢 Low | Arnold (feature gap) |
| **MOB-210** | AUTH-009 | Signup flow broken for some users | 🔴 High | Loago |
| **MOB-211** | MSG-007 | Cannot start new conversation from car page | 🟡 Medium | Loago |
| **MOB-212** | BOOK-009 | Map location selection fails during booking | 🟡 Medium | Loago |
| **MOB-213** | WALL-002 | Transaction history fails to load | 🟡 Medium | Loago |
| **MOB-214** | HAND-014 | Handover notifications not sent | 🟡 Medium | Loago |
| **MOB-215** | HAND-015 | Handover state not preserved after disconnect | 🟡 Medium | Arnold |
| **MOB-216** | NOTIF-003 | Notification mark-as-read fails | 🟡 Medium | Loago |
| **MOB-217** | NOTIF-008 | Handover notifications not in Active Rentals tab | 🟡 Medium | Loago |
| **MOB-218** | NOTIF-009 | Notification preferences not saving | 🟡 Medium | Arnold |
| **MOB-219** | ADM-014 | Audit logs not displaying | 🟡 Medium | Arnold |
| **MOB-220** | MAP-002 | Geolocation centering fails | 🟡 Medium | Arnold |
| **MOB-221** | MAP-003 | Location search fails | 🟡 Medium | Arnold |
| **MOB-222** | MAP-007/008/009/010 | Advanced map features (nav, reroute, traffic, ETA) broken | 🟢 Low | Arnold |
| **MOB-223** | INS-009 | Evidence upload UX — no immediate navigation | 🟢 Low | Arnold |
| **MOB-224** | INS-013 | No payout processing visibility for admin claims | 🟢 Low | Arnold |
| **MOB-225** | CAR-003 | Car filter by location not working | 🟡 Medium | Arnold |

---

## 4. Blocked Test Analysis

| Test ID | Feature | Blocked By | Root Cause | Unblock Action |
|---------|---------|------------|------------|----------------|
| VER-006/007 | OTP validation | OTP mock | Mock service not returning valid OTP in test env | Fix OTP mock or provide test bypass |
| BOOK-003 | Time picker | UI component | Time selector not rendering/interactive | Debug TimePicker component |
| MSG-006 | Image sending | Prod environment | Storage bucket CORS or permissions in production | Check Supabase storage CORS config |
| MSG-008 | Conversation search | Feature incomplete | Search UI exists but query logic not wired | Implement search query in `useConversations` |
| HAND-002 | Identity verification | Step dependency | Identity step not progressing in handover flow | Debug `HandoverIdentityStep` component |
| HAND-006 | Fuel level recording | Step dependency | Fuel input not accepting values | Debug `HandoverFuelStep` component |
| WALL-003 | Transaction filter | UI component | Filter dropdown not rendering options | Debug `WalletTransactionFilter` component |

---

## 5. Coverage Gaps

### By Module

| Module | Test Cases | Executed | Coverage | Gap |
|--------|-----------|----------|----------|-----|
| Authentication (AUTH) | 10 | 10 | 100% | ✅ Complete |
| Car Management (CAR) | 12 | 12 | 100% | ✅ Complete |
| Messaging (MSG) | 8 | 6 | 75% | 2 blocked |
| Bookings (BOOK) | 19 | 17 | 89% | 1 blocked, 1 fail |
| Wallet (WALL) | 10 | 4 | 40% | **Host wallet untested (6 cases)** |
| Handover (HAND) | 15 | 13 | 87% | **No host-side testing, no dual-party testing** |
| Reviews (REV) | 8 | 3 | 38% | **5 cases untested, 2 fails** |
| Notifications (NOTIF) | 10 | 8 | 80% | 2 gaps |
| Verification (VER) | 10 | 8 | 80% | 2 OTP blocked |
| Admin (ADM) | 18 | 14 | 78% | **Single tester, 4 blocked/failed** |
| Maps (MAP) | 10 | 10 | 100% | 6 fails — advanced features broken |
| Insurance (INS) | 15 | 13 | 87% | Admin flows incomplete |
| Promo Codes (PROMO) | 5 | 5 | 100% | Single tester — needs validation |

### By Role

| Role | Testers | Coverage Quality |
|------|---------|-----------------|
| Renter | Kelvin, Loago, Pearl | ✅ Good — core flows well covered |
| Host | Kelvin, Loago | ⚠️ Partial — wallet, handover host-side missing |
| Admin | Arnold | ❌ Single tester, many blockers |
| SuperAdmin | Teboho | ⚠️ Limited — only basic admin ops tested |

---

## 6. Recommended Round 2 Test Assignments

### Priority 1: Critical Bug Re-tests (After Fixes)

| Tester | Assignment | Tests |
|--------|-----------|-------|
| Kelvin | Re-test MSG-005 mark-as-read after fix | MSG-005 |
| Loago | Re-test HAND-011 return handover after fix | HAND-011, HAND-014 |
| Pearl | Re-test MSG-005 + complete remaining renter tests | MSG-005 + unexecuted renter cases |

### Priority 2: Coverage Gap Filling

| Tester | Assignment | Tests | Reason |
|--------|-----------|-------|--------|
| **Kelvin** | Host wallet operations | WALL-004 through WALL-010 | Zero coverage on host wallet |
| **Pearl** | Complete renter journey | All unexecuted renter tests | Only 36% execution |
| **Teboho** | Full SuperAdmin + Admin flows | ADM-002 through ADM-018 | Only 20.8% execution, single admin tester |
| **Loago** | Host-side handover | HAND-001 through HAND-015 (as host) | Only renter-side tested |
| **Arnold** | Reviews (renter perspective) | REV-001 through REV-008 | Only host review tested |

### Priority 3: Cross-Validation

| Tester | Assignment | Reason |
|--------|-----------|--------|
| **Kelvin** | Promo codes | Validate Arnold's solo passes |
| **Pearl** | Insurance renter flows | Second tester validation |
| **Teboho** | Admin audit logs, capabilities | Validate Arnold's admin failures |

---

## 7. Fix Priority Order

Based on severity, user impact, and number of testers confirming:

| Priority | Ticket | Bug | Rationale |
|----------|--------|-----|-----------|
| 1 | MOB-202 | Return handover broken | Critical — blocks rental completion |
| 2 | MOB-201 | Mark-as-read badge persists | High — 3 testers, affects all messaging |
| 3 | MOB-210 | Signup broken for some users | High — blocks new user acquisition |
| 4 | MOB-203 | GPS + real-time sync broken | High — blocks handover coordination |
| 5 | MOB-204 | Review submission fails | High — blocks post-rental feedback |
| 6 | MOB-213 | Transaction history fails | Medium — host wallet visibility |
| 7 | MOB-206 | Booking extension broken | Medium — feature gap |
| 8 | MOB-207/208 | Insurance visibility issues | Medium — renter confusion |
| 9 | MOB-216/217/218 | Notification issues cluster | Medium — mark-as-read, preferences |
| 10 | MOB-222 | Advanced map features | Low — non-essential features |

---

## Appendix: Links

- **Testing Protocol:** [PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md](./PRE_LAUNCH_TESTING_PROTOCOL_2026-01-05.md)
- **Hotfix Document:** [HOTFIX_ADMIN_PORTAL_2026_02_24.md](../hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md)
- **Anonymize-on-Delete Plan:** [ANONYMIZE_ON_DELETE_2026_03_02.md](../plans/ANONYMIZE_ON_DELETE_2026_03_02.md)
- **Tester Sheets:** Arnold, Kelvin, Loago, Pearl, Teboho (uploaded 2026-03-02)
