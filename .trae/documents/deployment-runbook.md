# Deployment Runbook — v2.4.0

Last Updated: December 4, 2025

## Pre-Deployment Checklist

### Migration Health
- [ ] Verify no files with spaces in migration names
- [ ] Run `npx supabase migration list --linked` - confirm all synced
- [ ] Verify types are up to date: `npx supabase gen types typescript --linked`
- [ ] Run `npm run build` - verify 0 TypeScript errors

### Build Verification
- [ ] Lint: `npm run lint` passes
- [ ] Build: `npm run build` passes
- [ ] Migrations dry-run: `npx supabase db reset --local` succeeds

### Feature Flags
- DYNAMIC_PRICING: on
- INSURANCE_V2: off initially (toggle after validation)
- SUPERADMIN_ANALYTICS: on for admins

## Deployment Steps

1. Merge `feature` branches into `release/v2.4.0`
2. Run final build verification
3. Apply migrations in order:
   ```bash
   # For new migrations only
   npx supabase db push --linked
   ```
4. Deploy frontend
5. Verify health endpoints and core flows

## Migration Repair Commands

If migrations need to be marked as applied in production:
```bash
npx supabase migration repair <timestamp> --status applied --linked
```

If migrations need to be reverted:
```bash
npx supabase migration repair <timestamp> --status reverted --linked
```

## Post-Deployment Verification

1. [ ] Health check endpoints responding
2. [ ] Core booking flow functional
3. [ ] Admin dashboard accessible
4. [ ] Real-time notifications working
5. [ ] Types regeneration succeeds: `npx supabase gen types typescript --linked`

## Post-Deploy Actions

- Toggle INSURANCE_V2 flag after validation
- Monitor audit logs for 24h
- Review error rates in dashboard

## Emergency Contacts

- Infrastructure: Arnold
- SuperAdmin: Teboho
- Revenue Features: Duma

