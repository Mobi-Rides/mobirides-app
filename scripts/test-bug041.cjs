/**
 * BUG-041 verification script — plain Node.js, no dependencies
 * Confirms auth form labels are readable in dark mode.
 *
 * Root cause:
 *  1. label.tsx had no text color class — labels inherited parent color. With
 *     bg-white form containers (non-adaptive) and dark mode flipping CSS
 *     --foreground to a light value, labels became white-on-white.
 *  2. Login.tsx and signup.tsx used hardcoded bg-gray-50 / bg-white / text-gray-900
 *     / text-gray-600 — none of which adapt to dark mode.
 *
 * Fix:
 *  - label.tsx: added text-foreground to base labelVariants
 *  - Login.tsx: bg-background, text-foreground, text-muted-foreground, bg-card, border-border
 *  - signup.tsx: same replacements
 */

const fs = require('fs');
const path = require('path');

const LABEL   = path.resolve(__dirname, '../src/components/ui/label.tsx');
const LOGIN   = path.resolve(__dirname, '../src/pages/Login.tsx');
const SIGNUP  = path.resolve(__dirname, '../src/pages/signup.tsx');

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

console.log('\nBUG-041 — Auth form labels must be readable in dark mode\n');

const labelSrc  = fs.readFileSync(LABEL,  'utf-8');
const loginSrc  = fs.readFileSync(LOGIN,  'utf-8');
const signupSrc = fs.readFileSync(SIGNUP, 'utf-8');

// ── label.tsx ──────────────────────────────────────────────────────────────

assert(
  'label.tsx includes text-foreground in base variants',
  labelSrc.includes('text-foreground')
);

assert(
  'label.tsx does NOT hardcode a gray text color',
  !labelSrc.includes('text-gray-')
);

// ── Login.tsx ──────────────────────────────────────────────────────────────

assert(
  'Login page background uses bg-background (semantic)',
  loginSrc.includes('bg-background')
);

assert(
  'Login heading uses text-foreground (semantic)',
  loginSrc.includes('text-foreground')
);

assert(
  'Login subtext uses text-muted-foreground (semantic)',
  loginSrc.includes('text-muted-foreground')
);

assert(
  'Login form card uses bg-card (semantic)',
  loginSrc.includes('bg-card')
);

assert(
  'Login form card border uses border-border (semantic)',
  loginSrc.includes('border-border')
);

assert(
  'Login.tsx does NOT use bg-gray-50',
  !loginSrc.includes('bg-gray-50')
);

assert(
  'Login.tsx does NOT use bg-white',
  !loginSrc.includes('bg-white')
);

assert(
  'Login.tsx does NOT use text-gray-900',
  !loginSrc.includes('text-gray-900')
);

// ── signup.tsx ─────────────────────────────────────────────────────────────

assert(
  'Signup page background uses bg-background (semantic)',
  signupSrc.includes('bg-background')
);

assert(
  'Signup heading uses text-foreground (semantic)',
  signupSrc.includes('text-foreground')
);

assert(
  'Signup subtext uses text-muted-foreground (semantic)',
  signupSrc.includes('text-muted-foreground')
);

assert(
  'signup.tsx does NOT use bg-gray-50',
  !signupSrc.includes('bg-gray-50')
);

assert(
  'signup.tsx does NOT use text-gray-900',
  !signupSrc.includes('text-gray-900')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
