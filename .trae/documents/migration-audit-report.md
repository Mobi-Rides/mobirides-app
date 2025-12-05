# Migration Audit Report — Phase 1 & 2

Release: v2.4.0  
Last Updated: December 4, 2025  
Scope: Review 378 archives + production table audit

## Summary
- Reviewed payments, wallets, notifications, storage buckets
- Classified migrations: keep, consolidate, safe-to-delete
- Discovered additional orphaned production tables
- Identified legacy messaging system for cleanup

## Phase 1 Findings (November 2025)
- Storage admin policy recursion detected in verification buckets → consolidated fix with public.is_admin()
- Wallets allow owner UPDATE → removed, restrict to service_role only
- Audit logs view policy tied to profiles.role → unified to public.is_admin()

## Phase 2 Findings (December 4, 2025)

### Migration File Issues
| Issue | Files Affected | Action |
|-------|---------------|--------|
| Spaces in filenames | 2 migrations | Rename (breaks branch seeding) |
| Empty placeholder | `20251125145805_create_admins_table.sql` | Delete |
| Production-specific data | `20251201135103_create_profiles_for_6_legacy_users.sql` | Delete |

### Orphaned Production Tables (No CREATE TABLE migrations)
| Category | Tables | Priority |
|----------|--------|----------|
| Email System | `email_delivery_logs`, `email_analytics_daily`, `email_performance_metrics`, `email_suppressions`, `email_webhook_events` | High |
| E2E Encryption | `identity_keys`, `file_encryption`, `device_tokens`, `auth_tokens` | High |
| Content | `blog_posts` | Medium |
| Monitoring | `provider_health_metrics` | Medium |

### Legacy Messaging Cleanup Required
| Item | Status | Action |
|------|--------|--------|
| `message_operations` table | Empty, RLS disabled | DROP |
| `messages_with_replies` view | Legacy | DROP |
| `messages` table | No longer used | Archive to `archive` schema |
| `notifications_backup`, `notifications_backup2` | Backups | Archive/DROP |

### Security Finding
- `message_operations` table has RLS **DISABLED** - security risk, must be dropped

## Actions Completed (Phase 1)
- Applied MOBI-502 migrations to fix storage, wallet, audit logs
- Documented duplication candidates for Phase 2 consolidation

## Actions Required (Phase 2)
1. Rename 2 migration files (remove spaces)
2. Delete 2 problematic migrations
3. Create 4 new migrations for orphaned tables
4. Create 1 migration for legacy messaging cleanup
5. Mark new migrations as applied in production

## Technical Debt Resolution
- Items #3 (Dual Message Systems) → RESOLVED via legacy cleanup
- Items #15 (Incomplete Message Migration) → RESOLVED via legacy cleanup

## Next Steps
- Arnold to implement Phase 2 fixes
- Verify TypeScript build passes
- Test Supabase branch seeding

