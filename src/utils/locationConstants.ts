export const LOCATION_SETTINGS = {
  HIGH_ACCURACY: {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0
  },
  ACCURACY_THRESHOLDS: {
    HIGH: 10,
    GOOD: 50
  }
} as const;

export const MAP_SETTINGS = {
  ZOOM_LEVEL: 15,
  ANIMATION_DURATION: 1000,
  VERTICAL_OFFSET_PERCENT: 0.25,
  PADDING: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  }
} as const;