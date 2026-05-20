/**
 * BUG-068 verification script — plain Node.js, no dependencies
 * Confirms handover routing uses /handover/:sessionId instead of /map?mode=handover.
 *
 * Root cause:
 *  All handover navigations used /map?bookingId=...&mode=handover. Query params
 *  are lost if the user backgrounds the app or navigates away, making it impossible
 *  to return to an in-progress handover session. Path params survive this correctly.
 *
 * Fix:
 *  - Created HandoverPage.tsx: reads :sessionId, fetches booking_id from handover_sessions,
 *    renders map + EnhancedHandoverSheet
 *  - Registered /handover/:sessionId in App.tsx
 *  - Updated all 5 navigate callsites to use /handover/<session.id>
 *  - Updated RentalActions.tsx "View Handover Status" to look up active session
 */

const fs = require('fs');
const path = require('path');

const APP           = path.resolve(__dirname, '../src/App.tsx');
const HANDOVER_PAGE = path.resolve(__dirname, '../src/pages/HandoverPage.tsx');
const RENTAL_DET    = path.resolve(__dirname, '../src/pages/RentalDetailsRefactored.tsx');
const RENTER_DASH   = path.resolve(__dirname, '../src/components/dashboard/RenterDashboard.tsx');
const HOST_DASH     = path.resolve(__dirname, '../src/components/dashboard/HostDashboard.tsx');
const RENTER_VIEW   = path.resolve(__dirname, '../src/components/home/RenterView.tsx');
const HOST_VIEW     = path.resolve(__dirname, '../src/components/home/HostView.tsx');
const ACTIONS       = path.resolve(__dirname, '../src/components/rental-details/RentalActions.tsx');

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

console.log('\nBUG-068 — Handover routing must use /handover/:sessionId for deep-link safety\n');

const app        = fs.readFileSync(APP,           'utf-8');
const page       = fs.readFileSync(HANDOVER_PAGE, 'utf-8');
const rentalDet  = fs.readFileSync(RENTAL_DET,    'utf-8');
const renterDash = fs.readFileSync(RENTER_DASH,   'utf-8');
const hostDash   = fs.readFileSync(HOST_DASH,     'utf-8');
const renterView = fs.readFileSync(RENTER_VIEW,   'utf-8');
const hostView   = fs.readFileSync(HOST_VIEW,     'utf-8');
const actions    = fs.readFileSync(ACTIONS,       'utf-8');

// ── Route registered ───────────────────────────────────────────────────────

assert(
  'HandoverPage lazily imported in App.tsx',
  app.includes("import(\"@/pages/HandoverPage\")")
);

assert(
  '/handover/:sessionId route registered in App.tsx',
  app.includes('path="/handover/:sessionId"')
);

// ── HandoverPage.tsx ───────────────────────────────────────────────────────

assert(
  'HandoverPage reads sessionId from useParams',
  page.includes('useParams') && page.includes('sessionId')
);

assert(
  'HandoverPage fetches booking_id from handover_sessions by sessionId',
  page.includes('handover_sessions') && page.includes('booking_id')
);

assert(
  'HandoverPage renders EnhancedHandoverSheet',
  page.includes('EnhancedHandoverSheet')
);

assert(
  'HandoverPage wraps content in HandoverProvider',
  page.includes('HandoverProvider')
);

assert(
  'HandoverPage renders CustomMapbox in handover mode',
  page.includes('isHandoverMode={true}')
);

// ── Navigate callsites updated ─────────────────────────────────────────────

assert(
  'RentalDetailsRefactored navigates to /handover/<session.id>',
  rentalDet.includes('navigate(`/handover/${session.id}`)')
);

assert(
  'RentalDetailsRefactored no longer uses mode=handover',
  !rentalDet.includes('mode=handover')
);

assert(
  'RenterDashboard navigates to /handover/<session.id>',
  renterDash.includes('navigate(`/handover/${session.id}`)')
);

assert(
  'RenterDashboard no longer uses mode=handover',
  !renterDash.includes('mode=handover')
);

assert(
  'HostDashboard navigates to /handover/<session.id>',
  hostDash.includes('navigate(`/handover/${session.id}`)')
);

assert(
  'HostDashboard no longer uses mode=handover',
  !hostDash.includes('mode=handover')
);

assert(
  'RenterView navigates to /handover/<session.id>',
  renterView.includes('navigate(`/handover/${session.id}`)')
);

assert(
  'RenterView no longer uses mode=handover',
  !renterView.includes('mode=handover')
);

assert(
  'HostView navigates to /handover/<session.id>',
  hostView.includes('navigate(`/handover/${session.id}`)')
);

assert(
  'HostView no longer uses mode=handover',
  !hostView.includes('mode=handover')
);

// ── RentalActions View Handover Status ────────────────────────────────────

assert(
  'RentalActions looks up active session from booking.handover_sessions',
  actions.includes('booking.handover_sessions') && actions.includes('handover_completed')
);

assert(
  'RentalActions navigates to /handover/<activeSession.id> when session found',
  actions.includes('navigate(`/handover/${activeSession.id}`)')
);

assert(
  'RentalActions falls back to /map when no active session',
  actions.includes('/map?handover=true')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
