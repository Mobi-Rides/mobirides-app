/**
 * BUG-050 verification script — plain Node.js, no dependencies
 * Confirms the "Download PDF" button on ReceiptModal is wired to a real implementation.
 *
 * Root cause:
 *  handleDownload() in ReceiptModal.tsx was a stub — only called console.log()
 *  with a "Future implementation for PDF download" comment. No PDF was ever built.
 *
 * Fix:
 *  - Imported jsPDF and jspdf-autotable (already in package.json)
 *  - Implemented handleDownload() using the same jsPDF + autoTable pattern as
 *    pdfGenerator.ts and HostBookings.tsx (BUG-046)
 *  - Builds a receipt PDF with booking details + payment summary tables
 *  - Calls doc.save(`receipt_<id>_<date>.pdf`) to trigger the browser download
 */

const fs = require('fs');
const path = require('path');

const MODAL = path.resolve(__dirname, '../src/components/shared/ReceiptModal.tsx');

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

console.log('\nBUG-050 — Download PDF button must trigger a real browser download\n');

const src = fs.readFileSync(MODAL, 'utf-8');

// ── Imports ───────────────────────────────────────────────────────────────

assert(
  'jsPDF imported from jspdf',
  src.includes("from \"jspdf\"") || src.includes("from 'jspdf'")
);

assert(
  'autoTable imported from jspdf-autotable',
  src.includes("from \"jspdf-autotable\"") || src.includes("from 'jspdf-autotable'")
);

// ── Implementation ────────────────────────────────────────────────────────

assert(
  'new jsPDF() instantiated inside handleDownload',
  src.includes('new jsPDF()')
);

assert(
  'autoTable called to build booking details section',
  (src.match(/autoTable\(doc,/g) || []).length >= 2
);

assert(
  'doc.save() triggers the browser download',
  src.includes('doc.save(')
);

assert(
  'receipt filename includes receipt number and date',
  src.includes('receipt_') && src.includes('.pdf`')
);

assert(
  'booking details included: vehicle, renter, dates',
  src.includes('booking.cars.brand') &&
  src.includes('booking.renter') &&
  src.includes('booking.start_date')
);

assert(
  'payment summary included: total_price',
  src.includes('booking.total_price')
);

// ── Stub removed ──────────────────────────────────────────────────────────

assert(
  '"Future implementation" stub comment removed',
  !src.includes('Future implementation for PDF download')
);

assert(
  'console.log stub call removed',
  !src.includes("console.log('Download receipt")
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
