# UI/Display Issues - February 2, 2026

**Last Updated:** March 2, 2026  
**Version:** 1.1

## Related Documents

| Document | Relationship |
|----------|-------------|
| [HOTFIX_ADMIN_PORTAL_2026_02_24.md](hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md) | Issues 1, 5, 6, 7 promoted to MOB-118 through MOB-122 (avatars); Issue 3 color contrast partially covered by MOB-121 audit |
| [TESTING_COVERAGE_STATUS_2026_03_02.md](testing/TESTING_COVERAGE_STATUS_2026_03_02.md) | Round 1 testing identified additional display bugs (MOB-207, MOB-208, MOB-209) |

---

## Overview

This document catalogs all identified UI/display issues across the MobiRides application requiring resolution before production release.

---

## Issue 1: User Avatars Not Displaying

### Description
User avatars fail to render across multiple modules due to inconsistent URL handling. Components receive raw storage paths but don't convert them to public Supabase URLs.

### Affected Components

| Component | Location | Issue |
|-----------|----------|-------|
| `CarOwner.tsx` | Car details page | Raw `avatarUrl` prop not converted |
| `HostBookingCard.tsx` | Host bookings | Uses raw `booking.renter?.avatar_url` |
| `RenterBookingCard.tsx` | Renter bookings | Missing host avatar display |
| `ConversationRow.tsx` | Messenger inbox | Raw `avatar` prop used directly |
| `ChatHeader.tsx` | Chat view | May receive unconverted paths |
| Host sidebar on Maps | Map view | Host avatars not displaying |

### Solution
Create centralized `src/utils/avatarUtils.ts` utility:

```typescript
export const getAvatarPublicUrl = (avatarPath: string | null | undefined): string => {
  if (!avatarPath) return "/placeholder-avatar.svg";
  if (avatarPath.startsWith("http")) return avatarPath;
  return supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl;
};
```

### Tasks

| ID | Task | Points | Hotfix Ticket | Status |
|----|------|--------|---------------|--------|
| UI-001 | Create `avatarUtils.ts` utility | 1 | MOB-118 | 🟡 Pending |
| UI-002 | Fix CarOwner.tsx avatar display | 1 | MOB-120 | 🟡 Pending |
| UI-003 | Fix HostBookingCard.tsx avatar | 1 | MOB-119 | 🟡 Pending |
| UI-004 | Fix RenterBookingCard.tsx - add host avatar | 1 | MOB-121 | 🟡 Pending |
| UI-005 | Fix ConversationRow.tsx avatar | 1 | MOB-121 | 🟡 Pending |
| UI-006 | Fix ChatHeader.tsx avatar | 1 | MOB-121 | 🟡 Pending |
| UI-007 | Fix Maps host sidebar avatars | 1 | MOB-121 | 🟡 Pending |

---

## Issue 2: Mobile Tab Overflow - Icon-Based Responsive Tabs

### Description
Tab labels overflow on mobile screens (375px). Instead of text truncation, implement icon-first tabs that expand to show text when selected.

### Affected Pages

| Page | Mode | Current Tabs | Updated Labels |
|------|------|--------------|----------------|
| `HostBookings.tsx` | Host | Active Rentals, Requests, Expired, Past Rentals | **Active**, Requests, Expired, **Past** |
| `RenterDashboard.tsx` | Renter | Active Rentals, Upcoming, Past Rentals | **Active**, Upcoming, **Past** |
| `NotificationsRefactored.tsx` | Both | All, Bookings, Payments, Rentals, System | (keep as-is, add icons) |

### Solution
Create `ResponsiveTabTrigger` component with behavior:
- **Mobile unselected**: Icon only (+ badge if applicable)
- **Mobile selected**: Icon + text label
- **Desktop**: Always icon + text

### Icon Mapping

**Host Bookings:**
| Tab | Icon | Label |
|-----|------|-------|
| active | `Car` | Active |
| pending | `Clock` | Requests |
| expired | `AlertCircle` | Expired |
| completed | `CheckCircle` | Past |

**Renter Dashboard:**
| Tab | Icon | Label |
|-----|------|-------|
| active | `Car` | Active |
| upcoming | `Calendar` | Upcoming |
| past | `History` | Past |

