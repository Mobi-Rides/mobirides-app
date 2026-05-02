#!/usr/bin/env tsx
/**
 * Duration Discounts — logic verification script
 *
 * Inlines the pure static methods from DynamicPricingService so the script
 * runs with plain `npx tsx` — no Supabase connection, no env vars needed.
 *
 * Usage:
 *   npx tsx scripts/verify-duration-discounts.ts
 */

import { differenceInDays, parseISO } from "date-fns";

// ─── types (mirrored from src/types/pricing.ts) ───────────────────────────────

enum PricingRuleType {
  DURATION    = "duration",
  WEEKLY      = "weekly",
  MONTHLY     = "monthly",
}

interface PricingConditions {
  min_duration_days?: number;
  max_duration_days?: number;
}

interface PricingRule {
  id: string;
  name: string;
  type: PricingRuleType | string;
  is_active: boolean;
  multiplier: number;
  conditions: PricingConditions;
  priority: number;
}

// ─── pure logic (mirrors DynamicPricingService) ───────────────────────────────

function evaluateDurationRule(rule: PricingRule, pickupDate: Date, returnDate: Date): boolean {
  const { min_duration_days, max_duration_days } = rule.conditions;
  if (min_duration_days === undefined) return false;
  const totalDays = differenceInDays(returnDate, pickupDate);
  if (totalDays < min_duration_days) return false;
  if (max_duration_days !== undefined && totalDays > max_duration_days) return false;
  return true;
}

function evaluateDurationRuleFromRequest(
  rule: PricingRule,
  pickupDateStr: string,
  returnDateStr: string
): boolean {
  if (!returnDateStr) return false;
  return evaluateDurationRule(rule, parseISO(pickupDateStr), parseISO(returnDateStr));
}

function generateRuleDescription(rule: PricingRule): string {
  const pct = rule.multiplier > 1
    ? `+${((rule.multiplier - 1) * 100).toFixed(0)}%`
    : `-${((1 - rule.multiplier) * 100).toFixed(0)}%`;
  if (rule.type === PricingRuleType.DURATION) return `Duration discount (${pct})`;
  return `${rule.name} (${pct})`;
}

function getDefaultDurationRules(): PricingRule[] {
  return [
    {
      id: "monthly-discount",
      name: "Monthly Discount",
      type: PricingRuleType.DURATION,
      is_active: true,
      multiplier: 0.8,
      priority: 65,
      conditions: { min_duration_days: 28 },
    },
    {
      id: "weekly-discount",
      name: "Weekly Discount",
      type: PricingRuleType.DURATION,
      is_active: true,
      multiplier: 0.9,
      priority: 60,
      conditions: { min_duration_days: 7, max_duration_days: 27 },
    },
  ];
}

// ─── runner ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function ok(label: string)  { console.log(`  ✓ ${label}`);  passed++; }
function fail(label: string, got?: unknown, want?: unknown) {
  console.error(`  ✗ ${label}`);
  if (want !== undefined) console.error(`    want: ${JSON.stringify(want)}`);
  if (got  !== undefined) console.error(`    got : ${JSON.stringify(got)}`);
  failed++;
}
function section(t: string) { console.log(`\n── ${t} ──`); }
function assert(label: string, actual: boolean, expected = true) {
  actual === expected ? ok(label) : fail(label, actual, expected);
}

// ─── fixtures ─────────────────────────────────────────────────────────────────

const weekly  = getDefaultDurationRules().find(r => r.conditions.min_duration_days === 7)!;
const monthly = getDefaultDurationRules().find(r => r.conditions.min_duration_days === 28)!;

function rental(n: number) {
  // Use midnight UTC dates to avoid timezone drift in differenceInDays
  const pickup = new Date("2026-06-01T00:00:00Z");
  const ret    = new Date("2026-06-01T00:00:00Z");
  ret.setUTCDate(ret.getUTCDate() + n);
  return { pickup, ret };
}

// ─── 1. evaluateDurationRule — boundaries ─────────────────────────────────────

section("1. evaluateDurationRule — boundary checks");

{ const { pickup, ret } = rental(3);
  assert("3 days  → weekly  = false", evaluateDurationRule(weekly,  pickup, ret), false);
  assert("3 days  → monthly = false", evaluateDurationRule(monthly, pickup, ret), false); }

{ const { pickup, ret } = rental(7);
  assert("7 days  → weekly  = true",  evaluateDurationRule(weekly,  pickup, ret), true);
  assert("7 days  → monthly = false", evaluateDurationRule(monthly, pickup, ret), false); }

{ const { pickup, ret } = rental(27);
  assert("27 days → weekly  = true",  evaluateDurationRule(weekly,  pickup, ret), true);
  assert("27 days → monthly = false", evaluateDurationRule(monthly, pickup, ret), false); }

