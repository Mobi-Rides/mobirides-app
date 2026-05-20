/**
 * BUG-048 verification script — plain Node.js, no dependencies
 * Confirms PaymentReturnPage navigates to a valid route after payment.
 *
 * Root cause:
 *  bookingFallbackRoute was '/bookings', which routes through RoleAwareBookingsRedirect.
 *  That component renders null while loading role data, producing a blank / 404-like page.
 *  Renters (the only users paying) should land on '/renter-bookings' directly.
 *
 * Fix:
 *  Changed bookingFallbackRoute from '/bookings' to '/renter-bookings'.
 *  The primary success/failure navigation already used '/rental-details/<id>' when
 *  bookingId was available — only the fallback needed correcting.
 */

const fs = require('fs');
const path = require('path');

const PAGE = path.resolve(__dirname, '../src/pages/PaymentReturnPage.tsx');
const APP  = path.resolve(__dirname, '../src/App.tsx');

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

console.log('\nBUG-048 — Payment return page must not send users to a 404\n');

const src = fs.readFileSync(PAGE, 'utf-8');
const app = fs.readFileSync(APP, 'utf-8');

// ── Fallback route fixed ───────────────────────────────────────────────────

assert(
  'bookingFallbackRoute is /renter-bookings',
  src.includes("bookingFallbackRoute = '/renter-bookings'")
);

assert(
  'bookingFallbackRoute is NOT /bookings (broken path removed)',
  !src.includes("bookingFallbackRoute = '/bookings'")
);

// ── Target route exists in App.tsx ────────────────────────────────────────

assert(
  '/renter-bookings route is registered in App.tsx',
  app.includes('path="/renter-bookings"')
);

// ── Success navigation still prefers rental-details ───────────────────────

assert(
  'Success button navigates to /rental-details/<id> when bookingId is available',
  src.includes('`/rental-details/${bookingId}`')
);

assert(
  'Success button falls back to bookingFallbackRoute when bookingId is absent',
  src.includes('bookingId ? `/rental-details/${bookingId}` : bookingFallbackRoute')
);

// ── All status branches use the fallback ──────────────────────────────────

assert(
  'Failed state also uses bookingFallbackRoute as fallback',
  (() => {
    // Count how many times bookingFallbackRoute appears in navigate() calls
    const matches = src.match(/navigate\([^)]*bookingFallbackRoute[^)]*\)/g) || [];
    return matches.length >= 2; // success + failed buttons
  })()
);

assert(
  'Not-found state navigates to bookingFallbackRoute',
  src.includes('navigate(bookingFallbackRoute)')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
