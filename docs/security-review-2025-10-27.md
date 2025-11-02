# MobiRides Security Review - October 27, 2025

## Executive Summary

This security review identifies critical vulnerabilities in the MobiRides car rental platform that could lead to data breaches, unauthorized access, and financial loss. The review found **10 security findings** requiring immediate attention.

**Severity Breakdown:**
- 🔴 Critical: 8 findings
- 🟡 High: 2 findings

**Key Risk Areas:**
1. Exposed service role keys in codebase
2. Publicly accessible user profiles and sensitive data
3. Missing RLS policies on critical tables
4. Insecure file storage permissions
5. Missing authentication checks

---

## Critical Findings (Immediate Action Required)

### 1. 🔴 Exposed Supabase Service Role Key

**Severity:** Critical  
**Risk:** Complete database compromise

**Issue:**
The Supabase service role key is hardcoded in `test-profile-migration.cjs`, exposing it to anyone with repository access. This key has full administrative access to the database, bypassing all RLS policies.

**Location:**
```javascript
// test-profile-migration.cjs
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // EXPOSED!
```

**Impact:**
- Attackers can read, modify, or delete any data
- Bypass all security policies
- Access sensitive user information
- Manipulate financial records

**Remediation:**
```javascript
// REMOVE the hardcoded key immediately
// Use environment variables instead:
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Add to .env (which should be in .gitignore):
// SUPABASE_SERVICE_ROLE_KEY=your_key_here

// Better: Delete test-profile-migration.cjs entirely if not needed
```

**Priority:** Immediate - Rotate the exposed key in Supabase dashboard

---

### 2. 🔴 Public Access to User Profiles

**Severity:** Critical  
**Risk:** Privacy violation, data harvesting

**Issue:**
The `profiles` table has a policy allowing anyone to read all user profiles, including sensitive information like phone numbers and addresses.

**Location:**
```sql
-- Current insecure policy
CREATE POLICY "profiles_read_all" ON profiles
FOR SELECT USING (true); -- DANGEROUS: Everyone can see everything!
```

**Impact:**
- Competitors can scrape user database
- Phone numbers and addresses exposed
- Privacy violations and GDPR non-compliance
- User trust erosion

**Remediation:**
```sql
-- Drop the insecure policy
DROP POLICY "profiles_read_all" ON profiles;

-- Create secure policies
CREATE POLICY "Users view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users view public profiles" ON profiles
FOR SELECT USING (
  -- Only show limited public info for others
  id IN (
    SELECT DISTINCT user_id FROM cars WHERE listed = true
  )
);

-- For public profile view, add a new view with limited fields
CREATE VIEW public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM profiles;
```

---

### 3. 🔴 Missing RLS on Wallet Transactions

**Severity:** Critical  
**Risk:** Financial data exposure

**Issue:**
`wallet_transactions` table may lack proper RLS policies, allowing users to view others' financial transactions.

**Impact:**
- Financial privacy violation
- Users can see payment amounts of others
- Potential for fraud detection evasion

**Remediation:**
```sql
-- Enable RLS if not enabled
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create secure policies
CREATE POLICY "Users view own transactions" ON wallet_transactions
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM host_wallets WHERE id = wallet_id
  )
);

CREATE POLICY "Admins view all transactions" ON wallet_transactions
FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM admins)
);
```

---

### 4. 🔴 Insecure Storage Bucket Permissions

**Severity:** Critical  
**Risk:** Unauthorized file access

**Issue:**
Storage buckets may allow public access to private documents like license verifications.

**Current Issue:**
```sql
-- license_verifications bucket may be public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('license_verifications', 'license_verifications', true); -- DANGER!
```

**Remediation:**
```sql
-- Ensure private buckets are private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'license_verifications';

-- Create proper storage policies
CREATE POLICY "Users upload own licenses" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'license_verifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users view own licenses" ON storage.objects
FOR SELECT USING (
  bucket_id = 'license_verifications' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.uid() IN (SELECT user_id FROM admins)
  )
);

CREATE POLICY "Admins view all licenses" ON storage.objects
FOR SELECT USING (
  bucket_id = 'license_verifications'
  AND auth.uid() IN (SELECT user_id FROM admins)
);
```

---

### 5. 🔴 Messages Accessible by Non-Participants

**Severity:** Critical  
**Risk:** Privacy violation

**Issue:**
Message tables might allow users to read conversations they're not part of.

**Remediation:**
```sql
-- For conversation_messages table
DROP POLICY IF EXISTS "Users view messages" ON conversation_messages;

CREATE POLICY "Participants view messages" ON conversation_messages
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- For direct messages table
CREATE POLICY "Participants view messages" ON messages
FOR SELECT USING (
  auth.uid() = sender_id 
  OR auth.uid() = receiver_id
);
```

---

### 6. 🔴 Missing Authentication on Edge Functions

**Severity:** Critical  
**Risk:** Unauthorized function execution

**Issue:**
Edge functions in `supabase/functions/` may not validate JWT tokens.