{ const { pickup, ret } = rental(28);
  assert("28 days → weekly  = false", evaluateDurationRule(weekly,  pickup, ret), false);
  assert("28 days → monthly = true",  evaluateDurationRule(monthly, pickup, ret), true); }

{ const noMin = { ...weekly, conditions: {} };
  assert("no min_duration_days → false", evaluateDurationRule(noMin, new Date(), new Date()), false); }

// ─── 2. evaluateRule — parses ISO strings from request ────────────────────────

section("2. evaluateRule — parses pickup_date / return_date strings");

assert("3d  weekly  false", evaluateDurationRuleFromRequest(weekly,  "2026-06-01", "2026-06-04"), false);
assert("7d  weekly  true",  evaluateDurationRuleFromRequest(weekly,  "2026-06-01", "2026-06-08"), true);
assert("7d  monthly false", evaluateDurationRuleFromRequest(monthly, "2026-06-01", "2026-06-08"), false);
assert("28d monthly true",  evaluateDurationRuleFromRequest(monthly, "2026-06-01", "2026-06-29"), true);
assert("28d weekly  false", evaluateDurationRuleFromRequest(weekly,  "2026-06-01", "2026-06-29"), false);
assert("empty return → false", evaluateDurationRuleFromRequest(weekly, "2026-06-01", ""), false);

// ─── 3. generateRuleDescription ──────────────────────────────────────────────

section("3. generateRuleDescription");

assert('weekly  → "Duration discount (-10%)"', generateRuleDescription(weekly)  === "Duration discount (-10%)");
assert('monthly → "Duration discount (-20%)"', generateRuleDescription(monthly) === "Duration discount (-20%)");

// ─── 4. getDefaultDurationRules ───────────────────────────────────────────────

section("4. Default rules — weekly & monthly configured correctly");

{ const dur = getDefaultDurationRules();
  assert("2 rules",               dur.length === 2);
  assert("weekly  min = 7",       weekly.conditions.min_duration_days  === 7);
  assert("weekly  max = 27",      weekly.conditions.max_duration_days  === 27);
  assert("weekly  multiplier 0.9",weekly.multiplier                    === 0.9);
  assert("monthly min = 28",      monthly.conditions.min_duration_days === 28);
  assert("monthly max = undefined",monthly.conditions.max_duration_days === undefined);
  assert("monthly multiplier 0.8",monthly.multiplier                   === 0.8);
  assert("monthly priority > weekly", monthly.priority > weekly.priority); }

// ─── 5. Tiering — only highest-priority rule applies ─────────────────────────

section("5. Tiering — only highest-priority DURATION rule applied");

function applyDurationRules(pickupDate: string, returnDate: string) {
  const rules = getDefaultDurationRules().sort((a, b) => b.priority - a.priority);
  let multiplier = 1.0;
  const applied: string[] = [];
  let guard = false;
  for (const rule of rules) {
    if (guard) continue;
    if (evaluateDurationRuleFromRequest(rule, pickupDate, returnDate)) {
      guard = true;
      multiplier *= rule.multiplier;
      applied.push(rule.name);
    }
  }
  return { multiplier, applied, finalPrice: Math.round(100 * multiplier * 100) / 100 };
}

{ const r = applyDurationRules("2026-06-01", "2026-06-04"); // 3 days
  assert("3d:  no rule applied",      r.applied.length === 0);
  assert("3d:  multiplier = 1.0",     r.multiplier     === 1.0);
  assert("3d:  P100 → P100",          r.finalPrice     === 100); }

{ const r = applyDurationRules("2026-06-01", "2026-06-08"); // 7 days
  assert("7d:  Weekly Discount wins", r.applied[0]     === "Weekly Discount");
  assert("7d:  1 rule applied",       r.applied.length === 1);
  assert("7d:  multiplier = 0.9",     r.multiplier     === 0.9);
  assert("7d:  P100 → P90",           r.finalPrice     === 90); }

{ const r = applyDurationRules("2026-06-01", "2026-06-29"); // 28 days
  assert("28d: Monthly Discount wins",r.applied[0]     === "Monthly Discount");
  assert("28d: 1 rule applied",       r.applied.length === 1);
  assert("28d: multiplier = 0.8",     r.multiplier     === 0.8);
  assert("28d: P100 → P80",           r.finalPrice     === 80);
  assert("28d: no compounding (not 0.72)", r.multiplier !== 0.72); }

// ─── summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(44)}`);
console.log(`Passed: ${passed}  Failed: ${failed}`);

if (failed > 0) {
  console.error("\nDuration discounts verification FAILED");
  process.exit(1);
} else {
  console.log("\nDuration discounts verification PASSED");
}
