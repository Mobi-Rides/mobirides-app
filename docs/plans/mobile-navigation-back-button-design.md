# Mobile Navigation Back Button Design Specification

## 1. Analysis of Current Navigation State

### 1.1 Navigation Architecture

**Bottom Tab Navigation** ([`src/components/Navigation.tsx`](src/components/Navigation.tsx:1)):
- 5 main tabs: Explore, Map, Bookings, Inbox, More
- Fixed at bottom with safe area insets for mobile
- Active state indicator with animated transitions
- Badge support for unread messages/notifications

**Route Structure** (from [`src/App.tsx`](src/App.tsx:1)):
```
Public Routes:
- / (Index/Home)
- /login
- /signup  
- /reset-password
- /forgot-password
- /password-reset-sent
- /cars/:carId (Car Details)

Protected Routes (require authentication):
- /profile, /profile-view, /edit-profile
- /dashboard
- /add-car, /create-car, /edit-car/:id
- /saved-cars
- /driver-license
- /bookings, /bookings/:id
- /host-bookings, /renter-bookings
- /booking-requests/:id
- /rental-review/:bookingId, /review/host/:bookingId
- /rental-details/:id
- /wallet
- /verification
- /notification-preferences
- /promo-codes
- /settings/* (profile, verification, display, security)
- /messages
- /notifications, /notifications/:id
- /map
- /more
- /help/:role, /help/:role/:section
- /claims
- /insurance/policies

Admin Routes:
- /admin/* (dashboard, users, cars, bookings, etc.)
```

### 1.2 Current Header Implementation

**Header Component** ([`src/components/Header.tsx`](src/components/Header.tsx:1)):
- Contains: Logo, Location display, "Add A Car" button, Profile dropdown
- Includes search bar with filters
- Sticky positioning at top
- **No back button currently implemented**
- Used on main pages: Index, Dashboard

### 1.3 Existing Back Button Patterns (Inconsistent)

Currently, back buttons are implemented inconsistently across the app:

| Page | Current Back Button Implementation | Destination |
|------|-----------------------------------|-------------|
| HelpCenter | Manual `ArrowLeft` button in header | `/profile` |
| HelpSection | Manual `ArrowLeft` button in header | `/help/${role}` |
| Wallet | Manual `ArrowLeft` button | `/profile` |
| BookingRequestDetails | Uses `ArrowLeft` | Back navigation |
| Profile (sub-views) | Uses `onBack` prop pattern | Parent view |
| RentalDetails | Uses custom header with back | `/bookings` |
| HostBookings | Uses `ArrowLeft` | Not clearly defined |
| AddCar | Uses `ArrowLeft` | Previous page |
| DashboardHeader | Uses `ArrowLeft` | `/` |
| ChatWindow | Uses `ArrowLeft` | Close/minimize |

**Problems Identified**:
1. No standardized BackButton component
2. Inconsistent styling (button sizes, colors, positioning)
3. Inconsistent behavior (some use `navigate(-1)`, some use hardcoded paths)
4. Some pages completely lack back navigation (CarDetails, Profile main view, Settings pages)
5. No mobile-specific considerations (safe areas, gestures)
6. Android hardware back button not handled

---

## 2. Screens Requiring Back Buttons

### 2.1 High Priority (All Detail/Sub-Pages)

These pages are accessed from main navigation and need clear back paths:

| Route | Parent Route | Priority | Notes |
|-------|-------------|----------|-------|
| `/cars/:carId` | `/` or `/map` | High | Car detail from explore/map |
| `/bookings/:id` | `/bookings` | High | Booking detail |
| `/booking-requests/:id` | `/host-bookings` | High | Host booking request detail |
| `/rental-details/:id` | `/bookings` | High | Rental detail view |
| `/rental-review/:bookingId` | `/bookings` | High | Review form |
| `/review/host/:bookingId` | `/host-bookings` | High | Host review form |
| `/notifications/:id` | `/notifications` | High | Notification detail |
| `/edit-car/:id` | `/car-listing` | High | Edit car form |
| `/help/:role/:section` | `/help/:role` | Medium | Help article |

### 2.2 Medium Priority (Settings & Profile)

| Route | Parent Route | Priority | Notes |
|-------|-------------|----------|-------|
| `/edit-profile` | `/profile` | Medium | Profile editing |
| `/profile-view` | `/profile` | Medium | Public profile view |
| `/settings/profile` | `/more` | Medium | Settings sub-page |
| `/settings/verification` | `/more` | Medium | Verification settings |
| `/settings/display` | `/more` | Medium | Display settings |
| `/settings/security` | `/more` | Medium | Security settings |
| `/wallet` | `/more` | Medium | Wallet page |
| `/verification` | `/more` | Medium | Verification flow |
| `/notification-preferences` | `/more` | Medium | Notification settings |
| `/promo-codes` | `/more` | Medium | Promo codes |
| `/claims` | `/more` | Medium | Insurance claims |
| `/insurance/policies` | `/more` | Medium | Insurance policies |
| `/saved-cars` | `/` | Medium | Saved cars list |
| `/car-listing` | `/more` | Medium | My cars listing |

