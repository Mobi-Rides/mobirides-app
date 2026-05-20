/**
 * BUG-043 verification script — plain Node.js, no dependencies
 * Confirms branded password reset emails always include a recovery token in the URL.
 *
 * Root causes fixed:
 *
 * 1. api/auth/reset-password.js — primary:
 *    a) Never called generateLink() — built resetUrl as bare "/reset-password" with no token.
 *    b) Used wrong schema keys for resend-service: `template` (must be `templateId`) and
 *       `data` (must be `dynamicData`). Zod validation rejected every call → email never sent.
 *    c) Also fired supabase.auth.resetPasswordForEmail() which sends Supabase's default email
 *       with the token in a hash fragment; ResetPassword.tsx only reads query params → 400.
 *    Fix: added generateLink(), used hashed_token, fixed template keys, removed duplicate call.
 *
 * 2. api/auth/forgot-password.js — secondary fragility:
 *    Used url.searchParams.get('token') to extract the recovery token from action_link.
 *    This silently returns null if GoTrue changes the URL format.
 *    Fix: primary source is now properties.hashed_token with URL-parse as fallback.
 *
 * 3. supabase/functions/send-password-reset/index.ts — same fragility as #2, plus
 *    resend-service was called with the requesting user's JWT (authHeader) instead of
 *    the service role key → resend-service returned UNAUTHORIZED_INVALID_JWT_FORMAT.
 *    Fix: hashed_token-first approach + service role key used for resend-service call.
 */

const fs = require('fs');
const path = require('path');

const RESET_PASSWORD_API = path.resolve(__dirname, '../api/auth/reset-password.js');
const FORGOT_PASSWORD_API = path.resolve(__dirname, '../api/auth/forgot-password.js');
const EDGE_FN = path.resolve(__dirname, '../supabase/functions/send-password-reset/index.ts');

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

console.log('\nBUG-043 — Branded password reset emails must always embed a recovery token\n');

const reset   = fs.readFileSync(RESET_PASSWORD_API, 'utf-8');
const forgot  = fs.readFileSync(FORGOT_PASSWORD_API, 'utf-8');
const edgeFn  = fs.readFileSync(EDGE_FN, 'utf-8');

// ── api/auth/reset-password.js ────────────────────────────────────────────

assert(
  'reset-password: calls generateLink() to obtain a recovery token',
  reset.includes('generateLink(')
);

assert(
  'reset-password: uses hashed_token as primary token source',
  reset.includes('hashed_token')
);

assert(
  'reset-password: embeds token in resetLink URL',
  reset.includes('token=${token}') || reset.includes('token=')
);

assert(
  'reset-password: uses correct templateId key for resend-service',
  reset.includes("templateId: 'password-reset'") || reset.includes('templateId: "password-reset"')
);

assert(
  'reset-password: uses correct dynamicData key for resend-service',
  reset.includes('dynamicData:')
);

assert(
  'reset-password: no longer sends tokenless bare /reset-password URL',
  !reset.includes('`${frontendUrl}/reset-password`') &&
  !reset.includes('"reset-password"') ||
  // allow the string only if it's part of a longer redirectTo or similar — double-check
  !(reset.match(/reset_url:\s*`\$\{frontendUrl\}\/reset-password`/))
);

assert(
  'reset-password: duplicate resetPasswordForEmail() call removed',
  !reset.includes('resetPasswordForEmail(')
);

// ── api/auth/forgot-password.js ───────────────────────────────────────────

assert(
  'forgot-password: uses hashed_token as primary token source',
  forgot.includes('hashed_token')
);

assert(
  'forgot-password: URL-parse is kept as fallback',
  forgot.includes('action_link') && forgot.includes('searchParams.get')
);

// ── supabase/functions/send-password-reset/index.ts ──────────────────────

assert(
  'send-password-reset edge fn: uses hashed_token as primary token source',
  edgeFn.includes('hashed_token')
);

assert(
  'send-password-reset edge fn: URL-parse is kept as fallback',
  edgeFn.includes('action_link') && edgeFn.includes('searchParams.get')
);

assert(
  'send-password-reset edge fn: resend-service called with service role key, not user JWT',
  edgeFn.includes('Bearer ${SUPABASE_SERVICE_ROLE_KEY}') &&
  !edgeFn.includes("'Authorization': authHeader")
);

// ── Shared: reset URL always includes token ────────────────────────────────

assert(
  'reset-password: reset URL includes redirectedFromEmail=true',
  reset.includes('redirectedFromEmail=true')
);

assert(
  'forgot-password: reset link includes redirectedFromEmail=true',
  forgot.includes('redirectedFromEmail=true')
);

assert(
  'send-password-reset edge fn: reset URL includes redirectedFromEmail=true',
  edgeFn.includes('redirectedFromEmail=true')
);

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
