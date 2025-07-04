# Epic 4: Backend Optimization & Security

## Overview

Epic 4 implements comprehensive backend optimizations and security improvements for the MobiRides car rental application. This includes rate limiting, CAPTCHA protection, improved RLS policies, database optimizations, and audit logging.

## 🚀 Features Implemented

### 1. Rate Limiting System

#### Database Schema
- **Table**: `rate_limits`
- **Function**: `check_rate_limit()`
- **Edge Function**: `rate-limit-check`

#### Configuration
```sql
-- Rate limit configurations for different endpoints
SIGN_UP: 5 requests per 15 minutes
SIGN_IN: 10 requests per 15 minutes
PASSWORD_RESET: 3 requests per 60 minutes
ADD_CAR: 10 requests per 60 minutes
CREATE_BOOKING: 10 requests per 15 minutes
SEARCH_CARS: 100 requests per 15 minutes
```

#### Usage
```typescript
import { rateLimitService, enforceRateLimitByKey } from '@/services/rateLimitService'

// Check rate limit before operation
await enforceRateLimitByKey('CREATE_BOOKING')

// Custom rate limit check
const allowed = await rateLimitService.checkRateLimit({
  endpoint: 'custom/endpoint',
  maxRequests: 50,
  windowMinutes: 30
})
```

### 2. CAPTCHA Protection

#### Database Schema
- **Table**: `captcha_verifications`
- **Function**: `verify_captcha()`
- **Edge Function**: `captcha-verify`

#### Supported Actions
- User registration
- Password reset
- Account deletion
- Car deletion
- Booking cancellation
- Payment operations

#### Usage
```typescript
import { captchaService, completeCaptchaFlowByKey } from '@/services/captchaService'

// Complete CAPTCHA flow for high-risk action
const verified = await completeCaptchaFlowByKey('DELETE_CAR')

// Custom CAPTCHA verification
const verified = await captchaService.completeCaptchaFlow('custom_action')
```

### 3. Fixed RLS Policies

#### Cars Table Policies
```sql
-- View cars: Only active and verified cars, or user's own cars
CREATE POLICY "Cars are viewable by everyone"
ON public.cars FOR SELECT
USING (
  is_active = true AND is_verified = true
  OR auth.uid() = host_id
  OR user is admin
)

-- Insert cars: Users can only add cars for themselves
CREATE POLICY "Users can insert their own cars"
ON public.cars FOR INSERT
WITH CHECK (auth.uid() = host_id)

-- Update cars: Users can only update their own cars
CREATE POLICY "Users can update their own cars"
ON public.cars FOR UPDATE
USING (auth.uid() = host_id)
```

#### Bookings Table Policies
```sql
-- View bookings: Users can see their own bookings (as guest or host)
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (
  auth.uid() = guest_id 
  OR auth.uid() = host_id
  OR user is admin
)

-- Create bookings: Only authenticated users
CREATE POLICY "Users can insert their own bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = guest_id)
```

### 4. Database Optimizations

#### Performance Functions
```sql
-- Get nearby cars with distance calculation
get_nearby_cars(latitude, longitude, radius_km, limit)

-- Get user booking statistics
get_user_booking_stats(user_id)

-- Validate car ownership
validate_car_ownership(car_id)

-- Validate booking access
validate_booking_access(booking_id)
```

#### Optimized Indexes
```sql
-- Car search optimization
CREATE INDEX idx_cars_location_active_verified 
ON cars(latitude, longitude, is_active, is_verified);

-- Price range optimization
CREATE INDEX idx_cars_price_range 
ON cars(price_per_day) WHERE is_active = true AND is_verified = true;

-- Booking optimization
CREATE INDEX idx_bookings_status_dates 
ON bookings(status, start_date, end_date);
```

### 5. Security Functions

#### Ownership Validation
```typescript
import { supabase } from '@/integrations/supabase/client'

// Validate car ownership
const { data } = await supabase.rpc('validate_car_ownership', {
  p_car_id: carId
})

// Validate booking access
const { data } = await supabase.rpc('validate_booking_access', {
  p_booking_id: bookingId
})
```

### 6. Audit Logging

