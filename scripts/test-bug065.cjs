#!/usr/bin/env node
// Test script for BUG-065: Missing booking context on payment return page
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/PaymentReturnPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message}`);
    failed++;
  }
}

console.log('\nBUG-065: Missing booking context on payment return page\n');

// Imports
console.log('--- Imports ---');
assert(content.includes("import { format } from \"date-fns\""), 'imports date-fns format');
assert(content.includes('Car,') && content.includes('Calendar,') && content.includes('Hash'), 'imports Car, Calendar, Hash from lucide-react');

// BookingContext interface
console.log('\n--- BookingContext interface ---');
assert(content.includes('interface BookingContext'), 'BookingContext interface defined');
assert(content.includes('referenceNo: string'), 'interface has referenceNo field');
assert(content.includes('carName: string'), 'interface has carName field');
assert(content.includes('startDate: string'), 'interface has startDate field');
assert(content.includes('endDate: string'), 'interface has endDate field');

// State
console.log('\n--- State ---');
assert(content.includes('BookingContext | null'), 'bookingContext state typed as BookingContext | null');
assert(content.includes("useState<BookingContext | null>(null)"), 'bookingContext initialized to null');

// Supabase fetch effect
console.log('\n--- Supabase fetch effect ---');
assert(content.includes("if (!bookingId || status !== 'success') return"), 'effect guards on bookingId and success status');
assert(content.includes("'id, start_date, end_date, cars(brand, model)'"), 'selects id, start_date, end_date, and cars join');
assert(content.includes(".eq('id', bookingId)"), 'filters by bookingId');
assert(content.includes('.single()'), 'uses .single() for one row');
assert(content.includes('data.id.slice(-8).toUpperCase()'), 'derives referenceNo from last 8 chars of booking id');
assert(content.includes('`${car.brand} ${car.model}`'), 'constructs carName from brand + model');

// Rendered booking context card
console.log('\n--- Rendered booking context card ---');
assert(content.includes('{bookingContext && ('), 'conditionally renders bookingContext card');
assert(content.includes('<Hash'), 'renders Hash icon for reference number');
assert(content.includes('<Car'), 'renders Car icon for vehicle name');
assert(content.includes('<Calendar'), 'renders Calendar icon for dates');
assert(content.includes('bookingContext.referenceNo'), 'displays referenceNo');
assert(content.includes('bookingContext.carName'), 'displays carName');
assert(content.includes("format(new Date(bookingContext.startDate)"), 'formats startDate with date-fns');
assert(content.includes("format(new Date(bookingContext.endDate)"), 'formats endDate with date-fns');
assert(content.includes("'MMM d, yyyy'"), 'uses MMM d, yyyy date format');

// Fallback route fix (from BUG-048)
console.log('\n--- Fallback route ---');
assert(content.includes("'/renter-bookings'"), 'fallback route is /renter-bookings (not /bookings)');
assert(!content.includes("'/bookings'") || content.indexOf("'/bookings'") === -1 || (() => {
  // Allow '/renter-bookings' but not bare '/bookings'
  return !content.includes("= '/bookings'");
})(), 'does not use bare /bookings as fallback');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
