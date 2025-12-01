## 📋 **PHASE 2: COMMUNITY FEATURES UNBLOCKING (SECURITY-AWARE)**

**Duration:** Week 3 (5 days) - **Revised to Week 7 (Post-Part 1 Completion)**  
**Total Story Points:** 26 SP  
**Priority:** HIGH  
**Dependencies:** Phase 1 Complete (has_role() function working)  
**Maintenance Window Required:** Yes (1 hour for migration)

### **Epic: MOBI-SEC-201 - Fix Community Feature RLS Policies**

**Why This Depends on Phase 1:**
- Phase 1 established `has_role()` function for secure admin checks
- Can now use `has_role()` in policies without triggering RLS recursion
- Part 1 consolidated conversation policies, enabling safe replacement

**Community-First Context:**
This phase prioritizes **community functionality** while protecting sensitive data. MobiRides is a peer-to-peer platform where users need to:
- Message each other about bookings
- View profiles of car owners/renters
- See car listings and availability
- Read reviews and ratings

---

### **December 1, 2025 Security Audit Findings Integration**

The December 1 security audit identified 8 vulnerabilities with varying priorities based on community context:

#### **🔴 CRITICAL (Immediate Fix - Pure Security)**
1. **Service Role Key Exposed** - In `.env`, test scripts, NOT in `.gitignore`
2. **message_operations RLS Disabled** - Anyone can view message operations
3. **Privilege Escalation Risk** - Users can set own `profiles.role` to 'admin'
4. **add-admin Function** - No super admin check before creating admins

#### **🟠 HIGH (Community-Aware Fixes)**
5. **profiles_read_all Policy** - Exposes PII (phone, emergency contacts, location)
   - ⚠️ **Community Context:** Users need to see profiles for messaging/bookings
   - ✅ **Solution:** Column-level restriction via `public_profiles` view (detailed below)

#### **🟡 MEDIUM (Evaluate Intent)**
6. **Admin Emails Public** - `Anyone can view admin list` policy
   - May be intentional for community transparency
7. **Edge Functions Without JWT** - Some may be intentionally public
8. **Security Definer Views** - Function search path issues

---

### **Community-Aware Profile Access Strategy**

**Problem:** Current `profiles_read_all` policy exposes ALL profile data to authenticated users, including:
- ❌ `phone_number` - Private contact info
- ❌ `emergency_contact_name`, `emergency_contact_phone` - Sensitive data
- ❌ `latitude`, `longitude` - Location tracking risk
- ❌ `id_photo_url` - Identity documents
- ❌ `role` - Can enable privilege escalation

**Wrong Approach:** ❌ Block all profile access (breaks community features)
- Messaging would show no sender/recipient names
- Car listings wouldn't show host information
- Reviews wouldn't show reviewer identity
- Trust system would break completely

**Right Approach:** ✅ Column-level restriction via database view

#### **Solution: Create `public_profiles` View**

**Story ID:** MOBI-SEC-211  
**Story Points:** 5 SP  
**Priority:** P0 - CRITICAL (Community UX + Security)

```sql
-- ============================================================================
-- CREATE PUBLIC PROFILES VIEW - Community-Aware Profile Access
-- ============================================================================
-- 
-- PURPOSE:
-- Provide safe, column-restricted access to user profiles for community features
-- while protecting sensitive PII (phone numbers, location, emergency contacts)
--
-- WHAT'S EXPOSED (Safe for Community):
-- - id: For relationships (cars, bookings, reviews)
-- - full_name: For display in listings, messages, reviews
-- - avatar_url: For profile pictures
-- - verification_status: For trust badges
-- - created_at: For "member since" badges
--
-- WHAT'S PROTECTED (Sensitive PII):
-- - phone_number: Private contact info
-- - emergency_contact: Private emergency data
-- - latitude/longitude: Location tracking risk
-- - id_photo_url: Identity documents
-- - role: Privilege escalation risk
--
-- PHASE: Part 2, Phase 2
-- STORY: MOBI-SEC-211
-- ============================================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;

-- Create public profiles view
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  verification_status,
  created_at,
  -- Add any other safe display fields
  is_verified,
  rating_average,  -- If available
  total_rentals    -- If available
FROM public.profiles
WHERE is_verified = true;  -- Only show verified users publicly

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;  -- For public car browsing

COMMENT ON VIEW public.public_profiles IS 
  'Community-safe profile view. Exposes only non-sensitive data needed for car listings, messaging, and reviews. Protects phone numbers, location, and emergency contacts.';

-- Users can still see their own full profile
CREATE POLICY "users_can_view_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Car owners can see renter profiles (for active bookings only)
CREATE POLICY "hosts_can_view_active_renter_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT b.renter_id
    FROM public.bookings b
    JOIN public.cars c ON c.id = b.car_id
    WHERE c.owner_id = auth.uid()
      AND b.status IN ('confirmed', 'active')
  )
);

-- Renters can see host profiles (for active bookings only)
CREATE POLICY "renters_can_view_active_host_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT c.owner_id
    FROM public.bookings b
    JOIN public.cars c ON c.id = b.car_id
    WHERE b.renter_id = auth.uid()
      AND b.status IN ('confirmed', 'active')
  )
);

-- Update frontend to use public_profiles view
-- Frontend code changes:
-- ❌ OLD: SELECT * FROM profiles WHERE id = ?
-- ✅ NEW: SELECT * FROM public_profiles WHERE id = ?
```

