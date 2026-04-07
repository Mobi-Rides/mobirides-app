# Phase 2: Revised Approach

## Problem Identified

The original Phase 2 approach tried to use `supabase migration repair` on migrations that don't exist locally. This fails because the CLI requires migration files to exist.

## Revised Strategy

Instead of trying to mark archived/production-only migrations as "applied", we:

1. **Rename local files** to match production timestamps (fixes +1 sec drift)
2. **Create placeholder files** for the 7 dashboard-created migrations
3. **Let Supabase CLI handle sync** automatically when we check status

## Why This Works

The `supabase migration list --linked` command compares:
- Local migration files in `supabase/migrations/`
- Production migration records in `schema_migrations` table

By creating placeholder files for production-only migrations, the CLI will recognize them as "already applied" and won't try to re-run them.

## Migrations That Are Already Synced

These migrations exist in production's `schema_migrations` but we **don't need to create placeholders** for them because they're in our archive folder or have been superseded:

- `20241220` - In archive, schema already exists
- `20241220000002` - In archive, schema already exists
- `20241230` - In archive, schema already exists
- `20250120000005` - In archive, schema already exists
- `20250120000006` - In archive, schema already exists
- `20251024100000` - In archive, schema already exists

## Migrations Needing Placeholders

These 7 migrations were created via Dashboard (Nov 23-25) and need placeholder files:

1. `20251123131016` - Reviews table (functionality exists via local migrations)
2. `20251123131109` - Push subscription helpers (exists via local migrations)
3. `20251123131135` - Wallet notification function (exists via local migrations)
4. `20251124105912` - Notification enum values (exists via local migrations)
5. `20251124110205` - Fix notification functions (exists via local migrations)
6. `20251124110226` - Wallet notification enums (exists via local migrations)
7. `20251125145805` - Admins table (exists via local migrations)

## Next Steps After Phase 2

Once placeholder files are created and local files are renamed:

1. Run `npx supabase migration list --linked`
2. Identify which local migrations still show as "Local only"
3. In Phase 3, we'll mark those remaining ~96 migrations as applied in production

## Key Difference from Original Plan

**Original Plan:** Use `migration repair` to mark migrations as applied  
**Revised Plan:** Create placeholder files + let CLI auto-detect status

This is cleaner and doesn't require manual repair commands for each migration.
