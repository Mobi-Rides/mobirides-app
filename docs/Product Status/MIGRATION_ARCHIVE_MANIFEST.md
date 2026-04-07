# Migration Archive Manifest
**Last Updated:** December 5, 2025

## Purpose
This manifest documents the `supabase/migrations/archive/` directory contents.
**Do not restore files from the archive without first checking for active counterparts.**

## Archive Categories

### Safe to Keep Archived (No Action Needed)

| Directory | Reason Archived |
|-----------|-----------------|
| `address-confirmation-enum/` | Enum values exist in base schema |
| `audit-logs-rls-fixes/` | Consolidated into recovery migrations |
| `column-name-fixes/` | Fixes applied in subsequent migrations |
| `conversation-recursion/` | RLS recursion issue fixed in consolidation |
| `diagnostic-queries/` | Not schema changes - just diagnostic SQL |
| `duplicate-timestamps/` | True duplicates (different naming conventions) |
| `empty-migrations/` | Empty placeholder files |
| `handover-pickup-location-fixes/` | Superseded by `20250130000029_fix_pickup_coordinates_references.sql` |
| `is-admin-conflicts/` | Superseded by conversation RLS consolidation |
| `notification-duplicates/` | Consolidated into notification system overhaul |
| `production-specific/` | Data inserts for specific production users |
| `reviews-policy-duplicates/` | Duplicate RLS policies |
| `role-notifications-fixes/` | Consolidated into role-based notifications |
| `superseded-by-november-recovery/` | All have active counterparts |
| `superseded-december-2025/` | Superseded by newer implementations |
| `superseded-december-2025-placeholders/` | Empty placeholders |
| `timestamp-collisions/` | Naming convention duplicates |

### Reviewed and Partially Restored

| Directory | Status |
|-----------|--------|
| `handle-new-user-fixes/` | `on_auth_user_created` trigger RESTORED to active migrations |
| `undated-migrations/` | HTTP extension RESTORED; `create_renter_arrival_notification` FIXED via new migration |

## Quick Reference: What Was Restored

1. **`20241230_fix_handle_new_user_metadata_extraction.sql`**
   - Source: `handle-new-user-fixes/`
   - Contains: `on_auth_user_created` trigger, `handle_new_user()` function
   - Status: Moved to active migrations

2. **`202510150609_enable_http_extension.sql`**
   - Source: `undated-migrations/`
   - Contains: HTTP extension creation
   - Status: Moved to active migrations

3. **`create_renter_arrival_notification` function**
   - Source: `duplicate-timestamps/20250130000027_add_renter_arrival_notification.sql`
   - Issue: Used wrong column names (`c.make`, `b.pickup_location`, `message`, `booking_id`)
   - Status: **Fixed and deployed** via new migration with correct columns

## Audit History

| Date | Action | By |
|------|--------|-----|
| 2025-12-05 | Full archive audit completed | Lovable AI |
| 2025-12-05 | Restored 2 migrations, fixed 1 function | Lovable AI |
| 2025-11-20 | Initial archive organization | Team |
