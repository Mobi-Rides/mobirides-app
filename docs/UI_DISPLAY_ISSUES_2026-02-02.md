# UI/Display Issues - February 2, 2026

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

| ID | Task | Points |
|----|------|--------|
| UI-001 | Create `avatarUtils.ts` utility | 1 |
| UI-002 | Fix CarOwner.tsx avatar display | 1 |
| UI-003 | Fix HostBookingCard.tsx avatar | 1 |
| UI-004 | Fix RenterBookingCard.tsx - add host avatar | 1 |
| UI-005 | Fix ConversationRow.tsx avatar | 1 |
| UI-006 | Fix ChatHeader.tsx avatar | 1 |
| UI-007 | Fix Maps host sidebar avatars | 1 |

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

| ID | Task | Points |
|----|------|--------|
| UI-008 | Create `ResponsiveTabTrigger` component | 3 |
| UI-009 | Update HostBookings.tsx tabs | 2 |
| UI-010 | Update RenterDashboard.tsx tabs | 2 |
| UI-011 | Update NotificationsRefactored.tsx tabs | 2 |
| UI-012 | Test responsive behavior on mobile viewports | 1 |

---

## Issue 3: Dark/Light Mode Color Contrast

### Description
Hardcoded gray colors (`text-gray-600`, `text-gray-700`, `bg-gray-50`) don't adapt to dark mode, causing text to become invisible or low-contrast.

### Affected Files (54+ identified)

**High Priority:**
| File | Issue |
|------|-------|
| `Login.tsx` | `text-gray-900`, `bg-gray-50` invisible in dark mode |
| `signup.tsx` | Hardcoded gray colors throughout |
| `UnauthenticatedView.tsx` | `text-gray-600` invisible in dark mode |

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

| ID | Task | Points |
|----|------|--------|
| UI-013 | Fix Login.tsx color tokens | 2 |
| UI-014 | Fix signup.tsx color tokens | 2 |
| UI-015 | Fix UnauthenticatedView.tsx colors | 1 |
| UI-016 | Audit and fix remaining files (batch) | 5 |
| UI-017 | Fix button contrast issues | 2 |

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

| ID | Task | Points |
|----|------|--------|
| UI-018 | Auto-open AuthModal in UnauthenticatedView | 2 |
| UI-019 | Review/update AuthModal close behavior | 1 |
| UI-020 | Consider deprecating /login and /signup routes | 1 |

---

## Issue 5: Vehicle Details Avatar Display

### Description
On the vehicle details page, the car owner's avatar doesn't display correctly in the `CarOwner.tsx` component.

### Location
`src/components/car-details/CarOwner.tsx` - lines 100-104

### Solution
Use `getAvatarPublicUrl()` utility (covered in Issue 1, Task UI-002).

---

## Issue 6: Messenger Avatar Issues

### Description
In the messenger module, user avatars in conversation list and chat headers don't render.

### Affected Components
- `ConversationRow.tsx` - line 48
- `ChatHeader.tsx` - avatar prop handling

### Solution
Apply `getAvatarPublicUrl()` utility (covered in Issue 1, Tasks UI-005 & UI-006).

---

## Issue 7: Maps Host Sidebar Avatars

### Description
When viewing hosts on the map, the sidebar showing host information doesn't display their avatar correctly.

### Solution
Identify the sidebar component and apply `getAvatarPublicUrl()` utility (covered in Issue 1, Task UI-007).

---

## Summary

### Total Story Points: 34

| Category | Points |
|----------|--------|
| Avatar Fixes (Issue 1) | 7 |
| Responsive Tabs (Issue 2) | 10 |
| Color Contrast (Issue 3) | 12 |
| Auth Flow (Issue 4) | 4 |
| Vehicle Details (Issue 5) | (included in Issue 1) |
| Messenger (Issue 6) | (included in Issue 1) |
| Maps Sidebar (Issue 7) | (included in Issue 1) |

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
| 50+ additional files | Hardcoded color replacements |
