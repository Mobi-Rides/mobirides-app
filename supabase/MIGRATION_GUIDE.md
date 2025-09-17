# Supabase RLS Policy Migration Guide

## Problem Resolved

The 500 Internal Server Error when accessing the conversations endpoint was caused by **infinite recursion in Row Level Security (RLS) policies**. The error message "infinite recursion detected in policy for relation 'conversations'" indicated that the RLS policies were creating circular dependencies.

## Root Cause

The issue occurred because:
1. RLS policies on the `conversations` table were referencing other tables that also had RLS policies
2. These cross-references created circular dependencies causing infinite recursion
3. The policies were not optimized and were causing performance issues

## Solution Applied

A comprehensive migration script (`20250115000002_fix_rls_infinite_recursion.sql`) was created and applied that:

### 1. Temporarily Disabled RLS
- Disabled RLS on all affected tables to prevent recursion during policy updates
- Safely dropped all existing problematic policies

### 2. Recreated Non-Recursive Policies
- **Conversations Table**: Users can view/modify conversations they participate in or created
- **Conversation Participants**: Users can manage participants in conversations they created or are admins of
- **Conversation Messages**: Users can send/view messages in conversations they participate in

### 3. Optimized Policy Logic
- Used direct participant checks instead of recursive policy references
- Added proper indexes to optimize policy performance
- Ensured policies use `auth.uid()` for user identification

### 4. Granted Proper Permissions
- Granted necessary CRUD permissions to `authenticated` role
- Granted read permissions to `anon` role for public access

## Migration Script Details

### Key Policy Changes:

#### Conversations Table
```sql
-- Non-recursive policy for viewing conversations
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversations.id
            AND cp.user_id = auth.uid()
        )
    );
```

#### Performance Optimizations
```sql
-- Added indexes for policy optimization
CREATE INDEX idx_conversation_participants_user_conversation 
    ON public.conversation_participants(user_id, conversation_id);
CREATE INDEX idx_conversations_created_by 
    ON public.conversations(created_by);
```

## Verification

After applying the migration:
- ✅ GET requests to `/conversations` return 200 OK
- ✅ No more "infinite recursion" errors
- ✅ RLS policies are properly enforced
- ✅ Performance is optimized with proper indexes

## How to Apply This Migration to Other Projects

### Step 1: Create Migration File
```bash
# Create a new migration file in your supabase/migrations directory
touch supabase/migrations/YYYYMMDD_fix_rls_recursion.sql
```

### Step 2: Copy Migration Content
Copy the content from `20250115000002_fix_rls_infinite_recursion.sql` to your new migration file.

### Step 3: Apply Migration
```bash
# Using Supabase CLI
supabase db push

# Or apply specific migration
supabase migration up
```

### Step 4: Verify
```bash
# Test your endpoints
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://your-project.supabase.co/rest/v1/conversations?select=*"
```

## Best Practices for RLS Policies

1. **Avoid Circular References**: Don't create policies that reference tables with their own RLS policies
2. **Use Direct Checks**: Use EXISTS clauses with direct table references instead of policy-dependent queries
3. **Optimize with Indexes**: Create indexes on columns used in policy conditions
4. **Test Thoroughly**: Always test policies with actual API calls
5. **Monitor Performance**: Use `EXPLAIN ANALYZE` to check policy performance

## Troubleshooting

If you encounter similar issues:

1. **Check for Recursion**: Look for policies that reference other tables with RLS
2. **Simplify Policies**: Break complex policies into simpler, non-recursive ones
3. **Add Indexes**: Ensure proper indexes exist for policy conditions
4. **Test Incrementally**: Apply policies one at a time to identify problematic ones

## Security Considerations

- All policies maintain proper security by checking `auth.uid()`
- Users can only access conversations they participate in
- Conversation creators have additional privileges
- Anonymous users have read-only access where appropriate

The migration successfully resolves the infinite recursion issue while maintaining security and improving performance.