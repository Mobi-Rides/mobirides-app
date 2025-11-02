# Migration Fixes for "Already Exists" Errors

## Overview
Update all Supabase migration files to add existence checks for CREATE POLICY statements and other objects to prevent "already exists" errors during migration runs.

## Steps to Complete

### 1. Update Base Schema (20230101000000_create_base_schema.sql)
- [ ] Add DROP POLICY IF EXISTS before each CREATE POLICY statement
- [ ] Verify types already have existence checks (they do)

### 2. Update Other Migration Files with CREATE POLICY
- [ ] 20250130000010_fix_conversation_participant_access.sql
- [ ] 20250131000000_add_reviews_insert_policy.sql
- [ ] 20250131000001_add_reviews_insert_policy_only.sql
- [ ] 20250617110215-6caa5559-84b1-44d2-bfe2-210551f3bb21.sql
- [ ] 20250724124757-bce471c6-7cc9-4dd1-bd16-0583eeae5a61.sql
- [ ] 20250724125106-56d04362-c8ce-4f2c-91f4-1fecd0255c34.sql
- [ ] 20250726204653-a375b057-db71-442d-8737-ed76aa6537c7.sql
- [ ] 20250724190906-fcaf826e-0aee-4b22-8ee8-9cd8c11842ee.sql
- [ ] 20250717135129-b0bd7be6-2982-4672-815a-6438b4e9fd55.sql
- [ ] 20250724124602-ea160716-098a-438c-bf3f-739f1048d429.sql
- [ ] And any other files identified with CREATE POLICY

### 3. Verification
- [ ] Run migrations to ensure no more "already exists" errors
- [ ] Test database integrity

## Pattern for Fixes
For each CREATE POLICY:
```
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name ...
```

For types (already handled):
```
DO $$ BEGIN
    CREATE TYPE ... 
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
