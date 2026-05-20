/**
 * BUG-044 verification script — plain Node.js, no dependencies
 * Tests that invalid/deleted vehicle links show a 404 immediately
 * instead of a blank loading state for >10s.
 */

const fs = require('fs');
const path = require('path');

const CAR_DETAILS = path.resolve(__dirname, '../src/pages/CarDetails.tsx');

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

console.log('\nBUG-044 — Immediate 404 on invalid/deleted vehicle links\n');

const src = fs.readFileSync(CAR_DETAILS, 'utf-8');

assert(
  'retry: false is set on the car useQuery (no exponential-backoff on not-found)',
  src.includes('retry: false')
);

assert(
  'queryFn throws "Car not found" when maybeSingle returns null',
  src.includes('throw new Error("Car not found")')
);

assert(
  'error branch renders immediately (not buried inside isLoading check)',
  src.includes('if (error || !car)')
);

assert(
  'isNotFound distinguishes 404 from other errors',
  src.includes('isNotFound')
);

assert(
  '"Vehicle not found" shown for missing/deleted listings',
  src.includes('"Vehicle not found"')
);

assert(
  'descriptive message explaining the link may be invalid or removed',
  src.includes('listing may have been removed')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
