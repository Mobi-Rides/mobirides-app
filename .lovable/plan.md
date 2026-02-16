

## Revised Migration History Recovery Plan (Branch-Safe)

### Root Cause Analysis

Lovable's migration tool applied local `.sql` files to the remote DB but recorded them with **deployment timestamps** instead of file timestamps. This created a two-way mismatch:

| Remote Timestamp (phantom) | Actual Local File | Local Timestamp |
|---|---|---|
| `20260115101900` | `20260115000002_create_message_reactions.sql` | `20260115000002` |
| `20260205073041` | `20260204000000_create_payment_tables.sql` | `20260204000000` |
| `20260205153215` | `20260205000003_add_awaiting_payment_enum.sql` | `20260205` prefix |
| `20260207114919` | `20260207000003_fix_wallet_transactions_length.sql` | `20260207` prefix |
| `20260207155058` | `20260207000004_fix_withdrawal_function.sql` | `20260207` prefix |
| `20260207155420` | `20260207000005_setup_cron_jobs.sql` | `20260207` prefix |

These 6 have matching local files -- just wrong remote timestamps.

The remaining 6 have **NO local file** -- the SQL only exists in remote:

| Remote Timestamp | Migration Name | Content |
|---|---|---|
| `20260124122840` | `enforce_message_edit_limit` | UPDATE policy with 10-min edit window |
| `20260125215428` | `fix_chat_policies_properly` | Security definer function for chat RLS |
| `20260215111101` | `interactive_handover_overhaul` | Major handover schema changes |
| `20260215112918` | `add_handover_progress_rpc` | Handover progress RPC function |
| `20260215113344` | `interactive_handover_refinement` | Handover refinements |
| `20260215121650` | (empty name) | Unknown -- needs investigation |

### Why Placeholders Would Break Branching

1. **Branch seeding** runs all local files on a fresh DB. Empty placeholders = missing tables, functions, and policies on branches.
2. **Branch merging** compares migration histories. Mismatched timestamps cause merge failures.
3. **Future `db push`** could try to re-apply or skip migrations incorrectly.

---

### Phase 1: Extract Missing SQL from Remote

For the 6 remote-only migrations with no local file, we must create local files containing the **actual SQL** from the remote `schema_migrations.statements` column.

**Files to create (with real SQL content, not placeholders):**
1. `supabase/migrations/20260124122840_enforce_message_edit_limit.sql` -- 10-minute message edit policy
2. `supabase/migrations/20260125215428_fix_chat_policies_properly.sql` -- Chat RLS security definer fix
3. `supabase/migrations/20260215111101_interactive_handover_overhaul.sql` -- Handover schema overhaul
4. `supabase/migrations/20260215112918_add_handover_progress_rpc.sql` -- Handover progress RPC
5. `supabase/migrations/20260215113344_interactive_handover_refinement.sql` -- Handover refinements
6. `supabase/migrations/20260215121650_dashboard_applied_migration.sql` -- Investigate content; if truly empty, use a comment-only file

Using the remote timestamps as filenames ensures perfect alignment with what production already tracks.

### Phase 2: Fix Duplicate Local Timestamps

Three local files share the `20260207` prefix (no full timestamp). Rename to unique timestamps:

- `20260205_add_awaiting_payment_enum.sql` -> `20260205000003_add_awaiting_payment_enum.sql` (already has this name)
- `20260207000003_fix_wallet_transactions_length.sql` (already unique)
- `20260207000004_fix_withdrawal_function.sql` (already unique)
- `20260207000005_setup_cron_jobs.sql` (already unique)

Check: the user's original `migration list` showed three rows with just `20260207` as local. Need to verify the actual filenames match -- if they are literally `20260207_*.sql` without the 6-digit suffix, rename them to include the suffix.

### Phase 3: Delete Phantom Remote Entries

Remove the 6 phantom remote entries (where the local file exists with a different timestamp) so they don't conflict:

```text
npx supabase migration repair 20260115101900 --status reverted --linked
npx supabase migration repair 20260205073041 --status reverted --linked
npx supabase migration repair 20260205153215 --status reverted --linked
npx supabase migration repair 20260207114919 --status reverted --linked
npx supabase migration repair 20260207155058 --status reverted --linked
npx supabase migration repair 20260207155420 --status reverted --linked
```

### Phase 4: Mark All Local Files as Applied in Remote

After Phase 3, mark every local-only timestamp as applied so remote tracking matches:

```text
npx supabase migration repair 20260113224929 --status applied --linked
npx supabase migration repair 20260115000001 --status applied --linked
npx supabase migration repair 20260115000002 --status applied --linked
npx supabase migration repair 20260126000000 --status applied --linked
npx supabase migration repair 20260204000000 --status applied --linked
npx supabase migration repair 20260205000003 --status applied --linked
npx supabase migration repair 20260207000003 --status applied --linked
npx supabase migration repair 20260207000004 --status applied --linked
npx supabase migration repair 20260207000005 --status applied --linked
npx supabase migration repair 20260215021631 --status applied --linked
npx supabase migration repair 20260215121651 --status applied --linked
npx supabase migration repair 20260216120000 --status applied --linked
```

(Adjust timestamps if Phase 2 renames change them.)

### Phase 5: Verify

1. Run `npx supabase migration list --linked` -- every row should show matching Local and Remote columns
2. Test branch creation: `npx supabase branches create test-branch` -- seeding should complete without errors
3. Run `npx supabase db reset` locally -- all migrations should apply cleanly on fresh DB

### Execution Order

Phase 1 and 2 can run in parallel (file creation/renaming). Phase 3 must run before Phase 4 (delete phantoms before marking locals). Phase 5 is verification after everything else.

### Risk Assessment

- **Schema is intact** -- all SQL has already been executed on production. This plan only fixes tracking metadata.
- **Branch-safe** -- real SQL in every local file means branch seeding produces a complete schema.
- **Merge-safe** -- 1:1 timestamp alignment between local and remote eliminates merge conflicts.
- **Rollback** -- if anything goes wrong, `migration repair --status applied` and `--status reverted` are reversible operations.

