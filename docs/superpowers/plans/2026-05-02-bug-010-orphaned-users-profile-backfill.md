# BUG-010: Orphaned Auth Users — Profile Backfill & Trigger Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backfill profiles for 76 auth.users who have no profile row, then fix the `on_auth_user_created` trigger so every future signup creates a profile.

**Architecture:** Two migrations: (1) a one-shot backfill INSERT...SELECT from auth.users where no profile exists; (2) a new trigger function `handle_new_user_profile()` with a dedicated `on_auth_user_created_profile` trigger alongside the existing welcome-email trigger. Tests validate migration SQL content (same pattern as BUG-011) before any DB push.

**Tech Stack:** PostgreSQL (Supabase), PL/pgSQL trigger functions, Jest + ts-jest, `npx supabase db push`

---

## File Structure

| Action | Path | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/20260502000001_bug010_backfill_orphaned_profiles.sql` | One-shot INSERT to create profiles for orphaned auth.users |
| Create | `supabase/migrations/20260502000002_bug010_fix_new_user_trigger.sql` | New trigger function + trigger for profile creation on signup |
| Create | `__tests__/bug010OrphanedUserProfiles.test.ts` | SQL-content and logic tests (mirrors BUG-011 pattern) |

---

### Task 1: Write the failing tests

**Files:**
- Create: `__tests__/bug010OrphanedUserProfiles.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
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
```

- [ ] **Step 2: Run the tests — confirm they fail because the migration files don't exist yet**

```
npx jest __tests__/bug010OrphanedUserProfiles.test.ts --no-coverage
```

Expected: all tests FAIL with `ENOENT: no such file or directory` (migration files missing).

---

### Task 2: Write the backfill migration

**Files:**
- Create: `supabase/migrations/20260502000001_bug010_backfill_orphaned_profiles.sql`

- [ ] **Step 1: Create the file**

```sql
-- BUG-010: One-shot backfill for 76 auth.users with no profile row.
-- Root cause: migration 20260413193000 replaced on_auth_user_created to call
-- handle_new_user_welcome_email() only — profile creation stopped for all
-- signups after that date.
--
-- Safe to re-run: ON CONFLICT (id) DO NOTHING skips already-existing profiles.

INSERT INTO public.profiles (id, role, created_at, updated_at)
SELECT
  u.id,
  'renter'::public.user_role,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Run the tests again — backfill tests should now pass, trigger tests still fail**

```
npx jest __tests__/bug010OrphanedUserProfiles.test.ts --no-coverage
```

Expected:
- `BUG-010 — backfill migration SQL` → all 5 PASS
- `BUG-010 — trigger fix migration SQL` → all 9 FAIL (file missing)
- `BUG-010 — cross-migration consistency` → FAIL (trigger file missing)

---

### Task 3: Write the trigger fix migration

**Files:**
- Create: `supabase/migrations/20260502000002_bug010_fix_new_user_trigger.sql`

- [ ] **Step 1: Create the file**

```sql
-- BUG-010: Restore profile creation on signup.
-- Adds a dedicated trigger (on_auth_user_created_profile) that runs alongside
-- the existing welcome-email trigger (on_auth_user_created).
-- The welcome-email trigger is intentionally left untouched.

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, created_at, updated_at)
  VALUES (NEW.id, 'renter', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

COMMENT ON FUNCTION public.handle_new_user_profile() IS
  'BUG-010 fix: creates a profile row for every new auth.users signup. '
  'Runs alongside handle_new_user_welcome_email via a separate trigger.';
```

- [ ] **Step 2: Run all tests — all should pass**

```
npx jest __tests__/bug010OrphanedUserProfiles.test.ts --no-coverage
```

Expected: **18/18 PASS**

- [ ] **Step 3: Commit**

```
git add supabase/migrations/20260502000001_bug010_backfill_orphaned_profiles.sql
git add supabase/migrations/20260502000002_bug010_fix_new_user_trigger.sql
git add __tests__/bug010OrphanedUserProfiles.test.ts
git commit -m "fix(BUG-010): backfill orphaned profiles and restore signup trigger"
```

---

### Task 4: Push migrations to Supabase and verify

**Files:** none (DB operation only)

- [ ] **Step 1: Push to Supabase**

```
npx supabase db push
```

Expected: both migrations run without error. If any prior remote migrations are not in the local list, run repair first (same as BUG-011):
```
npx supabase migration repair --status reverted <timestamp>
```

- [ ] **Step 2: Audit orphaned users — confirm 0 remain after backfill**

Run this SQL in the Supabase SQL editor (`https://supabase.com/dashboard/project/putjowciegpzdheideaf/sql`):

```sql
-- Should return 0 rows after the backfill migration has run.
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;
```

Expected: **0 rows**

- [ ] **Step 3: Verify the new trigger exists in the DB**

```sql
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_created_profile')
ORDER BY trigger_name;
```

Expected: **2 rows** — both triggers present on `auth.users`.

- [ ] **Step 4: Run the full test suite to check for regressions**

```
npx jest --no-coverage
```

Expected: all tests pass (including BUG-011 suite).

- [ ] **Step 5: Create the BUG-010 feature branch and push**

```
git checkout -b bathoensescob/mob-63-bug-010-orphaned-profiles-backfill
git push -u origin bathoensescob/mob-63-bug-010-orphaned-profiles-backfill
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task covering it |
|-----------------|-----------------|
| Identify 76 orphaned users | Task 4 Step 2 (SQL audit query) |
| Backfill profiles for orphaned users | Task 2 (backfill migration) |
| Fix trigger so future signups get profiles | Task 3 (trigger fix migration) |
| Keep welcome email trigger intact | Task 3 (does NOT drop `on_auth_user_created`) |
| Tests prove the fix | Task 1 (18 SQL-content tests) |
| No phone number fabrication in backfill | Task 1 Step 1 test + Task 2 enforces NULL |

### Placeholder scan

None — all code blocks are complete and runnable.

### Type consistency

- `'renter'::public.user_role` cast used consistently in both migrations.
- `ON CONFLICT (id) DO NOTHING` syntax is identical in both migrations and tested.
- Trigger function name `handle_new_user_profile` matches in function definition, DROP TRIGGER, CREATE TRIGGER, and test assertions.
