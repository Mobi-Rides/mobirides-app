# Navigation UX Improvement Plan
**Document Version:** 1.0  
**Date:** 2026-02-02  
**Status:** Planning  
**Related:** [INTERACTIVE_HANDOVER_SYSTEM_2026-02-02.md](./INTERACTIVE_HANDOVER_SYSTEM_2026-02-02.md)

---

## Executive Summary

This document outlines the comprehensive plan to upgrade MobiRides' handover navigation experience to match industry standards set by Google Maps and Waze. The current implementation has significant UX gaps in map visualization, navigation guidance, and overall driver experience.

---

## Current State Analysis

### Map Style Issues

| Issue | Current State | Expected (Google/Waze) |
|-------|---------------|------------------------|
| **Map Style** | `mapbox://styles/mapbox/streets-v12` - generic streets style | Navigation-optimized style with enhanced road hierarchy |
| **Landmarks** | Missing POIs, malls, gas stations, hospitals | Rich landmark layer with icons and labels |
| **Street Names** | Visible but inconsistent at navigation zoom levels | Always-visible street names during navigation |
| **3D Buildings** | Not enabled | 3D extruded buildings in urban areas |
| **Road Hierarchy** | Flat colors | Highway shields, road type differentiation |

### Navigation UX Issues

| Issue | Current State | Expected (Google/Waze) |
|-------|---------------|------------------------|
| **Camera Mode** | Static top-down view | 3D perspective (pitch 45-60°) with heading-locked rotation |
| **Maneuver Icons** | Single `Navigation2` icon for all turns | 15+ distinct icons (turn-left, turn-right, u-turn, merge, etc.) |
| **Lane Guidance** | Not implemented | Lane diagrams showing which lane to be in |
| **Next-Next Preview** | Not implemented | Shows upcoming 2 maneuvers |
| **Distance Countdown** | Static badge | Real-time countdown ("500m → 400m → 300m...") |
| **Speed Display** | Not implemented | Current speed + speed limit |
| **Voice Guidance** | Basic SpeechSynthesis | Distance-aware phrasing ("In 500 meters, turn right onto Main Street") |
| **Fullscreen Mode** | Overlay-based | Dedicated immersive driver mode |
| **Arrival Detection** | Manual button | Automatic "You have arrived" with parking guidance |

### Technical Root Causes

1. **Map Style Configuration**
   - Using `streets-v12` which hides landmarks at navigation zoom levels (16+)
   - Not using `navigation-day-v1` or `navigation-night-v1` styles
   - Missing custom layer configuration for POIs

2. **Camera Configuration**
   - `RouteLayer.tsx` uses `pitch: 45` but no `bearing` lock to heading
   - No smooth camera transitions following route geometry

3. **Voice Service**
   - `navigationService.ts` uses raw instructions without distance context
   - No announcement queue for overlapping instructions

---

## Proposed Solution Architecture

### Phase 1: Map Enhancement (Sprint 4 - Week 1)

#### 1.1 Navigation-Optimized Map Style
```typescript
// Map styles for navigation context
export const NAVIGATION_MAP_STYLES = {
  day: 'mapbox://styles/mapbox/navigation-day-v1',
  night: 'mapbox://styles/mapbox/navigation-night-v1',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12'
} as const;

// Fallback with custom layer additions
export const CUSTOM_NAVIGATION_STYLE_OVERRIDES = {
  // Enable 3D buildings
  buildings3D: true,
  // Show landmarks at all zoom levels
  landmarkMinZoom: 10,
  // Enhanced road labels
  roadLabelMinZoom: 12,
  // POI categories to always show
  poiCategories: ['fuel', 'hospital', 'police', 'mall', 'restaurant', 'hotel']
};
```

#### 1.2 Landmark & POI Layer
- Add custom source for Botswana-specific landmarks
- Configure POI visibility rules for zoom levels 10-22
- Add icon sprites for common categories

#### 1.3 Street Name Visibility
- Override label layers to show street names at zoom 14+
- Use larger font sizes during active navigation
- Add street name announcements to voice guidance

### Phase 2: Driver Mode UI (Sprint 4 - Week 2)

