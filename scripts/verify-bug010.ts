#!/usr/bin/env tsx
/**
 * BUG-010 live verification script
 *
 * Verifies via a SECURITY DEFINER RPC (no email sending, no service role key needed):
 *   1. on_auth_user_created_profile trigger exists on auth.users
 *   2. on_auth_user_created (welcome email) trigger still exists
 *   3. Zero orphaned auth.users remain after the backfill
 *
 * Usage:
 *   npx tsx scripts/verify-bug010.ts
 *
 * Optional env overrides:
 *   ADMIN_EMAIL     (default: bathoensescob@gmail.com)
 *   ADMIN_PASSWORD  (default: Hawdybitch25)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL    = "https://putjowciegpzdheideaf.supabase.co";
const ANON_KEY        = "sb_publishable_gGmqR81ZdJV5HOwbeWgPAA_nSZsQER6";
const ADMIN_EMAIL     = process.env.ADMIN_EMAIL    ?? "bathoensescob@gmail.com";
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD ?? "Hawdybitch25";

let passed = 0;
let failed = 0;

function pass(msg: string)              { console.log(`  ✓ ${msg}`);  passed++; }
function fail(msg: string, d?: unknown) { console.error(`  ✗ ${msg}`); if (d) console.error("    →", d); failed++; }
function section(title: string)         { console.log(`\n── ${title} ──`); }

async function main() {
  console.log("BUG-010 Verification Script");
  console.log(`Project : ${SUPABASE_URL}\n`);

  // ── Sign in as admin ────────────────────────────────────────────────────────
  section("1. Admin sign-in");

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authErr || !auth.session) {
    fail("Sign-in failed", authErr?.message);
    process.exit(1);
  }
  pass(`Signed in as ${ADMIN_EMAIL}`);

  // ── Call verify_bug010_fix() RPC ────────────────────────────────────────────
  section("2. DB verification (via SECURITY DEFINER RPC)");

  const { data, error } = await client.rpc("verify_bug010_fix" as never);

  if (error) {
    fail("RPC call failed", error.message);
    process.exit(1);
  }

  const result = data as {
    profile_trigger_exists: boolean;
    email_trigger_exists:   boolean;
    orphaned_user_count:    number;
    total_profiles:         number;
  };

  console.log(`    total profiles         : ${result.total_profiles}`);
  console.log(`    orphaned users         : ${result.orphaned_user_count}`);
  console.log(`    profile trigger exists : ${result.profile_trigger_exists}`);
  console.log(`    email trigger exists   : ${result.email_trigger_exists}`);

  if (result.profile_trigger_exists) {
    pass("on_auth_user_created_profile trigger exists — new signups will get a profile");
  } else {
    fail("on_auth_user_created_profile trigger is MISSING — new signups will NOT get a profile");
  }

  if (result.email_trigger_exists) {
    pass("on_auth_user_created (welcome email) trigger still exists — untouched");
  } else {
    fail("on_auth_user_created trigger is MISSING — welcome emails will stop");
  }

  if (result.orphaned_user_count === 0) {
    pass(`Zero orphaned users — all ${result.total_profiles} auth.users have profiles`);
  } else {
    fail(`${result.orphaned_user_count} auth.users still have no profile after backfill`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(44)}`);
  console.log(`Passed: ${passed}  Failed: ${failed}`);

  if (failed > 0) {
    console.error("\nBUG-010 verification FAILED");
    process.exit(1);
  } else {
    console.log("\nBUG-010 verification PASSED");
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