#### Audit Log Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
```

#### Usage
```typescript
// Log audit event (service role only)
await supabase.rpc('log_audit_event', {
  p_action: 'user_login',
  p_table_name: 'profiles',
  p_record_id: userId,
  p_new_values: { loginTime: new Date().toISOString() }
})
```

## 🔧 Implementation Details

### Frontend Services

#### Rate Limit Service (`src/services/rateLimitService.ts`)
- Singleton pattern for caching
- Predefined configurations for common endpoints
- Automatic cache management
- Error handling with fallbacks

#### CAPTCHA Service (`src/services/captchaService.ts`)
- Google reCAPTCHA integration
- Automatic script loading
- Token verification with backend
- Cache management for verified tokens

#### Optimized Car Service (`src/services/optimizedCarService.ts`)
- Uses database functions for performance
- Integrated rate limiting and CAPTCHA
- Ownership validation
- Advanced search with location filtering

#### Optimized Booking Service (`src/services/optimizedBookingService.ts`)
- Comprehensive booking management
- Status transition validation
- Conflict detection
- User statistics

### Security Middleware (`src/components/security/SecurityMiddleware.tsx`)
- Context provider for security features
- Higher-order components for protection
- Automatic rate limiting hooks
- CAPTCHA verification hooks

### Database Migration (`supabase/migrations/20250115000000_epic4_backend_optimization.sql`)
- Complete schema setup
- RLS policies
- Performance functions
- Security functions
- Audit logging

## 🛡️ Security Features

### Rate Limiting
- **IP-based**: Prevents abuse from specific IPs
- **User-based**: Prevents abuse from authenticated users
- **Endpoint-specific**: Different limits for different operations
- **Configurable windows**: Flexible time windows for limits

### CAPTCHA Protection
- **Google reCAPTCHA v3**: Invisible CAPTCHA
- **Action-based scoring**: Different thresholds for different actions
- **Fallback system**: Database-based verification if reCAPTCHA unavailable
- **Automatic verification**: Seamless user experience

### RLS Policies
- **Row-level security**: Database-level access control
- **Ownership validation**: Users can only access their own data
- **Role-based access**: Admin privileges for certain operations
- **Status-based filtering**: Only active/verified content visible

### Audit Logging
- **Comprehensive tracking**: All security-relevant actions
- **IP tracking**: Source IP address logging
- **User tracking**: Authenticated user identification
- **Change tracking**: Before/after value comparison

## 📊 Performance Improvements

### Database Optimizations
- **Spatial indexes**: Fast location-based queries
- **Composite indexes**: Optimized multi-column searches
- **Partial indexes**: Indexes only on relevant data
- **Function-based queries**: Pre-optimized query patterns

### Caching Strategy
- **Rate limit caching**: 5-second cache for rate limit checks
- **CAPTCHA caching**: 5-minute cache for verified tokens
- **Query result caching**: Frontend caching for repeated queries

### Query Optimization
- **Efficient joins**: Optimized table relationships
- **Index usage**: Proper index utilization
- **Batch operations**: Reduced database round trips
- **Connection pooling**: Efficient connection management

## 🔄 Integration Guide

### 1. Environment Setup
```bash
# Add reCAPTCHA site key to environment
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

### 2. Database Migration
```bash
# Apply the Epic 4 migration
supabase db push
```

### 3. Deploy Edge Functions
```bash
# Deploy rate limiting function
supabase functions deploy rate-limit-check

# Deploy CAPTCHA verification function
supabase functions deploy captcha-verify
```

### 4. Frontend Integration
```typescript
// Wrap your app with SecurityMiddleware
import { SecurityMiddleware } from '@/components/security/SecurityMiddleware'

function App() {
  return (
    <SecurityMiddleware recaptchaSiteKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
      {/* Your app components */}
    </SecurityMiddleware>
  )
}
```

### 5. Service Usage
```typescript
// Use optimized services
import { optimizedCarService } from '@/services/optimizedCarService'
import { optimizedBookingService } from '@/services/optimizedBookingService'

// Search cars with rate limiting
const cars = await optimizedCarService.searchCars({
  latitude: 40.7128,
  longitude: -74.0060,
  radiusKm: 50
})

// Create booking with CAPTCHA
const booking = await optimizedBookingService.createBooking({
  carId: 'car-uuid',
  startDate: '2024-01-15',
  endDate: '2024-01-17',
  totalPrice: 150
})
```

## 📈 Monitoring & Analytics

### Rate Limit Monitoring
```typescript
// Get rate limit cache status
const status = rateLimitService.getCacheStatus()
console.log('Rate limit cache:', status)
```

### CAPTCHA Monitoring
```typescript
// Get CAPTCHA cache status
const status = captchaService.getCacheStatus()
console.log('CAPTCHA cache:', status)
```

### Audit Log Analysis
```sql
-- Get recent security events
SELECT action, COUNT(*) as count
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY count DESC;
```

## 🚨 Error Handling

### Rate Limit Errors
```typescript
try {
  await enforceRateLimitByKey('CREATE_BOOKING')
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    // Show user-friendly message
    toast.error('Too many requests. Please wait before trying again.')
  }
}
```

### CAPTCHA Errors
```typescript
try {
  const verified = await completeCaptchaFlowByKey('DELETE_CAR')
  if (!verified) {
    toast.error('CAPTCHA verification failed. Please try again.')
  }
} catch (error) {
  toast.error('Security verification error. Please refresh and try again.')
}
```

### Database Errors
```typescript
try {
  const car = await optimizedCarService.getCarDetails(carId)
} catch (error) {
  if (error.code === 'PGRST116') {
    // Row not found
    toast.error('Car not found or not available.')
  } else if (error.code === '42501') {
    // Permission denied
    toast.error('You do not have permission to view this car.')
  }
}
```

## 🔧 Maintenance

### Regular Cleanup
```sql
-- Clean up old rate limits (run daily)
DELETE FROM rate_limits 
WHERE created_at < NOW() - INTERVAL '24 hours';

-- Clean up expired CAPTCHA verifications
DELETE FROM captcha_verifications 
WHERE expires_at < NOW();

-- Clean up old audit logs (run monthly)
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Performance Monitoring
```sql
-- Monitor slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;

-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 🎯 Best Practices

### Security
1. **Always validate ownership** before allowing operations
2. **Use rate limiting** for all user-facing endpoints
3. **Implement CAPTCHA** for high-risk operations
4. **Log security events** for monitoring and debugging
5. **Regular security audits** of RLS policies

### Performance
1. **Use database functions** for complex queries
2. **Implement proper indexing** for common queries
3. **Cache frequently accessed data** when appropriate
4. **Monitor query performance** regularly
5. **Optimize based on usage patterns**

### Maintenance
1. **Regular cleanup** of old data
2. **Monitor rate limit effectiveness**
3. **Review audit logs** for suspicious activity
4. **Update security policies** as needed
5. **Backup and recovery** procedures

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Epic 4 Status**: ✅ Complete
**Last Updated**: January 15, 2024
**Version**: 1.0.0 