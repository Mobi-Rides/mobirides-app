/**
 * BUG-047 verification script — plain Node.js, no dependencies
 * Tests that "Pay Now" is no longer shown / actionable for 'pending' bookings.
 *
 * Root causes fixed:
 *  1. RenterBookingCard.tsx — "Pay Now" button rendered for both 'pending' AND
 *     'awaiting_payment', but click handler only worked for 'awaiting_payment'.
 *     For 'pending' it navigated to rental-details without ?pay=true — a no-op.
 *     Fix: button condition changed to awaiting_payment only; fallback nav now
 *     includes ?pay=true so the modal opens when onPayNow is unavailable.
 *
 *  2. RentalDetailsRefactored.tsx — ?pay=true URL param silently did nothing for
 *     non-awaiting_payment statuses (guard was `booking.status === 'awaiting_payment'`).
 *     For 'pending' status the user saw a blank page with no feedback.
 *     Fix: pending status now shows a toast explaining approval is still needed,
 *     then cleans the URL param.
 */

const fs = require('fs');
const path = require('path');

const CARD = path.resolve(__dirname, '../src/components/renter-bookings/RenterBookingCard.tsx');
const DETAILS = path.resolve(__dirname, '../src/pages/RentalDetailsRefactored.tsx');

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

console.log('\nBUG-047 — Pay Now button must not appear / work for pending bookings\n');

const card = fs.readFileSync(CARD, 'utf-8');
const details = fs.readFileSync(DETAILS, 'utf-8');

// ── RenterBookingCard.tsx ─────────────────────────────────────────────────────

assert(
  '"Pay Now" button no longer shows for pending status',
  !card.includes('"awaiting_payment" || booking.status === "pending"') &&
  !card.includes('"pending" || booking.status === "awaiting_payment"')
);

assert(
  '"Pay Now" button only renders for awaiting_payment',
  card.includes('booking.status === "awaiting_payment"') &&
  card.includes('Pay Now')
);

assert(
  'click handler no longer has dead pending branch',
  !card.includes('booking.status === "awaiting_payment" && onPayNow')
);

assert(
  'fallback nav for missing onPayNow includes ?pay=true',
  card.includes('?pay=true')
);

// ── RentalDetailsRefactored.tsx ───────────────────────────────────────────────

assert(
  '?pay=true guard still opens modal for awaiting_payment',
  details.includes("booking?.status === 'awaiting_payment'") &&
  details.includes('setIsPaymentModalOpen(true)')
);

assert(
  '?pay=true for pending status shows an informative toast instead of silent no-op',
  details.includes("booking?.status === 'pending'") &&
  details.includes('awaiting host approval')
);

assert(
  'URL param is cleaned up for both awaiting_payment and pending paths',
  (details.match(/p\.delete\('pay'\)/g) || []).length >= 1 ||
  (details.match(/newParams\.delete\('pay'\)/g) || []).length >= 1 ||
  (details.match(/cleanUrl\(\)/g) || []).length >= 2
);

assert(
  'toast imported in RentalDetailsRefactored',
  details.includes('from "sonner"') || details.includes("from 'sonner'")
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
