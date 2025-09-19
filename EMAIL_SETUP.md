# Email Configuration Guide - MobiRides

## Current Status

The email confirmation system is working correctly but is currently in **testing mode** due to Resend API limitations.

## Testing Mode Limitations

### What's Working:
- ✅ Email API is properly configured
- ✅ Backend server is running on `http://localhost:3001`
- ✅ Frontend is connecting to the API correctly
- ✅ Emails are being sent successfully to verified addresses

### Current Restriction:
- 🚨 **Testing Mode**: Emails can only be sent to the verified email address: `maphanyane@mobirides.com`
- 🚨 Attempting to send to other email addresses (like Gmail) will show: "Email service error. Please check your Resend API configuration."

## How to Enable Production Email Delivery

To send emails to any email address (including Gmail), you need to:

### Option 1: Verify a Domain (Recommended)
1. Go to [Resend Domains](https://resend.com/domains)
2. Add and verify your domain (e.g., `app.mobirides.com`)
3. Update the `FROM_EMAIL` in your `.env` file to use the verified domain:
   ```
   FROM_EMAIL=noreply@app.mobirides.com
   ```

### Option 2: Add Individual Email Addresses
1. Go to [Resend Dashboard](https://resend.com/)
2. Add individual email addresses to your verified list
3. These addresses can then receive emails

### Option 3: Upgrade Resend Plan
1. Upgrade from the free tier to a paid plan
2. This removes testing restrictions

## Testing the Current Setup

### Test with Verified Email (Works Now):
```bash
# This will work
curl -X POST http://localhost:3001/api/email/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "email": "maphanyane@mobirides.com",
    "fullName": "Test User",
    "phoneNumber": "+1234567890",
    "password": "testpass"
  }'
```

### Test with Unverified Email (Will Fail):
```bash
# This will fail with testing mode error
curl -X POST http://localhost:3001/api/email/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "email": "user@gmail.com",
    "fullName": "Test User",
    "phoneNumber": "+1234567890",
    "password": "testpass"
  }'
```

## Environment Variables

Current configuration in `.env`:
```
RESEND_API_KEY=re_2FWqfJwk_62EVzhW3YKUUCtCUwKEstLhs
FROM_EMAIL=onboarding@resend.dev
VITE_FROM_EMAIL=onboarding@resend.dev
```

## Error Messages

The system now provides user-friendly error messages:
- **Testing Mode**: "Email service is in testing mode. Please contact support or try with a verified email address."
- **API Configuration**: "Email service configuration error. Please contact support."
- **Network Issues**: "Unable to connect to email service. Please check your internet connection."

## Next Steps

1. **For Development**: Continue using `maphanyane@mobirides.com` for testing
2. **For Production**: Verify the `app.mobirides.com` domain in Resend
3. **Update FROM_EMAIL**: Change to use the verified domain
4. **Test Production**: Verify emails reach external addresses like Gmail

## Support

If you encounter issues:
1. Check that both servers are running (`npm run dev`)
2. Verify the API endpoint is accessible at `http://localhost:3001`
3. Check the Resend dashboard for delivery status
4. Review the browser console and server logs for detailed error messages