### 2.3 Lower Priority (Form Flows)

| Route | Parent Route | Priority | Notes |
|-------|-------------|----------|-------|
| `/add-car` | `/car-listing` | Medium | Add car form |
| `/create-car` | `/car-listing` | Medium | Alternative car creation |
| `/driver-license` | `/verification` | Low | License upload |

### 2.4 Admin Routes

Admin routes should have consistent back navigation to `/admin` or parent admin section:

| Route | Parent Route |
|-------|-------------|
| `/admin/users` | `/admin` |
| `/admin/cars` | `/admin` |
| `/admin/bookings` | `/admin` |
| `/admin/transactions` | `/admin` |
| `/admin/verifications` | `/admin` |
| `/admin/messages` | `/admin` |
| `/admin/management` | `/admin` |
| `/admin/audit` | `/admin` |
| `/admin/analytics` | `/admin` |
| `/admin/promo-codes` | `/admin` |
| `/admin/reviews` | `/admin` |
| `/admin/claims` | `/admin` |
| `/admin/remittances` | `/admin` |

---

## 3. BackButton Component Design

### 3.1 Component Interface

```typescript
// src/components/navigation/BackButton.tsx

interface BackButtonProps {
  /** 
   * Navigation destination. 
   * - string: Navigate to specific path
   * - number: Navigate back N steps (e.g., -1)
   * - 'back': Use browser back (navigate(-1))
   * - undefined: Default to navigate(-1)
   */
  to?: string | number | 'back';
  
  /** 
   * Custom click handler. Overrides default navigation.
   * Return false to prevent default navigation.
   */
  onClick?: (e: React.MouseEvent) => void | boolean;
  
  /** Show text label alongside icon */
  showLabel?: boolean;
  
  /** Custom label text (default: "Back") */
  label?: string;
  
  /** Button variant for styling */
  variant?: 'ghost' | 'outline' | 'default';
  
  /** Icon size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional CSS classes */
  className?: string;
  
  /** Whether to replace current history entry instead of push */
  replace?: boolean;
  
  /** Optional callback when navigation occurs */
  onNavigate?: () => void;
  
  /** Disable the button */
  disabled?: boolean;
  
  /** Show as icon only (no background) for minimal design */
  iconOnly?: boolean;
}
```

### 3.2 Mobile-Specific Props

```typescript
interface MobileBackButtonProps extends BackButtonProps {
  /** 
   * Position mode for mobile layouts
   * - 'header': Positioned in page header (sticky)
   * - 'floating': Floating button (absolute positioned)
   * - 'inline': Inline with content
   */
  position?: 'header' | 'floating' | 'inline';
  
  /** 
   * Safe area handling for notched devices
   * Adds padding-top for iOS safe areas
   */
  respectSafeArea?: boolean;
  
  /** 
   * Android hardware back button handling
   * Register this back action with Capacitor
   */
  handleHardwareBack?: boolean;
  
  /** Swipe back gesture hint (iOS style) */
  showSwipeHint?: boolean;
}
```

### 3.3 Styling Specifications

**Default Style (Mobile-Optimized)**:
```css
/* Touch target: 44x44px minimum (Apple HIG) */
.back-button {
  min-width: 44px;
  min-height: 44px;
  padding: 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Icon sizing */
.back-button-icon {
  width: 24px;
  height: 24px;
}

/* Label styling */
.back-button-label {
  font-size: 16px;
  font-weight: 500;
}

/* Safe area for notched devices */
.back-button-safe-area {
  padding-top: env(safe-area-inset-top, 0);
}
```

**Variants**:

1. **Ghost** (Default): Transparent background, subtle hover state
   - Use in headers, minimal visual weight
   - Best for: Most mobile screens

2. **Outline**: Subtle border, transparent background
   - Use when button needs more visibility
   - Best for: Floating positions

3. **Solid**: Filled background
   - Use for high-visibility back actions
   - Best for: Modal-style screens

**Color Scheme**:
- Icon: `text-foreground` or `text-primary`
- Label: `text-foreground`
- Hover: `bg-accent` or `bg-primary/10`
- Active/Press: Scale down slightly (0.95)

### 3.4 Positioning Guidelines

**Header Position** (Most Common):
```
┌─────────────────────────────────────┐
│ ← Back          Title          […] │  ← Sticky header
├─────────────────────────────────────┤
│                                     │
│         Page Content                │
│                                     │
└─────────────────────────────────────┘
```