**Example Issue:**
```typescript
// add-admin/index.ts - No auth check visible!
serve(async (req) => {
  // Missing: JWT validation
  const { userId, isSuperAdmin } = await req.json();
  // ... inserts into admins table
});
```

**Remediation:**
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Validate JWT token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  // Verify user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify user is super admin
  const { data: admin } = await supabase
    .from('admins')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .single();

  if (!admin?.is_super_admin) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ... rest of function
});
```

---

### 7. 🔴 Unrestricted Admin Creation

**Severity:** Critical  
**Risk:** Privilege escalation

**Issue:**
The `add-admin` edge function may not properly verify that only super admins can add new admins.

**Remediation:**
- See finding #6 for authentication implementation
- Additionally, add database constraint:

```sql
-- Create function to prevent unauthorized admin creation
CREATE OR REPLACE FUNCTION check_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow if called by super admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid() 
    AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can manage admins';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_super_admin_only
  BEFORE INSERT OR UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION check_super_admin();
```

---

### 8. 🔴 Sensitive Data in User Metadata

**Severity:** Critical  
**Risk:** Data exposure through auth logs

**Issue:**
The migration script shows sensitive data (full_name, phone_number) stored in `raw_user_meta_data`, which may be logged or exposed through auth endpoints.

**Remediation:**
```typescript
// Instead of storing in metadata:
// ❌ Bad
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: userFullName,
      phone_number: userPhone, // Don't store here!
    }
  }
});

// ✅ Good - Store only in profiles table
const { data, error } = await supabase.auth.signUp({
  email,
  password
});

if (data.user) {
  await supabase.from('profiles').insert({
    id: data.user.id,
    full_name: userFullName,
    phone_number: userPhone
  });
}
```

---

## High Priority Findings

### 9. 🟡 Missing Input Validation

**Severity:** High  
**Risk:** SQL injection, XSS attacks

**Issue:**
Edge functions accept user input without validation.

**Remediation:**
```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const AddAdminSchema = z.object({
  userId: z.string().uuid(),
  userName: z.string().min(1).max(100),
  isSuperAdmin: z.boolean()
});

serve(async (req) => {
  const body = await req.json();
  
  // Validate input
  const validation = AddAdminSchema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid input', details: validation.error }),
      { status: 400 }
    );
  }
  
  const { userId, userName, isSuperAdmin } = validation.data;
  // ... rest of logic
});
```

---

### 10. 🟡 Missing Rate Limiting

**Severity:** High  
**Risk:** DoS attacks, brute force

**Issue:**
No rate limiting on edge functions or API endpoints.

**Remediation:**
```typescript
// Implement rate limiting middleware
import { RateLimiterMemory } from 'https://esm.sh/rate-limiter-flexible@2.4.1';

const rateLimiter = new RateLimiterMemory({
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
});

serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    await rateLimiter.consume(ip);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    );
  }
  
  // ... rest of logic
});
```

---

## Prioritized Remediation Plan

### Phase 1: Immediate (Today)
1. **Rotate exposed service role key** (Finding #1)
2. **Remove hardcoded secrets** from codebase
3. **Restrict profiles table access** (Finding #2)
4. **Add authentication to edge functions** (Finding #6)

### Phase 2: This Week
5. **Fix wallet transaction RLS** (Finding #3)
6. **Secure storage buckets** (Finding #4)
7. **Fix message access policies** (Finding #5)
8. **Secure admin creation** (Finding #7)

### Phase 3: Next Week
9. **Add input validation** (Finding #9)
10. **Implement rate limiting** (Finding #10)
11. **Move sensitive data from metadata** (Finding #8)

---

## Testing Checklist

After implementing fixes, verify:

- [ ] Service role key rotated and removed from codebase
- [ ] Unauthorized users cannot access other profiles
- [ ] Users can only see their own wallet transactions
- [ ] License documents are not publicly accessible
- [ ] Users cannot read messages they're not part of
- [ ] Edge functions reject unauthenticated requests
- [ ] Only super admins can create new admins
- [ ] Input validation prevents malformed data
- [ ] Rate limiting blocks excessive requests
- [ ] No sensitive data in auth metadata

---

## Security Best Practices Going Forward

1. **Never commit secrets** - Use environment variables and Supabase secrets
2. **Always enable RLS** - No table should be accessible without policies
3. **Validate all input** - Use Zod or similar validation libraries
4. **Authenticate edge functions** - Always verify JWT tokens
5. **Principle of least privilege** - Users should only access their own data
6. **Regular security audits** - Review security monthly
7. **Monitor logs** - Watch for suspicious activity
8. **Keep dependencies updated** - Patch security vulnerabilities

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Security](https://supabase.com/docs/guides/storage/security/access-control)
- [Edge Function Auth](https://supabase.com/docs/guides/functions/auth)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Review Date:** October 27, 2025  
**Next Review:** November 27, 2025  
**Status:** 🔴 Critical Issues Identified - Immediate Action Required
