

# Testing Coverage Update Plan

## Data Summary from 5 Tester Sheets

### Tester Execution Overview

| Tester | Passed | Failed | Blocked | Execution % | Role Focus |
|--------|--------|--------|---------|-------------|------------|
| Arnold | 13 | 0 | 2 | 89.8% | Admin/Host (partial results, many Not Run) |
| Kelvin | 69 | 0 | 0 | 71.1% | Renter/Host (comprehensive, all pass) |
| Loago | 106 | 11 | 4 | 87.8% | Renter/Host/Admin (most complete, many bugs found) |
| Pearl | 52 | 1 | 0 | 36% | Renter (partial coverage) |
| Teboho | 31 | 0 | 0 | 20.8% | SuperAdmin (limited scope) |

**Combined unique test executions:** ~271 pass, 12 fail, 6 blocked across 197 test cases.

### Confirmed Bugs (Failed Tests)

| Test ID | Test Case | Who Failed | Comments |
|---------|-----------|------------|----------|
| AUTH-009 | Signup with valid data | Loago | Signup flow broken for some users |
| CAR-003 | Car filter by location | Arnold | Location filter not working |
| MSG-005 | Mark as read | Kelvin (fail), Loago (fail), Pearl (in-progress) | Unread badge persists after reading messages -- reported by 3 testers |
| MSG-007 | Start new conversation | Loago | Cannot start new conversation from car page |
| BOOK-009 | Set pickup location | Loago | Map location selection fails during booking |
| BOOK-019 | Booking extension request | Arnold (blocked), Loago (fail) | Extension feature not functional |
| WALL-002 | View transaction history | Loago | Transaction history fails to load |
| HAND-011 | Return handover | Loago | Return flow broken |
| HAND-012 | GPS location tracking | Arnold (fail), Loago (blocked) | GPS tracking not working |
| HAND-013 | Real-time status sync | Arnold (fail), Loago (blocked) | Real-time sync between parties broken |
| HAND-014 | Handover notifications | Loago | Notifications not sent after handover |
| HAND-015 | Resume interrupted | Arnold (fail) | State not preserved after disconnect |
| REV-001 | Leave car review | Arnold | Review submission fails |
| REV-004 | Host response | Arnold | Host cannot respond to reviews |
| NOTIF-003 | Mark as read | Loago | Notification mark-as-read fails |
| NOTIF-008 | Handover notification | Loago | Handover notifications not in Active tab |
| NOTIF-009 | Notification preferences | Arnold | Preferences not saving |
| ADM-002 | View statistics | Arnold (blocked) | Dashboard stats broken |
| ADM-014 | View audit logs | Arnold (fail) | Audit logs not displaying |
| ADM-017 | Assign capabilities | Arnold (blocked) | Capability assignment broken |
| ADM-018 | Revoke admin | Arnold (blocked) | Admin revocation broken |
| MAP-002 | Current location | Arnold | Geolocation centering fails |
| MAP-003 | Search location | Arnold | Location search fails |
| MAP-007 | Turn-by-turn nav | Arnold | Voice guidance not working |
| MAP-008 | Off-route detection | Arnold | Rerouting not triggered |
| MAP-009 | Traffic layer | Arnold | Traffic layer fails |
| MAP-010 | Share ETA | Arnold | Share dialog fails |
| INS-001 | View packages | Loago | Package text not visible |
| INS-009 | Claim: Evidence upload | Arnold | Upload UX issue -- doesn't navigate to upload page immediately |
| INS-011 | View claim status | Loago | Claim status not visible |
| INS-013 | Admin: Approve claim | Arnold | No payout processing visibility |
| INS-015 | Admin: Request info | Arnold | No "request more info" option exists |

### Blocked Tests

| Test ID | Test Case | Who | Reason |
|---------|-----------|-----|--------|
| VER-006/007 | OTP validation | Arnold | OTP mock not functional |
| BOOK-003 | Select times | Arnold | Time picker blocked |
| MSG-006 | Send image | Arnold | Works locally but not in prod |
| MSG-008 | Search conversations | Arnold | Search feature blocked |
| HAND-002 | Identity verify | Arnold | Identity step blocked |
| HAND-006 | Fuel level | Arnold | Fuel recording blocked |
| WALL-003 | Filter transactions | Loago | Filter options blocked |

### Untested Modules (0% or near-0% coverage)

| Module | Status | Gap |
|--------|--------|-----|
| Handover (HAND) | Only Loago tested (renter side only) | No host-side testing, no dual-party testing |
| Reviews (REV) | Only Arnold tested (2 fails) | No renter review submission verified |
| Maps (MAP) | Only Arnold + Loago partially | Advanced features untested |
| Notifications (NOTIF) | Arnold + Loago only | Incomplete coverage |
| Admin (ADM) | Arnold only | No second tester validation |
| Insurance (INS) | Arnold + Loago only | Gaps in admin flows |
| Wallet (WALL) | Arnold + Loago only | Most host wallet tests skipped |
| Promo Codes | Arnold only tested (all pass) | No other tester validated |

### Cross-Reference with Known Hotfix Bugs

Several test failures align with bugs already documented in the hotfix:

| Test Failure | Hotfix Reference |
|-------------|-----------------|
| Avatar/image display issues | MOB-118 to MOB-126 (Sections E & F) |
| Admin stats broken (ADM-002) | MOB-101 to MOB-103 (Section A) |
| User deletion failures | MOB-110, MOB-130 to MOB-138 (Section G) |
| Admin capability issues (ADM-017/018) | Related to MOB-105/106 |

### New Bugs NOT Yet in Hotfix

| Test ID | Bug | Severity |
|---------|-----|----------|
| MSG-005 | Mark-as-read badge persists (3 testers confirm) | High |
| HAND-011 | Return handover flow broken | Critical |
| HAND-012/013 | GPS + real-time sync broken | High |
| REV-001 | Review submission fails | High |
| REV-004 | Host review response fails | Medium |
| BOOK-019 | Booking extension not functional | Medium |
| INS-001 | Insurance package text not visible | Medium |
| INS-011 | Claim status not visible | Medium |
| INS-015 | No "request more info" admin action | Low (feature gap) |

---

## Plan: Create Updated Testing Status Document

Create `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md` containing:

1. **Tester Progress Summary** -- table of each tester's KPIs
2. **Consolidated Test Results Matrix** -- per-test-ID best-result across all testers (pass if anyone passed, fail if anyone failed, noting discrepancies)
3. **Confirmed Bug Registry** -- all failed tests with cross-references to hotfix MOB tickets where applicable, and NEW tickets for unfixed bugs
4. **Blocked Test Analysis** -- root causes and unblock actions
5. **Coverage Gaps** -- modules/roles with insufficient testing, specific re-test assignments
6. **Recommended Round 2 Test Assignments** -- who should cover what gaps
7. **Link to hotfix document** for bugs already tracked

This will be a single new file. No code changes.

### Files to Create

| File | Purpose |
|------|---------|
| `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md` | Consolidated testing status with bug registry, coverage gaps, and re-test plan |

