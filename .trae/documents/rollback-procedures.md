# Rollback Procedures — v2.4.0

Last Updated: December 4, 2025

## Pre-Rollback Preparation

- Snapshot database before applying migrations
- Document current migration state: `npx supabase migration list --linked`
- Backup any data that might be affected

## Rollback Triggers

Initiate rollback if:
- Critical security vulnerability discovered post-deploy
- Data corruption detected
- >5% error rate sustained for 30+ minutes
- Core booking flow broken

## Rollback Steps

### If Deployment Fails

1. Revert frontend to previous build
2. Rollback latest migration batch:
   ```bash
   npx supabase migration repair <timestamp> --status reverted --linked
   ```
3. Restore feature flags to previous state
4. Notify team in #incidents channel

### If Migration Fails

1. Check migration logs: `npx supabase db reset --local` to reproduce
2. Fix migration file locally
3. Mark failed migration as reverted in production:
   ```bash
   npx supabase migration repair <timestamp> --status reverted --linked
   ```
4. Apply corrected migration

### If Types Regeneration Fails

1. Check for migration history drift:
   ```bash
   npx supabase migration list --linked
   ```
2. Mark any remote-only migrations as reverted
3. Retry types regeneration

## Post-Rollback Verification

1. Validate: run smoke tests
2. Confirm audit logs show expected state
3. Verify all core flows working
4. Document incident in post-mortem

## Recovery Commands Reference

```bash
# Check migration status
npx supabase migration list --linked

# Mark migration as reverted
npx supabase migration repair <timestamp> --status reverted --linked

# Mark migration as applied (for recovery migrations)
npx supabase migration repair <timestamp> --status applied --linked

# Regenerate types
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts

# Local database reset (testing)
npx supabase db reset --local
```

## Contact Chain

1. Arnold (Infrastructure Lead)
2. Teboho (SuperAdmin)
3. Duma (Revenue Features)

