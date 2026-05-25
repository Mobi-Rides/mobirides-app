# [MOB-126] Implementation Plan: Premium Authentication Landing Experience

## Status: ✅ IMPLEMENTED (Sprint 15)
## Assignee: Tapologo Moilwa
## Priority: P1
## Estimate: 8 Story Points

---

## 🎯 Objective
Redesign the core authentication flow (Login and Signup) to align with the premium Mobi Rides V1.0 branding. The goal is to transition from a generic centered form to a high-fidelity, split-screen landing experience that emphasizes brand identity and provides a modern, "glassmorphism" aesthetic.

## 🎨 Design Specifications (Desktop)
- **Layout**: 50/50 Split-Screen layout.
- **Left Pane (Brand side)**:
    - Background: Minimalist white/light-gray with subtle branding patterns.
    - Content: Centered official "M" smile logo and headline.
    - Headline: `MobiRides: Cars for You, By You - Botswana's Largest Rental Marketplace`.
- **Right Pane (Form side)**:
    - Background: Primary brand gradient (using `#7C3AED` to `#6D28D9`).
    - Floating Card: A centered, rounded-corner container with a white background and glassmorphism effects (backdrop-blur, subtle shadow).
    - Form Content: 
        - Title (e.g., "Sign up for MobiRides").
        - Input fields with consistent iconography.
        - Primary purple button with arrow icon ("Sign Up ->").
        - Social login integration (Google/Facebook icons).

## 📱 Mobile Variation
- **Layout**: Single column (Stacked).
- **Header**: Compact brand logo and corrected slogan.
- **Body**: Centered authentication card on a full-page brand gradient background to maintain the premium feel.

---

## 🛠️ Technical Tasks

### 1. Component Architecture
- **[NEW] `AuthLayout.tsx`**: Create a reusable layout wrapper that handles the responsive split-screen logic and the floating card container.
- **[MODIFY] `Login.tsx`**: Refactor to use `AuthLayout` and inject the existing `SignInForm`.
- **[MODIFY] `signup.tsx`**: Refactor to use `AuthLayout` and inject the existing `SignUpForm`.

### 2. Global Branding Fixes
- **[MODIFY] `index.html`**:
    - Update `<title>` and `<meta name="description">` to use the corrected slogan: "By You" instead of "Buy You".
    - Update `<meta name="author">` to "Mobi Rides".

### 3. Styling & Assets
- Use Tailwind CSS `backdrop-blur` and `bg-opacity` for the glassmorphism effect.
- Ensure the official `MOBI_LOGO.png` is used without distortion.

---

## ✅ Acceptance Criteria
1.  **Desktop Parity**: The layout matches the approved mockup structure (Split screen).
2.  **Slogan Accuracy**: All references to the brand slogan are corrected to "By You".
3.  **Responsive Integrity**: The mobile view correctly stacks components without horizontal scrolling or layout breakage.
4.  **Brand Consistency**: Brand purple (`#7C3AED`) is used for primary buttons and gradients.
5.  **Functionality**: Existing authentication logic (Supabase integration) remains 100% functional post-refactor.

---

## 🚦 Verification Plan
- **Browser Testing**: Verify layout on Chrome, Safari, and Mobile (simulated).
- **Build Validation**: Run `npm run build` to ensure no component regressions.

## ✅ Sprint 15 Completion Notes

- `src/components/auth/AuthLandingShell.tsx` provides the responsive premium split-screen shell for desktop and stacked mobile auth views.
- `src/pages/Login.tsx` and `src/pages/signup.tsx` use `AuthLandingShell` with the existing `SignInForm` and `SignUpForm` auth logic preserved.
- `index.html` already uses the corrected slogan and author metadata.
- The auth shell uses static launch assets instead of unauthenticated database reads, keeping auth pages deterministic for regression testing.