#### 2.1 New Component: `DriverModeNavigationView.tsx`
```
┌─────────────────────────────────────────────────────────────┐
│  [ETA 5:32 PM]  [15 min]  [8.2 km]            [×] Exit     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     ┌─────────────┐                         │
│                     │  [→ Right]  │  ← Maneuver Icon        │
│                     │   500m      │  ← Distance Countdown   │
│                     │ Main Street │  ← Street Name          │
│                     └─────────────┘                         │
│                                                             │
│                    [ 3D MAP VIEW ]                          │
│                    [ With Route  ]                          │
│                    [ Pitch: 60°  ]                          │
│                    [ Bearing: heading-locked ]              │
│                                                             │
│          ┌──────────────────────────────────────┐           │
│          │  Then: Turn left onto Oak Avenue     │ ← Next-Next │
│          └──────────────────────────────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  [🔇] [📍 Recenter] [⚠️ Report]  │  85 km/h │ Limit: 80   │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2 Maneuver Icon Library
Create `/src/components/navigation/icons/` with SVG icons:
- `turn-left.svg`, `turn-right.svg`
- `turn-slight-left.svg`, `turn-slight-right.svg`
- `turn-sharp-left.svg`, `turn-sharp-right.svg`
- `u-turn-left.svg`, `u-turn-right.svg`
- `merge-left.svg`, `merge-right.svg`
- `roundabout.svg`, `roundabout-exit-1.svg` through `exit-8.svg`
- `straight.svg`, `arrive.svg`, `arrive-left.svg`, `arrive-right.svg`
- `fork-left.svg`, `fork-right.svg`

#### 2.3 Lane Guidance Component
```typescript
interface LaneGuidanceProps {
  lanes: {
    valid: boolean;
    indications: ('left' | 'straight' | 'right' | 'slight-left' | 'slight-right')[];
  }[];
  activeLane: number;
}
```

### Phase 3: Camera & Animation (Sprint 5 - Week 1)

#### 3.1 Heading-Locked Camera
```typescript
// Camera follows user heading, not north-up
map.easeTo({
  center: [userLocation.longitude, userLocation.latitude],
  zoom: 17,
  pitch: 60,
  bearing: userLocation.heading || 0, // Lock to device heading
  duration: 1000
});
```

#### 3.2 Route Preview Animation
- Animated camera fly-along on route start
- Smooth transitions between steps
- Automatic zoom adjustment based on next maneuver distance

### Phase 4: Voice Guidance Enhancement (Sprint 5 - Week 1)

#### 4.1 Distance-Aware Announcements
```typescript
const announceManeuver = (step: NavigationStep, distanceRemaining: number) => {
  const streetName = step.road_name || 'the road';
  
  if (distanceRemaining > 1000) {
    speak(`In ${Math.round(distanceRemaining / 1000)} kilometers, ${step.instruction}`);
  } else if (distanceRemaining > 500) {
    speak(`In ${Math.round(distanceRemaining / 100) * 100} meters, turn ${step.maneuver} onto ${streetName}`);
  } else if (distanceRemaining > 100) {
    speak(`Turn ${step.maneuver} onto ${streetName} ahead`);
  } else if (distanceRemaining < 50) {
    speak(`Turn ${step.maneuver} now`);
  }
};
```

#### 4.2 Street Name Pronunciation
- Add street name to voice announcements
- Handle abbreviations (St → Street, Ave → Avenue)

### Phase 5: Traffic & Alerts (Sprint 5 - Week 2)

#### 5.1 Traffic Layer
- Already partially implemented in `RouteLayer.tsx`
- Enhance with real-time traffic coloring on route
- Add traffic delay to ETA calculation

#### 5.2 Speed Limit Display
- Query Mapbox speed limit data
- Display current limit with color coding
- Optional overspeed warning

---

## File Structure Changes

### New Files
```
src/components/navigation/
├── DriverModeNavigationView.tsx    # Fullscreen immersive navigation
├── ManeuverIcon.tsx                # Dynamic maneuver icon component
├── LaneGuidance.tsx                # Lane guidance display
├── SpeedDisplay.tsx                # Current speed + limit
├── NextManeuverPreview.tsx         # Next-next instruction card
├── NavigationHeader.tsx            # ETA, distance, time bar
├── NavigationBottomBar.tsx         # Controls bar
├── icons/
│   ├── index.ts                    # Icon exports
│   ├── turn-left.svg
│   ├── turn-right.svg
│   ├── ... (15+ icons)
│   └── arrive.svg
└── styles/
    └── navigation.css              # Navigation-specific styles

src/services/
├── voiceGuidanceService.ts         # Enhanced voice with distance awareness
└── speedLimitService.ts            # Speed limit data fetching

src/utils/mapbox/
└── navigationStyles.ts             # Navigation style configurations
```

### Modified Files
```
src/components/map/CustomMapbox.tsx
  - Add navigation style switching
  - Integrate 3D building layer
  - Add landmark layer visibility

src/components/navigation/RouteLayer.tsx
  - Heading-locked camera
  - Traffic-colored route segments

src/services/navigationService.ts
  - Enhanced step announcements
  - Distance tracking improvements

src/components/navigation/NavigationInterface.tsx
  - Replace with DriverModeNavigationView integration
  - Keep as fallback/compact mode