**Notifications:**
| Tab | Icon | Label |
|-----|------|-------|
| all | `Bell` | All |
| bookings | `CalendarDays` | Bookings |
| payments | `Wallet` | Payments |
| rentals | `Car` | Rentals |
| system | `Settings` | System |

### Tasks

| ID | Task | Points | Hotfix Ticket | Status |
|----|------|--------|---------------|--------|
| UI-008 | Create `ResponsiveTabTrigger` component | 3 | — | 🔴 Not started |
| UI-009 | Update HostBookings.tsx tabs | 2 | — | 🔴 Not started |
| UI-010 | Update RenterDashboard.tsx tabs | 2 | — | 🔴 Not started |
| UI-011 | Update NotificationsRefactored.tsx tabs | 2 | — | 🔴 Not started |
| UI-012 | Test responsive behavior on mobile viewports | 1 | — | 🔴 Not started |

---

## Issue 3: Dark/Light Mode Color Contrast

### Description
Hardcoded gray colors (`text-gray-600`, `text-gray-700`, `bg-gray-50`) don't adapt to dark mode, causing text to become invisible or low-contrast.

### Affected Files (55+ identified)

**High Priority:**
| File | Issue |
|------|-------|
| `Login.tsx` | `text-gray-900`, `bg-gray-50` invisible in dark mode |
| `signup.tsx` | Hardcoded gray colors throughout |
| `UnauthenticatedView.tsx` | `text-gray-600` invisible in dark mode |
| `VerificationRequiredDialog.tsx` | `bg-gray-50` on 3 verification step cards (lines 145, 152, 159) — invisible in dark mode |

**Medium Priority:**
| File | Issue |
|------|-------|
| `CarOwner.tsx` | `text-gray-700` on line 109 |
| `HostBookingCard.tsx` | Status badges with hardcoded colors |
| `RenterBookingCard.tsx` | Text color issues |
| Various admin components | Hardcoded grays |

### Color Token Mapping

| Replace | With | Usage |
|---------|------|-------|
| `text-gray-900` | `text-foreground` | Primary text |
| `text-gray-700` | `text-foreground/80` | Secondary emphasis |
| `text-gray-600` | `text-muted-foreground` | Tertiary text |
| `text-gray-500` | `text-muted-foreground/70` | Hints, placeholders |
| `bg-gray-50` | `bg-muted` | Subtle backgrounds |
| `bg-gray-100` | `bg-muted` | Card backgrounds |
| `border-gray-200` | `border-border` | All borders |

### Button Contrast Issues
Some buttons use `text-primary` on `bg-primary` backgrounds. Ensure buttons use `text-primary-foreground` on primary backgrounds.

### Tasks

| ID | Task | Points | Hotfix Ticket | Status |
|----|------|--------|---------------|--------|
| UI-013 | Fix Login.tsx color tokens | 2 | — | 🔴 Not started |
| UI-014 | Fix signup.tsx color tokens | 2 | — | 🔴 Not started |
| UI-015 | Fix UnauthenticatedView.tsx colors | 1 | — | 🔴 Not started |
| UI-016 | Audit and fix remaining files (batch) | 5 | MOB-121 (partial) | 🔴 Not started |
| UI-017 | Fix button contrast issues | 2 | — | 🔴 Not started |

---

## Issue 4: Welcome Page / Auth Flow Duplication

### Description
The PRD requested a splash screen (brief loading with branding), but implementation created a welcome page requiring an extra click to access login. Additionally, there are multiple auth entry points causing confusion.

### Current Auth Entry Points

| Route | Component | Issue |
|-------|-----------|-------|
| `/` | `UnauthenticatedView` | Shows welcome message, requires click to open AuthModal |
| `/login` | `Login.tsx` | Full-page Supabase Auth UI (different styling) |
| `/signup` | `signup.tsx` | Full-page custom SignUpForm |

### Solution
Modify `UnauthenticatedView.tsx` to auto-open `AuthModal` on mount for unauthenticated users. The welcome content becomes a backdrop, not a barrier.

```typescript
// Auto-open modal on mount
useEffect(() => {
  openSignIn();
}, []);
```

### Tasks