**Implementation**:
```tsx
<header className="sticky top-0 z-50 bg-background border-b">
  <div className="flex items-center gap-3 p-4 safe-area-top">
    <BackButton to="/parent" />
    <h1 className="text-lg font-semibold">Page Title</h1>
  </div>
</header>
```

**Floating Position** (Maps, Full-Screen):
```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────┐                            │
│  │  ←  │    Content behind          │
│  └─────┘                            │
│                                     │
└─────────────────────────────────────┘
```

**Implementation**:
```tsx
<div className="relative">
  <BackButton 
    position="floating" 
    className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur"
  />
  <FullScreenContent />
</div>
```

### 3.5 Mobile UX Considerations

**iOS Patterns**:
- Back button in top-left of navigation bar
- Chevron-left icon (←)
- Often shows parent page title instead of "Back"
- Swipe from left edge to go back

**Android Patterns**:
- Up button in app bar (top-left)
- Arrow icon
- System back button at bottom
- Always labeled or icon-only

**Implementation Strategy**:
- Use iOS-style for consistency (chevron-left)
- Support both tap and swipe gestures
- Handle Android hardware back button via Capacitor

---

## 4. Integration with Existing Header

### 4.1 Header Component Modification

Add optional back button support to [`src/components/Header.tsx`](src/components/Header.tsx:1):

```typescript
interface HeaderProps {
  // ... existing props
  
  /** Show back button in header */
  showBack?: boolean;
  
  /** Back button destination */
  backTo?: string | 'back';
  
  /** Override default header title */
  title?: string;
  
  /** Hide search bar (for sub-pages) */
  hideSearch?: boolean;
}
```

**Modified Header Layout**:
```
With Back Button:
┌─────────────────────────────────────┐
│ ←  Title                    👤 🔔 │
├─────────────────────────────────────┤
│                                     │
│  [Search Bar - optional]            │
│                                     │
└─────────────────────────────────────┘

Without Back Button (Current):
┌─────────────────────────────────────┐
│ Logo    Location           + 👤 🔔 │
├─────────────────────────────────────┤
│                                     │
│  [Search Bar]                       │
│                                     │
└─────────────────────────────────────┘
```

### 4.2 MobileHeader Component

Create a dedicated mobile header for sub-pages:

```typescript
// src/components/navigation/MobileHeader.tsx

interface MobileHeaderProps {
  title: string;
  backTo?: string | 'back';
  rightAction?: React.ReactNode;
  showBottomBorder?: boolean;
  transparent?: boolean;
}
```

Usage:
```tsx
<MobileHeader 
  title="Booking Details" 
  backTo="/bookings"
  rightAction={<ShareButton />}
/>
```

---

## 5. Android Hardware Back Button Handling

### 5.1 Capacitor Integration

```typescript
// src/hooks/useHardwareBackButton.ts

import { App } from '@capacitor/app';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useHardwareBackButton = (handler?: () => boolean) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const listener = App.addListener('backButton', ({ canGoBack }) => {
      // If custom handler provided and returns true, prevent default
      if (handler && handler()) {
        return;
      }
      
      if (canGoBack) {
        navigate(-1);
      } else {
        // Exit app if on root page
        App.exitApp();
      }
    });
    
    return () => {
      listener.then(l => l.remove());
    };
  }, [handler, navigate]);
};
```

### 5.2 Page-Level Usage

```tsx
const BookingDetails = () => {
  // Default behavior - just go back
  useHardwareBackButton();
  
  // Or with custom logic
  useHardwareBackButton(() => {
    if (hasUnsavedChanges) {
      showUnsavedChangesDialog();
      return true; // Prevent default back
    }
    return false; // Allow default back
  });
  
  return <div>...</div>;
};
```

---

## 6. Implementation Recommendations

### 6.1 File Structure

```
src/
├── components/
│   └── navigation/
│       ├── BackButton.tsx          # Main back button component
│       ├── MobileHeader.tsx        # Mobile-optimized header
│       ├── Breadcrumbs.tsx         # Existing - keep as alternative
│       └── Navigation.tsx          # Existing bottom tab nav
├── hooks/
│   └── useHardwareBackButton.ts    # Android back button handler
├── utils/
│   └── navigation.ts               # Navigation utilities
└── types/
    └── navigation.ts               # Navigation type definitions
```

### 6.2 Implementation Order (for Code Mode)

**Phase 1: Core Component**
1. Create `BackButton.tsx` with full prop interface
2. Add Storybook stories or basic documentation
3. Test on mobile viewport sizes

**Phase 2: Hook & Utilities**
1. Create `useHardwareBackButton` hook
2. Create navigation utility functions (getParentRoute, etc.)
3. Add route metadata for automatic parent detection

