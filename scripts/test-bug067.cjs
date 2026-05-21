/**
 * BUG-067 verification script — plain Node.js, no dependencies
 * Confirms useRentalDetails subscribes to handover_sessions in addition to bookings.
 *
 * Root cause:
 *  The realtime channel in useRentalDetails.ts only listened to the `bookings` table.
 *  When a host creates a handover session (INSERT into handover_sessions), the bookings
 *  row is never updated, so the renter's subscription never fired and canHandover stayed
 *  false until a manual refresh.
 *
 * Fix:
 *  Added a second .on('postgres_changes') listener on the same channel watching
 *  `handover_sessions` filtered by `booking_id=eq.<id>`. Both events invalidate
 *  the ["rental-details", id] React Query cache entry.
 */

const fs = require('fs');
const path = require('path');

const HOOK = path.resolve(__dirname, '../src/hooks/useRentalDetails.ts');

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

console.log('\nBUG-067 — Handover session creation must live-update the renter view\n');

const src = fs.readFileSync(HOOK, 'utf-8');

// ── Subscription structure ─────────────────────────────────────────────────

assert(
  'Channel subscribes to bookings table',
  src.includes("table: 'bookings'")
);

assert(
  'Channel subscribes to handover_sessions table',
  src.includes("table: 'handover_sessions'")
);

assert(
  'handover_sessions listener uses booking_id filter',
  src.includes("booking_id=eq.${id}")
);

assert(
  'Both listeners are in the same channel (single channel block)',
  (() => {
    // Both table names must appear between a single .channel( and .subscribe()
    const channelStart = src.indexOf('.channel(');
    const subscribeEnd = src.indexOf('.subscribe()', channelStart);
    if (channelStart === -1 || subscribeEnd === -1) return false;
    const block = src.slice(channelStart, subscribeEnd);
    return block.includes("table: 'bookings'") && block.includes("table: 'handover_sessions'");
  })()
);

assert(
  'Both listeners share a single invalidate call (DRY)',
  (() => {
    // The invalidate helper should be defined once and reused
    const invalidateCount = (src.match(/invalidateQueries/g) || []).length;
    return invalidateCount === 1;
  })()
);

// ── Query cache ────────────────────────────────────────────────────────────

assert(
  'Invalidates ["rental-details", id] query key',
  src.includes('"rental-details", id')
);

// ── No regressions ─────────────────────────────────────────────────────────

assert(
  'Original bookings subscription still present (not removed)',
  src.includes("filter: `id=eq.${id}`")
);

assert(
  'useEffect cleanup still removes channel',
  src.includes('supabase.removeChannel(channel)')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
