/**
 * BUG-062 verification script — plain Node.js, no dependencies
 * Confirms "Book Now" is replaced with "Request to Book" in all user-facing
 * button labels and aria-labels, and that no stale "Book Now" text remains
 * in visible UI surfaces.
 *
 * Root cause:
 *  MobiRides uses a request-first model (host must approve before confirmation).
 *  The CTA labeled "Book Now" implied instant confirmation, misleading renters.
 *  Two files contained the stale label:
 *    1. src/components/car-details/CarActions.tsx — visible span + aria-label + comment
 *    2. src/components/car-card/CarActions.tsx    — visible button text
 *
 * Fix:
 *  - car-details/CarActions.tsx: span updated to "Request to Book",
 *    aria-label updated, comment updated
 *  - car-card/CarActions.tsx: button text updated to "Request to Book"
 */

const fs = require('fs');
const path = require('path');

const CAR_DETAILS_ACTIONS = path.resolve(__dirname, '../src/components/car-details/CarActions.tsx');
const CAR_CARD_ACTIONS    = path.resolve(__dirname, '../src/components/car-card/CarActions.tsx');

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

console.log('\nBUG-062 — CTA must read "Request to Book", not "Book Now"\n');

const details = fs.readFileSync(CAR_DETAILS_ACTIONS, 'utf-8');
const card    = fs.readFileSync(CAR_CARD_ACTIONS,    'utf-8');

// ── car-details/CarActions.tsx ────────────────────────────────────────────

assert(
  'Visible span label is "Request to Book"',
  details.includes('>Request to Book<')
);

assert(
  'aria-label says "Request to book"',
  details.includes('Request to book')
);

assert(
  'Stale "Book Now" button text is gone from car-details',
  !details.includes('>Book Now<') && !details.includes('>Book now<')
);

assert(
  'Stale "Book Now" comment is updated',
  !details.includes('Book Now Button')
);

// ── car-card/CarActions.tsx ───────────────────────────────────────────────

assert(
  'Visible button text is "Request to Book" in car-card',
  card.includes('Request to Book')
);

assert(
  'Stale "Book Now" text is gone from car-card',
  !card.includes('Book Now')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
