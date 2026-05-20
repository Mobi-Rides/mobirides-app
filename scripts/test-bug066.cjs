/**
 * BUG-066 verification script — plain Node.js, no dependencies
 * Confirms useBookingPayment uses SPA navigation for same-origin URLs.
 *
 * Root cause:
 *  window.location.href = data.paymentUrl caused a full page reload for all
 *  payment redirects, destroying React/React Query state. Same-origin URLs
 *  (used by the mock and the /payment/return return path) should use
 *  React Router's navigate() to preserve SPA state.
 *
 * Fix:
 *  Detect origin of paymentUrl. Same-origin → navigate(). External → window.location.href.
 */

const fs = require('fs');
const path = require('path');

const HOOK = path.resolve(__dirname, '../src/hooks/useBookingPayment.ts');

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

console.log('\nBUG-066 — Payment redirect must not destroy SPA state for same-origin URLs\n');

const src = fs.readFileSync(HOOK, 'utf-8');

// ── Imports ───────────────────────────────────────────────────────────────

assert(
  'useNavigate imported from react-router-dom',
  src.includes("import { useNavigate } from 'react-router-dom'") ||
  src.includes('import { useNavigate } from "react-router-dom"')
);

// ── Hook instantiation ─────────────────────────────────────────────────────

assert(
  'useNavigate() called inside the hook',
  src.includes('useNavigate()')
);

// ── Origin detection ───────────────────────────────────────────────────────

assert(
  'URL constructor used to parse paymentUrl',
  src.includes('new URL(data.paymentUrl')
);

assert(
  'Same-origin check compares .origin to window.location.origin',
  src.includes('paymentUrl.origin === window.location.origin')
);

// ── Branched navigation ────────────────────────────────────────────────────

assert(
  'Same-origin path uses navigate() with pathname + search + hash',
  src.includes('navigate(paymentUrl.pathname + paymentUrl.search + paymentUrl.hash)')
);

assert(
  'External path still uses window.location.href',
  src.includes('window.location.href = data.paymentUrl')
);

// ── No unconditional hard redirect ─────────────────────────────────────────

assert(
  'window.location.href is inside an else branch (not unconditional)',
  (() => {
    // The window.location.href assignment must be in the else block,
    // meaning it appears AFTER the navigate() call and an else keyword
    const navigateIdx = src.indexOf('navigate(paymentUrl.pathname');
    const hrefIdx = src.indexOf('window.location.href = data.paymentUrl');
    const elseIdx = src.indexOf('} else {', navigateIdx);
    return navigateIdx !== -1 && elseIdx !== -1 && hrefIdx > elseIdx;
  })()
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
