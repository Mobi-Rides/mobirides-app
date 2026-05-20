/**
 * BUG-063 verification script — plain Node.js, no dependencies
 * Tests that booking_request_sent uses "Booking Request Received" templates,
 * not premature "Booking Confirmation" templates.
 */

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../src/services/completeNotificationService.ts');

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

console.log('\nBUG-063 — Premature booking confirmation email\n');

if (!fs.existsSync(FILE)) {
  console.error('  ✗  file not found:', FILE);
  process.exit(1);
}

const src = fs.readFileSync(FILE, 'utf-8');

// ── Email template fixes ──────────────────────────────────────────────────────

assert(
  "booking_request_sent maps to 'booking-request-received' (not 'booking-request')",
  /case 'booking_request_sent':\s*\n\s*return 'booking-request-received'/.test(src)
);

assert(
  "booking_request_sent does NOT map to host template 'booking-request'",
  !/case 'booking_request_sent':\s*\n\s*return 'booking-request'[^-]/.test(src)
);

assert(
  "booking-request-received template data sets customerName (not hostName)",
  /templateKey === 'booking-request-received'/.test(src) &&
  src.indexOf("templateKey === 'booking-request-received'") <
  src.indexOf("templateData.customerName = name")
);

assert(
  "booking-confirmation still maps to booking_confirmed_renter (true confirmation)",
  /case 'booking_confirmed_renter':\s*\n\s*return 'booking-confirmation'/.test(src)
);

// ── WhatsApp template fixes ───────────────────────────────────────────────────

assert(
  "booking_request_sent uses BOOKING_REQUEST_TEMPLATE (not BOOKING_CONFIRMATION_TEMPLATE) for WhatsApp",
  /typeStr === 'booking_request_sent'.*isHost/.test(src) ||
  /booking_request_sent.*BOOKING_REQUEST_TEMPLATE/.test(src) ||
  /'booking_request_sent'.*\|\|.*_host/.test(src)
);

assert(
  "isHost condition includes booking_request_sent",
  src.includes("typeStr === 'booking_request_sent'")
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