**Phase 3: Page Integration (High Priority)**
1. Update `/cars/:carId` (CarDetails) with BackButton
2. Update `/bookings/:id` with BackButton
3. Update `/booking-requests/:id` with BackButton
4. Update `/notifications/:id` with BackButton

**Phase 4: Settings & Profile Pages**
1. Create `MobileHeader` component
2. Update all `/settings/*` pages
3. Update `/edit-profile`, `/wallet`, etc.

**Phase 5: Admin Pages**
1. Create consistent admin navigation pattern
2. Update all `/admin/*` sub-pages

**Phase 6: Polish**
1. Add swipe-back gesture support
2. Fine-tune animations and transitions
3. Test on actual devices (iOS/Android)

### 6.3 Route Parent Mapping

Create a configuration file for automatic parent route detection:

```typescript
// src/config/navigation.ts

export const routeParents: Record<string, string | string[]> = {
  // Detail pages
  '/cars/:carId': ['/'],  // Can come from home or map
  '/bookings/:id': '/bookings',
  '/booking-requests/:id': '/host-bookings',
  '/notifications/:id': '/notifications',
  
  // Settings pages
  '/settings/profile': '/more',
  '/settings/verification': '/more',
  '/settings/display': '/more',
  '/settings/security': '/more',
  '/wallet': '/more',
  '/verification': '/more',
  '/notification-preferences': '/more',
  '/promo-codes': '/more',
  '/claims': '/more',
  '/insurance/policies': '/more',
  
  // Profile
  '/edit-profile': '/profile',
  '/profile-view': '/profile',
  
  // Car management
  '/add-car': '/car-listing',
  '/create-car': '/car-listing',
  '/edit-car/:id': '/car-listing',
  '/car-listing': '/more',
  '/saved-cars': '/',
  
  // Reviews
  '/rental-review/:bookingId': '/bookings',
  '/review/host/:bookingId': '/host-bookings',
  '/rental-details/:id': '/bookings',
  
  // Help
  '/help/:role/:section': '/help/:role',
  '/help/:role': '/more',
  
  // Admin
  '/admin/users': '/admin',
  '/admin/cars': '/admin',
  '/admin/bookings': '/admin',
  // ... etc
};
```

### 6.4 CSS Safe Area Support

Add to global CSS for mobile safe areas:

```css
/* src/index.css */

@supports (padding-top: env(safe-area-inset-top)) {
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }
  
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .header-with-safe-area {
    padding-top: max(1rem, env(safe-area-inset-top));
  }
}
```

### 6.5 Migration Strategy

**For Existing Manual Back Buttons**:

Replace patterns like:
```tsx
// Before (inconsistent)
<Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
  <ArrowLeft className="h-4 w-4" />
</Button>
```

With:
```tsx
// After (standardized)
<BackButton to="/profile" size="sm" />
```

**For Pages Without Back Navigation**:

Add header with back button:
```tsx
// Before
<div className="container mx-auto p-4">
  <h1>Page Title</h1>
  ...
</div>

// After
<div className="min-h-screen">
  <MobileHeader title="Page Title" backTo="/parent" />
  <div className="container mx-auto p-4">
    ...
  </div>
</div>
```

---

## 7. Accessibility Considerations

### 7.1 ARIA Labels

```tsx
<button 
  aria-label={label || "Go back"}
  aria-describedby={parentRouteName ? "back-to-parent" : undefined}
>
  <ArrowLeft aria-hidden="true" />
  {showLabel && <span>{label}</span>}
</button>
```

### 7.2 Focus Management

- Back button should be first focusable element in header
- Focus should return to triggering element when navigating back
- Visible focus indicator required

### 7.3 Screen Reader Support

- Announce navigation: "Back to [Parent Page Name]"
- Include parent page name when available
- Use live regions for navigation announcements

---

## 8. Summary

### Key Deliverables for Code Mode:

1. **BackButton Component** (`src/components/navigation/BackButton.tsx`)
   - Full TypeScript interface
   - Responsive design
   - Animation support
   - Accessibility features

2. **MobileHeader Component** (`src/components/navigation/MobileHeader.tsx`)
   - Standardized mobile header with back button
   - Configurable right actions
   - Safe area support

3. **useHardwareBackButton Hook** (`src/hooks/useHardwareBackButton.ts`)
   - Android hardware back integration
   - Custom handler support
   - Capacitor integration

4. **Route Configuration** (`src/config/navigation.ts`)
   - Parent route mappings
   - Navigation metadata

5. **Updated Pages** (50+ files)
   - All detail pages
   - All settings pages
   - All admin pages
   - Consistent back navigation

### Success Criteria:

- [ ] Back button appears on all detail/settings pages
- [ ] Consistent styling across all screens
- [ ] Android hardware back button works correctly
- [ ] iOS swipe-back gesture supported
- [ ] Safe areas respected on notched devices
- [ ] Accessibility labels present
- [ ] All existing functionality preserved
