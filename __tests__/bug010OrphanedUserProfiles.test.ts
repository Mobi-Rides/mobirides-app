// __tests__/bug010OrphanedUserProfiles.test.ts
import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.resolve(__dirname, "../supabase/migrations");

const BACKFILL_FILE = "20260502000001_bug010_backfill_orphaned_profiles.sql";
const TRIGGER_FILE  = "20260502000002_bug010_fix_new_user_trigger.sql";

// Collapse whitespace so formatting/alignment doesn't break string checks.
const backfillSQL = fs
  .readFileSync(path.join(MIGRATIONS_DIR, BACKFILL_FILE), "utf8")
  .replace(/\s+/g, " ");

const triggerSQL = fs
  .readFileSync(path.join(MIGRATIONS_DIR, TRIGGER_FILE), "utf8")
  .replace(/\s+/g, " ");

// ─── Backfill migration ───────────────────────────────────────────────────────

describe("BUG-010 — backfill migration SQL", () => {
  test("inserts into public.profiles", () => {
    expect(backfillSQL).toMatch(/INSERT INTO public\.profiles/i);
  });

  test("selects orphaned rows from auth.users via LEFT JOIN", () => {
    expect(backfillSQL).toMatch(/FROM auth\.users/i);
    expect(backfillSQL).toMatch(/LEFT JOIN public\.profiles/i);
    expect(backfillSQL).toMatch(/WHERE.*\.id IS NULL/i);
  });

  test("uses ON CONFLICT DO NOTHING to protect existing profiles", () => {
    expect(backfillSQL).toMatch(/ON CONFLICT.*DO NOTHING/i);
  });

  test("sets default role to renter", () => {
    expect(backfillSQL).toMatch(/['"]?renter['"]?/i);
  });

  test("does not set a random phone number for backfilled rows", () => {
    // Backfill must not fabricate phone numbers — use NULL instead.
    expect(backfillSQL).not.toMatch(/RANDOM\s*\(\s*\)/i);
  });
});

// ─── Trigger fix migration ────────────────────────────────────────────────────

describe("BUG-010 — trigger fix migration SQL", () => {
  test("creates handle_new_user_profile function", () => {
    expect(triggerSQL).toMatch(
      /CREATE OR REPLACE FUNCTION public\.handle_new_user_profile/i
    );
  });

  test("function returns trigger (not json)", () => {
    expect(triggerSQL).toMatch(/RETURNS TRIGGER/i);
  });

  test("function uses SECURITY DEFINER", () => {
    expect(triggerSQL).toMatch(/SECURITY DEFINER/i);
  });

  test("function inserts into profiles with ON CONFLICT DO NOTHING", () => {
    expect(triggerSQL).toMatch(/INSERT INTO public\.profiles/i);
    expect(triggerSQL).toMatch(/ON CONFLICT.*DO NOTHING/i);
  });

  test("function inserts role renter", () => {
    expect(triggerSQL).toMatch(/['"]?renter['"]?/i);
  });

  test("drops and recreates on_auth_user_created_profile trigger", () => {
    expect(triggerSQL).toMatch(
      /DROP TRIGGER IF EXISTS on_auth_user_created_profile/i
    );
    expect(triggerSQL).toMatch(
      /CREATE TRIGGER on_auth_user_created_profile/i
    );
  });

  test("trigger fires AFTER INSERT ON auth.users FOR EACH ROW", () => {
    expect(triggerSQL).toMatch(
      /AFTER INSERT ON auth\.users\s+FOR EACH ROW/i
    );
  });

  test("trigger calls handle_new_user_profile", () => {
    expect(triggerSQL).toMatch(/EXECUTE FUNCTION public\.handle_new_user_profile/i);
  });

  test("does NOT drop the welcome-email trigger on_auth_user_created", () => {
    // on_auth_user_created must stay; only the new _profile trigger is (re)created.
    // The pattern matches "on_auth_user_created" followed by a non-underscore to
    // avoid false-positive on "on_auth_user_created_profile".
    const dropsEmailTrigger =
      /DROP TRIGGER IF EXISTS on_auth_user_created[^_]/i.test(triggerSQL);
    expect(dropsEmailTrigger).toBe(false);
  });
});

// ─── Cross-migration consistency ─────────────────────────────────────────────

describe("BUG-010 — cross-migration consistency", () => {
  test("both migrations use ON CONFLICT DO NOTHING (idempotent)", () => {
    expect(backfillSQL).toMatch(/ON CONFLICT.*DO NOTHING/i);
    expect(triggerSQL).toMatch(/ON CONFLICT.*DO NOTHING/i);
  });

  test("both migrations set role to renter (consistent default)", () => {
    expect(backfillSQL).toMatch(/renter/i);
    expect(triggerSQL).toMatch(/renter/i);
  });
});
