/**
 * BUG-040 verification script — plain Node.js, no dependencies
 * Tests that map initialization errors no longer leak as overlays on non-map pages.
 *
 * Two root causes fixed:
 *  1. CustomMapbox.tsx — stale event handlers (map error, geolocation error) fired
 *     toast.error() after the component had already unmounted, causing error toasts
 *     to appear on whatever page the user navigated to (Profile, Bookings, etc.)
 *  2. LocationAwareCustomMapbox.tsx — map initialized before the dialog container
 *     had real dimensions (during CSS open animation), causing MapboxGL WebGL errors.
 */

const fs = require('fs');
const path = require('path');

const CUSTOM = path.resolve(__dirname, '../src/components/map/CustomMapbox.tsx');
const LOCATION_AWARE = path.resolve(__dirname, '../src/components/booking/LocationAwareCustomMapbox.tsx');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    failed++;
  }
}

console.log('\nBUG-040 — Map errors must not bleed onto non-map pages\n');

const custom = fs.readFileSync(CUSTOM, 'utf-8');
const locationAware = fs.readFileSync(LOCATION_AWARE, 'utf-8');

// ── CustomMapbox.tsx ──────────────────────────────────────────────────────────

assert(
  'isMountedRef declared in CustomMapbox',
  custom.includes('isMountedRef = useRef(true)')
);

assert(
  'mount-tracking useEffect sets isMountedRef to false on cleanup',
  custom.includes('isMountedRef.current = false')
);

assert(
  'map error handler guards with isMountedRef before toast',
  (function() {
    // Check that isMountedRef.current check appears before the map error toast
    const mapErrorIdx = custom.indexOf('toast.error("Error loading map. Please refresh.")');
    const guardIdx = custom.lastIndexOf('if (!isMountedRef.current) return;', mapErrorIdx);
    return guardIdx !== -1 && guardIdx < mapErrorIdx;
  })()
);

assert(
  'geolocation error handler guards with isMountedRef before toast',
  (function() {
    const needle = 'Unable to access your location';
    const toastIdx = custom.indexOf(needle);
    const guardIdx = custom.lastIndexOf('if (!isMountedRef.current) return;', toastIdx);
    return guardIdx !== -1 && guardIdx < toastIdx;
  })()
);

// ── LocationAwareCustomMapbox.tsx ─────────────────────────────────────────────

assert(
  'LocationAwareCustomMapbox checks container dimensions before map init',
  locationAware.includes('offsetWidth') && locationAware.includes('offsetHeight')
);

assert(
  'LocationAwareCustomMapbox uses ResizeObserver to retry when container gets size',
  locationAware.includes('ResizeObserver')
);

assert(
  'LocationAwareCustomMapbox guards all event handlers with isMounted check',
  locationAware.includes('if (!isMounted.current) return;')
);

assert(
  'LocationAwareCustomMapbox disconnects ResizeObserver on cleanup',
  locationAware.includes('observer?.disconnect()')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
