# Foreign Key Standardization Migration Plan

## Overview
This plan addresses the inconsistent foreign key relationships in the MobiRides database where multiple tables incorrectly reference `auth.users(id)` directly instead of following the standard Supabase pattern of referencing `profiles(id)`.

## Affected Tables & Columns
- `user_verifications` - `user_id` column
- `vehicle_condition_reports` - `reporter_id` column  
- `conversations` - `created_by` column
- `conversation_participants` - `user_id` column
- `notifications` - `user_id` column

## Migration Strategy: Zero-Downtime Approach

### Phase 1: Preparation & Validation (Day 1)
1. **Database Backup**
   - Create full database backup
   - Verify backup integrity
   - Document current state

2. **Data Integrity Check**
   - Verify all referenced user IDs exist in both `auth.users` and `profiles`
   - Identify any orphaned records
   - Document inconsistencies

3. **Current State Analysis**
   ```sql
   -- Check for orphaned records in each table
   SELECT 'user_verifications' as table_name, COUNT(*) as orphaned_count
   FROM user_verifications uv
   LEFT JOIN profiles p ON uv.user_id = p.id
   WHERE p.id IS NULL
   
   UNION ALL
   
   SELECT 'vehicle_condition_reports', COUNT(*)
   FROM vehicle_condition_reports vcr
   LEFT JOIN profiles p ON vcr.reporter_id = p.id
   WHERE p.id IS NULL
   
   -- ... repeat for other tables
   ```

### Phase 2: Migration Implementation (Days 2-4)

#### Step 1: Update `user_verifications` table
```sql
-- 1.1: Verify foreign key constraint doesn't exist
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'user_verifications' AND constraint_type = 'FOREIGN KEY';

-- 1.2: Add proper foreign key constraint
ALTER TABLE user_verifications 
ADD CONSTRAINT fk_user_verifications_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 1.3: Update RLS policies if needed
-- (Check existing policies first)
```

#### Step 2: Update `vehicle_condition_reports` table
```sql
-- 2.1: Add foreign key constraint
ALTER TABLE vehicle_condition_reports 
ADD CONSTRAINT fk_vehicle_condition_reports_profiles 
FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2.2: Verify constraint works
SELECT COUNT(*) FROM vehicle_condition_reports vcr
JOIN profiles p ON vcr.reporter_id = p.id;
```

#### Step 3: Update `conversations` table
```sql
-- 3.1: Add foreign key constraint
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_profiles 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3.2: Update RLS policies to use profiles table
DROP POLICY IF EXISTS "conversations_authenticated_insert" ON conversations;
CREATE POLICY "conversations_authenticated_insert" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());
```

#### Step 4: Update `conversation_participants` table
```sql
-- 4.1: Add foreign key constraint
ALTER TABLE conversation_participants 
ADD CONSTRAINT fk_conversation_participants_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4.2: Update RLS policies
-- Review and update participant-related policies
```

#### Step 5: Update `notifications` table
```sql
-- 5.1: Add foreign key constraint
ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5.2: Verify notification functions work with new constraints
```

### Phase 3: RLS Policy Updates (Day 5)

#### 3.1: Review All RLS Policies
- Audit all existing RLS policies on affected tables
- Identify policies that might reference auth.users directly
- Update policies to work with profiles table relationships

#### 3.2: Update Database Functions
```sql
-- Update functions like is_conversation_participant if needed
-- Ensure they work with the new foreign key structure
```

### Phase 4: Testing & Validation (Day 6)

#### 4.1: Functional Testing
- Test conversation creation and messaging
- Verify notification system works
- Test user verification flows
- Validate vehicle condition reporting

#### 4.2: Performance Testing
```sql
-- Test query performance with new foreign keys
EXPLAIN ANALYZE SELECT * FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
JOIN profiles p ON cp.user_id = p.id
WHERE p.id = 'test-user-id';
```

#### 4.3: Data Integrity Verification
```sql
-- Verify all foreign key constraints are working
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('user_verifications', 'vehicle_condition_reports', 'conversations', 'conversation_participants', 'notifications');
```

## Risk Assessment & Mitigation

### High-Risk Areas
1. **RLS Policy Failures** - Could block user access
   - Mitigation: Test policies thoroughly in staging
   - Rollback: Keep original policies documented

2. **Data Loss** - Foreign key constraints could prevent operations
   - Mitigation: Clean orphaned data first
   - Rollback: Remove constraints if issues arise

3. **Performance Impact** - New constraints might slow queries
   - Mitigation: Add appropriate indexes
   - Monitor: Query performance before/after

### Rollback Procedures

#### Immediate Rollback (If issues during migration)
```sql
-- Remove foreign key constraints
ALTER TABLE user_verifications DROP CONSTRAINT IF EXISTS fk_user_verifications_profiles;
ALTER TABLE vehicle_condition_reports DROP CONSTRAINT IF EXISTS fk_vehicle_condition_reports_profiles;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_profiles;
ALTER TABLE conversation_participants DROP CONSTRAINT IF EXISTS fk_conversation_participants_profiles;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_profiles;
```

#### Post-Migration Rollback (If issues discovered later)
1. Document all issues found
2. Restore from backup if critical
3. Re-run migration with fixes

## Success Criteria
- [ ] All foreign key constraints successfully added
- [ ] No orphaned records in any table
- [ ] All RLS policies function correctly
- [ ] Frontend messaging system works without errors
- [ ] Performance remains acceptable
- [ ] All tests pass

## Timeline
- **Day 1**: Preparation & validation
- **Day 2**: Migrate user_verifications & vehicle_condition_reports
- **Day 3**: Migrate conversations & conversation_participants  
- **Day 4**: Migrate notifications table
- **Day 5**: Update RLS policies and functions
- **Day 6**: Testing & validation

## Dependencies
- Database access with migration permissions
- Staging environment for testing
- Backup and restore capabilities
- Performance monitoring tools

## Communication Plan
- Notify users of potential brief service interruptions
- Keep stakeholders updated on migration progress
- Document any issues encountered
- Provide post-migration status report

---

**Next Steps**: After approval, we'll implement this plan starting with Phase 1 preparation and validation.