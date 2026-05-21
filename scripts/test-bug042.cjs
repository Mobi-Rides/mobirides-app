/**
 * BUG-042 verification script — plain Node.js, no dependencies
 * Confirms the floating chat button is hidden on auth pages.
 *
 * Root cause:
 *  FloatingChatButton is fixed at bottom-[25vh] (~211px from bottom on iPhone 13/14),
 *  overlapping the Login/Signup submit button. ChatManager suppressed it on /messages
 *  but not on auth routes. Also used non-reactive window.location.pathname instead of
 *  useLocation().
 *
 * Fix:
 *  - Import useLocation from react-router-dom in ChatManager
 *  - Define AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']
 *  - hideFloatingButton = pathname === '/messages' || AUTH_ROUTES.includes(pathname)
 *  - Render condition uses hideFloatingButton instead of isOnMessagesPage
 */

const fs = require('fs');
const path = require('path');

const MANAGER = path.resolve(__dirname, '../src/components/chat/ChatManager.tsx');

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

console.log('\nBUG-042 — Floating chat button must not cover auth form controls on mobile\n');

const src = fs.readFileSync(MANAGER, 'utf-8');

// ── Import ─────────────────────────────────────────────────────────────────

assert(
  'useLocation imported from react-router-dom',
  src.includes('useLocation') && src.includes('react-router-dom')
);

// ── Auth routes defined ────────────────────────────────────────────────────

assert(
  '/login in suppression list',
  src.includes("'/login'")
);

assert(
  '/signup in suppression list',
  src.includes("'/signup'")
);

assert(
  '/forgot-password in suppression list',
  src.includes("'/forgot-password'")
);

assert(
  '/reset-password in suppression list',
  src.includes("'/reset-password'")
);

// ── Reactive pathname ──────────────────────────────────────────────────────

assert(
  'useLocation() used instead of window.location.pathname',
  src.includes('useLocation()') && !src.includes('window.location.pathname')
);

// ── Render condition updated ───────────────────────────────────────────────

assert(
  'FloatingChatButton render condition uses hideFloatingButton',
  src.includes('hideFloatingButton')
);

assert(
  'Old isOnMessagesPage check removed from render condition',
  !src.includes('isOnMessagesPage')
);

// ── /messages still suppressed ─────────────────────────────────────────────

assert(
  '/messages route still suppressed in hideFloatingButton logic',
  src.includes("pathname === '/messages'") || src.includes('"/messages"')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