**Community Features Preserved:**
- ✅ Users can see host names and avatars on car listings
- ✅ Messaging shows sender/recipient names
- ✅ Reviews display reviewer names
- ✅ Trust badges show verification status
- ✅ Active booking participants see each other's full profiles

**Sensitive Data Protected:**
- ❌ Phone numbers hidden from other users
- ❌ Emergency contacts private
- ❌ Location coordinates not exposed
- ❌ ID photos/documents secured
- ❌ Role column not accessible (prevents privilege escalation)

---

### **Edge Function Authentication Strategy (Community-Aware)**

**Story ID:** MOBI-SEC-212  
**Story Points:** 3 SP  
**Priority:** P1 - HIGH

The December 1 audit found several edge functions without JWT verification. This table provides a community-aware strategy:

| Function | Current JWT | Recommended | Rationale |
|----------|-------------|-------------|-----------|
| `add-admin` | ✅ YES | ✅ YES + Super Admin check | **CRITICAL**: Must verify caller is super admin, not just authenticated |
| `suspend-user` | ✅ YES | ✅ YES + Admin check | **HIGH**: Privilege operation, verify caller is admin |
| `migrate-user-profiles` | ❌ NO | 🔴 REMOVE/SECURE | **CRITICAL**: Lists all users - extremely dangerous if public |
| `get-mapbox-token` | ❌ NO | ⚠️ Consider JWT | **MEDIUM**: Prevent API abuse, but affects UX (users need maps before auth) |
| `booking-cleanup` | ❌ NO | ✅ YES (cron only) | **HIGH**: Internal operation, should not be publicly callable |
| `booking-reminders` | ❌ NO | ✅ YES (cron only) | **HIGH**: Internal operation, should not be publicly callable |
| `get-vapid-key` | ❌ NO | ⚠️ Evaluate | **LOW**: May be intentional for push notifications |
| `notify-reverification` | ❌ NO | ✅ YES (admin only) | **MEDIUM**: Admin operation |
| `send-whatsapp` | ❌ NO | ✅ YES | **MEDIUM**: Prevent abuse of messaging |

**Implementation:**

1. **Update `supabase/config.toml`:**
```toml
[functions.add-admin]
verify_jwt = true

[functions.suspend-user]
verify_jwt = true

[functions.booking-cleanup]
verify_jwt = true

[functions.booking-reminders]
verify_jwt = true

[functions.notify-reverification]
verify_jwt = true

[functions.send-whatsapp]
verify_jwt = true

# Evaluate based on UX impact:
[functions.get-mapbox-token]
verify_jwt = true  # Recommended

[functions.get-vapid-key]
verify_jwt = false  # May be intentional
```

2. **Add Authorization Checks to `add-admin/index.ts`:**
```typescript
// After getting the auth header
const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

// Verify caller is super admin
const { data: callerAdmin } = await supabaseClient
  .from('admins')
  .select('is_super_admin')
  .eq('id', user.id)
  .single();

if (!callerAdmin?.is_super_admin) {
  return new Response(
    JSON.stringify({ error: 'Only super admins can add admins' }), 
    { status: 403 }
  );
}
```

3. **Remove or Secure `migrate-user-profiles`:**
```bash
# Option 1: Delete entirely if no longer needed
rm supabase/functions/migrate-user-profiles/index.ts

# Option 2: Add super admin check + JWT
# (Similar to add-admin authorization above)
```

---

### **Epic: MOBI-202 - Improve Conversation Visibility**

**Duration:** Week 3 (3 days)  
**Total Story Points:** 13 SP  
**Priority:** HIGH  
**Dependencies:** Phase 1 Complete (has_role() function working)  
**Maintenance Window Required:** No

**Problem:**

*   Current RLS policies on `message_operations` table are too permissive.
*   Anyone can view message operations, leading to potential data leaks.

**Goal:**

*   Restrict access to `message_operations` to authorized users only.
*   Ensure that users can only view message operations related to their own conversations.

**Stories:**

#### **Story 3.1: Secure message_operations Table**

**Story ID:** MOBI-202-1  
**Story Points:** 3 SP  
**Priority:** P0 - CRITICAL

