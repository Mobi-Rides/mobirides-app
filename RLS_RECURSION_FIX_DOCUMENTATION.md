# RLS Recursion Fix Documentation

## Problem Summary

The system was experiencing "infinite recursion detected in policy for relation 'messages'" errors during:
1. Storage file listing operations (`storage.list()`)
2. Direct messages table access

This prevented users from accessing their verification files and messages.

## Root Cause Analysis

The introspection revealed that:
- Storage operations trigger `storage.search()` which evaluates RLS policies on `storage.objects`
- Some policy on `storage.objects` was referencing the `messages` table
- Some policy on `messages` was referencing back to `storage.objects` or a related function
- This created a circular dependency causing infinite recursion

## Solution Approach

### 1. Policy Simplification
- **Remove all cross-table references** in RLS policies
- **Inline all function calls** to prevent function-based recursion
- **Use only direct auth.uid() comparisons** and built-in functions

### 2. Messages Table Policies
Created simplified policies that only reference the messages table itself:
- `Users can view their own messages`: `auth.uid() = sender_id OR auth.uid() = receiver_id`
- `Users can insert their own messages`: `auth.uid() = sender_id`
- `Users can update their own messages`: `auth.uid() = sender_id`
- `Admins can view all messages`: `EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())`

### 3. Storage Objects Policies
Created simplified policies that only reference the storage objects:
- `Users can manage their verification files`: Uses `storage.foldername()` to check user ownership
- `verification_admin_read_all`: Inlined admin check for verification buckets

### 4. Key Changes
- **No more cross-table references** in any USING or WITH CHECK clauses
- **All function calls inlined** to prevent function dispatch recursion
- **Only direct auth.uid() comparisons** and built-in PostgreSQL functions

## Files Created

1. **`fix-rls-recursion-comprehensive.sql`** - The complete SQL migration
2. **`test-rls-recursion-fix.js`** - Verification test script
3. **`comprehensive-rls-analysis.js`** - Diagnostic analysis script

## Testing Strategy

1. **Run the fix migration** to apply the simplified policies
2. **Execute the test script** to verify all operations work:
   - Sign-in authentication
   - Direct messages access
   - File upload to verification bucket
   - File listing (the main failing scenario)
   - Signed URL creation
3. **Confirm no recursion errors** occur during any operation

## Expected Outcome

After applying this fix:
- ✅ Users can list their verification files without recursion errors
- ✅ Users can access their messages without recursion errors  
- ✅ File uploads continue to work as before
- ✅ All existing functionality is preserved
- ✅ No infinite recursion in any RLS policy evaluation

## Rollback Plan

If issues arise:
1. The migration can be reversed by dropping the new policies
2. Previous policy definitions can be restored from backup
3. The system can be reverted to the previous state

## Next Steps

1. Apply the `fix-rls-recursion-comprehensive.sql` migration
2. Run `node test-rls-recursion-fix.js` to verify the fix
3. Test the original verification upload flow
4. Monitor for any new recursion issues
5. Document any additional policy optimizations needed