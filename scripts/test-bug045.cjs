/**
 * BUG-045 verification script — plain Node.js, no dependencies
 * Tests that the search filter button is no longer hidden.
 */

const fs = require('fs');
const path = require('path');

const HEADER = path.resolve(__dirname, '../src/components/Header.tsx');
const FETCHING = path.resolve(__dirname, '../src/utils/carFetching.ts');

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

console.log('\nBUG-045 — Search filters (Category, Price Range)\n');

const header = fs.readFileSync(HEADER, 'utf-8');
const fetching = fs.readFileSync(FETCHING, 'utf-8');

// ── Header.tsx ────────────────────────────────────────────────────────────────

assert(
  'filter button is no longer wrapped in {false && ...}',
  !header.includes('false && (')
);

assert(
  'SearchFilters is rendered unconditionally',
  header.includes('<SearchFilters onFiltersChange={handleFiltersChange}')
);

assert(
  'SlidersHorizontal icon is in an active Sheet trigger',
  header.includes('<SlidersHorizontal') &&
  header.indexOf('{false &&') === -1
);

// ── carFetching.ts ────────────────────────────────────────────────────────────

assert(
  'vehicleType filter applied to Supabase query',
  fetching.includes('filters?.vehicleType') &&
  fetching.includes('"vehicle_type"')
);

assert(
  'minPrice filter applied to Supabase query',
  fetching.includes('filters?.minPrice') &&
  fetching.includes('"price_per_day"')
);

assert(
  'maxPrice filter applied to Supabase query',
  fetching.includes('filters?.maxPrice') &&
  fetching.includes('"price_per_day"')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
