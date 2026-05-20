/**
 * BUG-064 verification script — plain Node.js, no dependencies
 * Tests that BookingRequestDetails uses dynamic back navigation.
 */

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../src/pages/BookingRequestDetails.tsx');

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

console.log('\nBUG-064 — BookingRequestDetails back navigation\n');

if (!fs.existsSync(FILE)) {
  console.error('  ✗  file not found:', FILE);
  process.exit(1);
}

const src = fs.readFileSync(FILE, 'utf-8');

assert('file exists',                                          true);
assert('imports useLocation from react-router-dom',           /useLocation/.test(src) && /from ['"]react-router-dom['"]/.test(src));
assert('calls useLocation() and stores result',               /useLocation\(\)/.test(src));
assert('derives backDestination from location.key',           src.includes('location.key') && src.includes('"default"') && src.includes('backDestination'));
assert('falls back to /host-bookings on key === "default"',   /location\.key\s*===\s*["']default["']\s*\?\s*["']\/host-bookings["']/.test(src));
assert('uses "back" for in-app navigation',                   /:\s*["']back["']/.test(src));
assert('no hard-coded backTo="/host-bookings" remains',       !src.includes('backTo="/host-bookings"'));
assert('both MobileHeader instances use backTo={backDestination}', (src.match(/backTo=\{backDestination\}/g) ?? []).length === 2);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
