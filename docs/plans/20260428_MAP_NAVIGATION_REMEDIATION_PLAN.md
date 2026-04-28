# Map & Navigation Remediation Plan (Android Readiness)

**Date:** 2026-04-28  
**Status:** DRAFT  
**Objective:** Audit and modernize the map infrastructure and navigation system to achieve global app standards for Android launch.

---

## 1. Problem Statement
The current map implementation is "clumsy" and web-centric, characterized by:
- **Monolithic Architecture**: `CustomMapbox.tsx` is a "God Component" (850+ lines) mixing state, API calls, and imperative DOM manipulation.
- **Non-Native UI**: Reliance on D-pads, desktop sidebars (Left Side Trays), and generic SVG markers.
- **Imprecise Navigation**: Web-based `watchPosition` with robotic voice guidance and excessive "recalculating" toasts.
- **Poor Selection UX**: Location selection relies on covering the marker with a thumb (draggable) rather than moving the map under a pin (center-pin).

---

## 2. Recommended Architectural Changes

### Action 1: Decompose `CustomMapbox` into Hooks
Extract logic from `CustomMapbox.tsx` into domain-specific hooks to improve performance and testability.
- `useMapMarkers`: Manage lifecycle of Mapbox markers (add/remove/update).
- `useMapRouting`: Handle Directions API requests and geometry rendering.
- `useMapInteraction`: Handle gestures, pan/zoom bounds, and center-pin logic.

### Action 2: Replace Side Trays with Mobile Bottom Sheets
Migrate `HostCarsSideTray.tsx` and other sidebars to a persistent bottom-sheet pattern.
- **Implementation**: Use `@gorhom/bottom-sheet` (or equivalent accessible web-bottom-sheet library) for tiered expansion (Peek / Half / Full).
- **Benefit**: Retains map context while browsing host details/cars.

### Action 3: Modernize Location Selection (Center-Pin)
Replace draggable markers with the industry-standard center-pin selector.
- **Pattern**: Fix a pin asset at the viewport center.
- **Mechanism**: Use `map.on('moveend')` to return coordinates at the center of the crosshair.
- **UX**: Eliminates "thumb-block" issues on touch screens.

---

## 3. Navigation Service Remediation

### Action 4: Native-Friendly Tracking Logic
Refactor `navigationService.ts` to reduce "Toast Storms" and jitter.
- **Thresholds**: Implement velocity-based rerouting logic (don't reroute if moving slowly near the path).
- **Frequency**: Increase location sampling frequency but use a moving average filter to smooth GPS jitter.
- **Feedback**: Suppress "Recalculating" toasts for minor deviations (<15m).

### Action 5: Professional Audio & UI Feedback
- **Voice**: Investigate native Android TTS integration via Bridge (if in WebView) or higher-quality localized audio clips.
- **Visuals**: Use `Lottie` animations or high-res sprites for the "Navigation Arrow" to show heading/bearing clearly.

---

## 4. Feature Gaps (Host Fleet View)

### Action 6: In-Progress Rental Visualization
Implement a real-time tracking view for hosts to monitor their fleet.
- **Logic**: Fetch `in_progress` rentals for the current host and render car positions using real-time GPS telemetry (if available) or last known location.
- **Markers**: Use "Moving Car" icons that orient based on the `bearing` returned by the device.

---

## 5. Visual Excellence (Wow Factor)

### Action 7: Custom Marker Design System
Replace generic Lucide SVG markers with a professional asset set.
- **Assets**: 3D-shaded car pins, pulsing "User Location" halos, and high-contrast destination flags.
- **Animations**: Use Mapbox `Fill-Extrusion` layers for 3D building context in urban areas during navigation.

---

## 6. Execution Roadmap

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| **Phase 1** | Modularize `CustomMapbox` & Extract Hooks | 2 Days | Critical |
| **Phase 2** | Implement Center-Pin Selector & Marker Refactor | 1 Day | High |
| **Phase 3** | Migrate Side Trays to Bottom Sheets | 2 Days | High |
| **Phase 4** | Refactor `NavigationService` logic & Audio | 2 Days | Medium |
| **Phase 5** | Implement Host Fleet View | 1 Day | Medium |

---

## 7. Acceptance Criteria
1. No `document.createElement` or `querySelectorAll` calls inside React map components.
2. Smooth transition between "Map View" and "Car Details" via Bottom Sheets.
3. Rerouting logic does not trigger more than once per real deviation.
4. Location selector is precise to within 1 meter on mobile touch.
