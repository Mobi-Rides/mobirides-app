# Email Configuration Guide - MobiRides

## Current Status

The email confirmation system is **bypassed** in the current implementation. Email confirmation is hardcoded to `true` in the signup process, allowing users to register without email verification.

## Actual Configuration Status

### What's Already Configured:
- ✅ **Resend API Key**: Properly configured in Supabase secrets
- ✅ **Domain Verification**: `mobirides.com` domain is verified in Resend
- ✅ **FROM_EMAIL**: Correctly set to `noreply@mobirides.com`
- ✅ **Resend Account**: Free tier has no testing restrictions (documentation was incorrect)

### Current Issues:
- 🚨 **Missing Database Trigger**: `on_auth_user_created` trigger doesn't exist
- 🚨 **Broken Profile Creation**: Users don't get profiles created automatically
- 🚨 **No Email Sending**: `handle_new_user` function logs but doesn't send emails
- 🚨 **Hardcoded Bypass**: Email confirmation is forced to `true` in `api/auth/signup.js`

## Root Cause Analysis

The previous "security issue" was likely caused by:

1. **Missing Trigger**: New users weren't getting profiles created
2. **Failed Email Delivery**: Welcome emails weren't being sent via Resend
3. **Broken User Experience**: Users could register but couldn't access the app
4. **Emergency Fix**: Email confirmation was bypassed to allow user registration

## Current Implementation Issues

### In `api/auth/signup.js`:
```javascript
// HARDCODED BYPASS - SECURITY ISSUE
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: redirectUrl,
    data: { full_name: fullName, phone_number: phoneNumber }
  }
}, { 
  email_confirm: true  // ← Forces confirmation bypass
});

// HARDCODED PROFILE CREATION
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: data.user?.id,
    full_name: fullName,
    phone_number: phoneNumber,
    email_confirmed: true  // ← Forces email as confirmed
  });
```

### Missing Database Components:
- **Trigger**: `on_auth_user_created` on `auth.users` table
- **Function**: Proper `handle_new_user()` implementation with email sending
- **Edge Function**: Welcome email sending via Resend

## Required Fixes

### 1. Database Layer
```sql
-- Fix the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone_number, email_confirmed)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.email_confirmed_at IS NOT NULL
  );
  
  -- Send welcome email via edge function (if email confirmed)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'full_name', NEW.raw_user_meta_data ->> 'full_name'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the missing trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Application Layer
- Remove hardcoded `email_confirm: true` from signup
- Remove hardcoded profile creation from signup API
- Implement proper email confirmation flow
- Create confirmation page and handling

### 3. Email Layer
- Create `send-welcome-email` edge function
- Implement confirmation email templates
- Add resend confirmation functionality

## Environment Variables

Current correct configuration:
```
RESEND_API_KEY=re_2FWqfJwk_62EVzhW3YKUUCtCUwKEstLhs  # ✅ Configured in Supabase
FROM_EMAIL=noreply@mobirides.com  # ✅ Uses verified domain
```

## Next Steps Priority

### Immediate (Critical Security Fix):
1. **Create missing database trigger** - Restore automatic profile creation
2. **Fix handle_new_user function** - Enable proper email sending
3. **Remove hardcoded bypass** - Restore email confirmation requirement

### Medium Term:
1. **Create confirmation page** - Handle email verification links
2. **Add resend functionality** - Allow users to resend confirmation emails
3. **Implement proper error handling** - Graceful failures for email delivery

### Long Term:
1. **Add email templates** - Professional welcome and confirmation emails
2. **Implement email preferences** - User control over notifications
3. **Add monitoring** - Track email delivery success/failure rates

## Testing

### Database Fix Verification:
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Test profile creation
-- Sign up a new user and verify profile is created automatically
```

### Email Delivery Testing:
- Test with verified domain email: `test@mobirides.com`
- Test with external emails: Gmail, Yahoo, Outlook
- Verify welcome emails are received
- Test confirmation links work properly

## Support

If implementing fixes:
1. **Backup database** before making trigger changes
2. **Test in development** before production deployment  
3. **Monitor signup flow** after deployment
4. **Check Supabase logs** for trigger execution errors