| ID | Task | Points | Hotfix Ticket | Status |
|----|------|--------|---------------|--------|
| UI-018 | Auto-open AuthModal in UnauthenticatedView | 2 | — | 🔴 Not started |
| UI-019 | Review/update AuthModal close behavior | 1 | — | 🔴 Not started |
| UI-020 | Consider deprecating /login and /signup routes | 1 | — | 🔴 Not started |

---

## Issue 5: Vehicle Details Avatar Display

### Description
On the vehicle details page, the car owner's avatar doesn't display correctly in the `CarOwner.tsx` component.

### Location
`src/components/car-details/CarOwner.tsx` - lines 100-104

### Solution
Use `getAvatarPublicUrl()` utility (covered in Issue 1, Task UI-002 / MOB-120).

---

## Issue 6: Messenger Avatar Issues

### Description
In the messenger module, user avatars in conversation list and chat headers don't render.

### Affected Components
- `ConversationRow.tsx` - line 48
- `ChatHeader.tsx` - avatar prop handling

### Solution
Apply `getAvatarPublicUrl()` utility (covered in Issue 1, Tasks UI-005 & UI-006 / MOB-121).

---

## Issue 7: Maps Host Sidebar Avatars

### Description
When viewing hosts on the map, the sidebar showing host information doesn't display their avatar correctly.

### Solution
Identify the sidebar component and apply `getAvatarPublicUrl()` utility (covered in Issue 1, Task UI-007 / MOB-121).

---

## Summary

### Total Story Points: 34

| Category | Points | Hotfix Coverage |
|----------|--------|-----------------|
| Avatar Fixes (Issue 1) | 7 | ✅ MOB-118 to MOB-122 |
| Responsive Tabs (Issue 2) | 10 | ❌ Not in hotfix |
| Color Contrast (Issue 3) | 12 | 🟡 Partial (MOB-121 audit covers some) |
| Auth Flow (Issue 4) | 4 | ❌ Not in hotfix |
| Vehicle Details (Issue 5) | (included in Issue 1) | ✅ MOB-120 |
| Messenger (Issue 6) | (included in Issue 1) | ✅ MOB-121 |
| Maps Sidebar (Issue 7) | (included in Issue 1) | ✅ MOB-121 |

### Implementation Status

| Status | Count | Notes |
|--------|-------|-------|
| ✅ Promoted to Hotfix | 7 tasks | Issues 1, 5, 6, 7 → MOB-118 to MOB-122 |
| 🟡 Partially Covered | 1 task | UI-016 partially in MOB-121 audit |
| 🔴 Not Started | 12 tasks | Issues 2, 3 (most), 4 remain unscheduled |

### Priority Order

1. **Critical (Day 1-2):** Auth flow fix, Avatar utility creation
2. **High (Day 3-4):** Apply avatar fixes across all components
3. **Medium (Day 5-7):** Responsive tabs implementation
4. **Medium (Day 8-10):** Color contrast fixes

### Success Criteria

- [ ] All avatars display correctly across all modules
- [ ] Tabs are usable on 375px mobile screens without overflow
- [ ] All text readable in both light and dark modes (WCAG AA)
- [ ] Single, streamlined auth entry experience
- [ ] No duplicate UI patterns for same functionality

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/utils/avatarUtils.ts` | Centralized avatar URL conversion |
| `src/components/ui/responsive-tab-trigger.tsx` | Icon-first responsive tabs |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/car-details/CarOwner.tsx` | Avatar URL handling |
| `src/components/host-bookings/HostBookingCard.tsx` | Avatar + tab labels |
| `src/components/renter-bookings/RenterBookingCard.tsx` | Add host avatar |
| `src/components/chat/ConversationRow.tsx` | Avatar URL handling |
| `src/components/chat/ChatHeader.tsx` | Avatar URL handling |
| `src/pages/HostBookings.tsx` | Responsive tabs, label updates |
| `src/components/dashboard/RenterDashboard.tsx` | Responsive tabs, label updates |
| `src/pages/NotificationsRefactored.tsx` | Responsive tabs |
| `src/components/home/UnauthenticatedView.tsx` | Auto-open AuthModal, fix colors |
| `src/pages/Login.tsx` | Color token fixes |
| `src/pages/signup.tsx` | Color token fixes |
| `src/components/verification/VerificationRequiredDialog.tsx` | `bg-gray-50` → `bg-muted` (3 instances) |
| 50+ additional files | Hardcoded color replacements |