```

---

## Mapbox Style Configuration

### Option A: Use Built-in Navigation Styles (Recommended)
```typescript
// Mapbox provides navigation-optimized styles
const NAVIGATION_STYLES = {
  day: 'mapbox://styles/mapbox/navigation-day-v1',
  night: 'mapbox://styles/mapbox/navigation-night-v1'
};
```

**Benefits:**
- Pre-configured road hierarchy
- Optimized for navigation zoom levels
- Lane guidance data included
- Speed limit data available

### Option B: Custom Style Overlay
If navigation styles are not available, add layers to `streets-v12`:

```typescript
// Add landmark layer
map.addLayer({
  id: 'landmarks-layer',
  type: 'symbol',
  source: 'composite',
  'source-layer': 'poi_label',
  minzoom: 10,
  filter: ['in', 'class', 'fuel', 'hospital', 'police', 'lodging', 'food_and_drink', 'shop'],
  layout: {
    'icon-image': ['get', 'maki'],
    'text-field': ['get', 'name'],
    'text-size': 12,
    'text-offset': [0, 1.5]
  }
});

// Enable 3D buildings
map.addLayer({
  id: 'buildings-3d',
  source: 'composite',
  'source-layer': 'building',
  type: 'fill-extrusion',
  minzoom: 14,
  paint: {
    'fill-extrusion-color': '#aaa',
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-opacity': 0.6
  }
});
```

---

## Task Breakdown (JIRA)

### Sprint 4: Map & Core Navigation

| Task ID | Title | Points | Dependencies |
|---------|-------|--------|--------------|
| NAV-001 | Switch to navigation-day/night-v1 styles | 3 | - |
| NAV-002 | Configure landmark/POI layer visibility | 5 | NAV-001 |
| NAV-003 | Enable 3D buildings layer | 3 | NAV-001 |
| NAV-004 | Street name visibility at all zoom levels | 3 | NAV-001 |
| NAV-005 | Create maneuver icon library (15 icons) | 5 | - |
| NAV-006 | Build ManeuverIcon component | 3 | NAV-005 |
| NAV-007 | Build DriverModeNavigationView shell | 8 | NAV-006 |
| NAV-008 | Implement heading-locked camera | 5 | NAV-007 |

### Sprint 5: Enhanced UX

| Task ID | Title | Points | Dependencies |
|---------|-------|--------|--------------|
| NAV-009 | Build LaneGuidance component | 5 | NAV-007 |
| NAV-010 | Build NextManeuverPreview component | 3 | NAV-007 |
| NAV-011 | Create voiceGuidanceService with distance awareness | 5 | - |
| NAV-012 | Add street names to voice announcements | 3 | NAV-011 |
| NAV-013 | Build SpeedDisplay component | 3 | - |
| NAV-014 | Integrate speed limit data from Mapbox | 5 | NAV-013 |
| NAV-015 | Traffic-colored route segments | 5 | NAV-001 |
| NAV-016 | Automatic arrival detection & parking guidance | 5 | NAV-007 |
| NAV-017 | Route preview fly-along animation | 5 | NAV-008 |
| NAV-018 | Integration testing & polish | 8 | All |

**Total Story Points:** 82

---

## Success Criteria

### Map Quality
- [ ] Landmarks visible at zoom 12+ (malls, hospitals, fuel stations)
- [ ] Street names visible at zoom 14+
- [ ] 3D buildings render in urban areas
- [ ] POI icons match Google Maps density

### Navigation UX
- [ ] Heading-locked 3D camera during active navigation
- [ ] Correct maneuver icons for all turn types
- [ ] Voice announces distance + street name
- [ ] Lane guidance displays when available
- [ ] Automatic "You have arrived" detection

### Performance
- [ ] Map style switch < 500ms
- [ ] Voice latency < 100ms
- [ ] 60fps camera animations
- [ ] Battery-efficient GPS polling

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Navigation styles not available in free tier | High | Use custom layer overlay approach |
| Lane guidance data missing for Botswana | Medium | Hide component when data unavailable |
| Voice synthesis quality varies by device | Medium | Test on target devices, provide toggle |
| High battery consumption | Medium | Implement low-power mode option |

---

## References

- [Mapbox Navigation SDK](https://docs.mapbox.com/android/navigation/overview/)
- [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [Google Maps Navigation UX Guidelines](https://developers.google.com/maps/documentation/navigation)

---

## Appendix: Mapbox Layer IDs for POIs

The `streets-v12` style includes these relevant layers:
- `poi_label` - Points of interest with icons
- `road-label` - Street names
- `building` - Building footprints (can be extruded to 3D)
- `landuse` - Parks, commercial areas, etc.

To show more landmarks, adjust `minzoom` and `filter` on these layers.