*   Disable the current `message_operations_read_all` policy.
*   Implement a new policy that allows users to view message operations only if they are a participant in the conversation.

```sql
-- Disable the current policy
DROP POLICY IF EXISTS "message_operations_read_all" ON public.message_operations;

-- Create a new policy that restricts access to authorized users only
CREATE POLICY "message_operations_read_authorized" ON public.message_operations FOR
SELECT
    TO authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                public.conversations_participants
            WHERE
                conversations_participants.conversation_id = message_operations.conversation_id
                AND conversations_participants.user_id = auth.uid ()
        )
    );
```

#### **Story 3.2: Secure conversations Table**

**Story ID:** MOBI-202-2  
**Story Points:** 3 SP  
**Priority:** P0 - CRITICAL

*   Implement a policy that allows users to view conversations only if they are a participant in the conversation.

```sql
-- Create a new policy that restricts access to authorized users only
CREATE POLICY "conversations_read_authorized" ON public.conversations FOR
SELECT
    TO authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                public.conversations_participants
            WHERE
                conversations_participants.conversation_id = conversations.id
                AND conversations_participants.user_id = auth.uid ()
        )
    );
```

#### **Story 3.3: Secure conversations_participants Table**

**Story ID:** MOBI-202-3  
**Story Points:** 3 SP  
**Priority:** P0 - CRITICAL

*   Implement a policy that allows users to view conversation participants only if they are a participant in the conversation.

```sql
-- Create a new policy that restricts access to authorized users only
CREATE POLICY "conversations_participants_read_authorized" ON public.conversations_participants FOR
SELECT
    TO authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                public.conversations_participants AS cp
            WHERE
                cp.conversation_id = conversations_participants.conversation_id
                AND cp.user_id = auth.uid ()
        )
    );
```

#### **Story 3.4: Test Conversation Visibility**

**Story ID:** MOBI-202-4  
**Story Points:** 4 SP  
**Priority:** P1 - HIGH

*   Create test cases to verify that users can only view message operations, conversations, and conversation participants related to their own conversations.
*   Ensure that unauthorized users cannot access these resources.

### **Epic: MOBI-203 - Improve Car Visibility**

**Duration:** Week 4 (3 days)  
**Total Story Points:** 13 SP  
**Priority:** HIGH  
**Dependencies:** Phase 1 Complete (has_role() function working)  
**Maintenance Window Required:** No

**Problem:**

*   Current RLS policies on `cars` table are too permissive.
*   Anyone can view all cars, leading to potential data leaks.

**Goal:**

*   Restrict access to `cars` to authorized users only.
*   Ensure that users can only view cars that are either owned by them or are available for rent.

**Stories:**

#### **Story 4.1: Secure cars Table**

**Story ID:** MOBI-203-1  
**Story Points:** 3 SP  
**Priority:** P0 - CRITICAL

*   Implement a new policy that allows users to view cars only if they are either the owner of the car or the car is available for rent.

```sql
-- Create a new policy that restricts access to authorized users only
CREATE POLICY "cars_read_authorized" ON public.cars FOR
SELECT
    TO authenticated USING (
        owner_id = auth.uid ()
        OR is_available = TRUE
    );
```

#### **Story 4.2: Secure car_images Table**

**Story ID:** MOBI-203-2  
**Story Points:** 3 SP  
**Priority:** P0 - CRITICAL

*   Implement a policy that allows users to view car images only if they are either the owner of the car or the car is available for rent.

```sql
-- Create a new policy that restricts access to authorized users only
CREATE POLICY "car_images_read_authorized" ON public.car_images FOR
SELECT
    TO authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                public.cars
            WHERE
                cars.id = car_images.car_id
                AND (
                    cars.owner_id = auth.uid ()
                    OR cars.is_available = TRUE
                )
        )
    );
```

#### **Story 4.3: Test Car Visibility**

**Story ID:** MOBI-203-3  
**Story Points:** 4 SP  
**Priority:** P1 - HIGH

*   Create test cases to verify that users can only view cars that are either owned by them or are available for rent.
*   Ensure that unauthorized users cannot access these resources.

#### **Story 4.4: Secure car_reviews Table**

**Story ID:** MOBI-203-4  
**Story Points:** 3 SP  
**Priority:** P0 - CRITICAL

*   Implement a policy that allows users to view car reviews only if the car is available for rent or the user is the owner.

```sql
-- Create a new policy that restricts access to authorized users only
CREATE POLICY "car_reviews_read_authorized" ON public.car_reviews FOR
SELECT
    TO authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                public.cars
            WHERE
                cars.id = car_reviews.car_id
                AND (
                    cars.owner_id = auth.uid ()
                    OR cars.is_available = TRUE
                )
        )
    );
```
