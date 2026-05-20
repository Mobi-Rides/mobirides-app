/**
 * BUG-046 verification script — plain Node.js, no dependencies
 * Tests that "Export CSV" and "Export PDF" buttons are wired to real implementations.
 *
 * Root cause:
 *  exportData() in HostBookings.tsx was a stub — it showed a toast but called no
 *  export utility. exportToCSV utility existed and was unused; jsPDF + jspdf-autotable
 *  were already in package.json but never used for this feature.
 *
 * Fix:
 *  - Imported exportToCSV from @/utils/exportToCSV
 *  - Imported jsPDF and autoTable from jspdf / jspdf-autotable
 *  - Replaced stub with real CSV (exportToCSV) and PDF (jsPDF + autoTable + doc.save) logic
 *  - Guard for empty filtered list shows a destructive toast instead of silently exporting nothing
 */

const fs = require('fs');
const path = require('path');

const PAGE = path.resolve(__dirname, '../src/pages/HostBookings.tsx');

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

console.log('\nBUG-046 — Export CSV/PDF must trigger real file downloads\n');

const src = fs.readFileSync(PAGE, 'utf-8');

// ── Imports ───────────────────────────────────────────────────────────────────

assert(
  'exportToCSV imported from @/utils/exportToCSV',
  src.includes('import { exportToCSV }') && src.includes('@/utils/exportToCSV')
);

assert(
  'jsPDF imported from jspdf',
  src.includes("from \"jspdf\"") || src.includes("from 'jspdf'")
);

assert(
  'autoTable imported from jspdf-autotable',
  src.includes("from \"jspdf-autotable\"") || src.includes("from 'jspdf-autotable'")
);

// ── CSV implementation ────────────────────────────────────────────────────────

assert(
  'exportToCSV is called inside exportData',
  src.includes('exportToCSV(rows,')
);

assert(
  'CSV export uses filteredAndSortedBookings',
  src.includes('filteredAndSortedBookings.map')
);

assert(
  'CSV filename includes host_bookings',
  src.includes('host_bookings_')
);

// ── PDF implementation ────────────────────────────────────────────────────────

assert(
  'new jsPDF() is instantiated for PDF export',
  src.includes('new jsPDF()')
);

assert(
  'autoTable is called for PDF layout',
  src.includes('autoTable(doc,')
);

assert(
  'doc.save() triggers the browser download',
  src.includes('doc.save(')
);

assert(
  'PDF filename includes host_bookings',
  (src.match(/host_bookings_.*\.pdf/g) || []).length >= 1
);

// ── Guard for empty list ──────────────────────────────────────────────────────

assert(
  'empty-list guard prevents export and shows toast',
  src.includes('Nothing to export') || src.includes('nothing to export')
);

// ── Stub removed ──────────────────────────────────────────────────────────────

assert(
  'stub comment "Export functionality implementation" is removed',
  !src.includes('Export functionality implementation')
);

assert(
  '"Export Started" toast (stub) is removed',
  !src.includes('"Export Started"')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
