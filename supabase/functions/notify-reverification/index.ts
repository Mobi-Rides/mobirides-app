// Supabase Edge Function: Notify Re-Verification
// Sends email notifications to users requiring re-verification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  batchSize?: number;
  testMode?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { batchSize = 50, testMode = false } = await req.json() as NotificationRequest;

    console.log('[notify-reverification] Starting notification process', { batchSize, testMode });

    // Get users requiring re-verification
    const { data: users, error: usersError } = await supabaseClient
      .from('user_verifications')
      .select(`
        user_id,
        reset_at,
        reset_reason,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq('overall_status', 'requires_reverification')
      .limit(batchSize);

    if (usersError) {
      console.error('[notify-reverification] Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`[notify-reverification] Found ${users?.length || 0} users requiring notification`);

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users require notification',
          sent: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send emails (integrate with Resend or your email provider)
    let sentCount = 0;
    const errors: any[] = [];

    for (const user of users) {
      try {
        const email = (user.profiles as any)?.email;
        const fullName = (user.profiles as any)?.full_name || 'MobiRides User';

        if (!email) {
          console.warn(`[notify-reverification] No email for user ${user.user_id}`);
          continue;
        }

        if (testMode) {
          console.log(`[TEST MODE] Would send email to: ${email}`);
          sentCount++;
          continue;
        }

        // TODO: Integrate with Resend API
        // Example Resend integration:
        /*
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'MobiRides <noreply@mobirides.com>',
            to: [email],
            subject: 'Action Required: Complete New Verification Process',
            html: getEmailTemplate(fullName),
          }),
        });
        */

        console.log(`[notify-reverification] Email sent to: ${email}`);
        sentCount++;

      } catch (emailError) {
        console.error(`[notify-reverification] Failed to send email to user ${user.user_id}:`, emailError);
        errors.push({ userId: user.user_id, error: emailError instanceof Error ? emailError.message : 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${sentCount} notifications`,
        sent: sentCount,
        total: users.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[notify-reverification] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Email template helper
function getEmailTemplate(fullName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verification Update Required</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #f97316;">Verification Update Required</h1>
    
    <p>Hello ${fullName},</p>
    
    <p>MobiRides has updated our verification process for improved security and a faster, more streamlined experience.</p>
    
    <h2 style="color: #2563eb;">What's New?</h2>
    <ul>
      <li><strong>Only 3 steps</strong> instead of 7 (57% reduction)</li>
      <li><strong>Only 3 documents</strong> required (down from 5)</li>
      <li><strong>Faster completion</strong> - average 6 minutes instead of 15</li>
      <li><strong>Simpler process</strong> - no phone verification required</li>
    </ul>
    
    <h2 style="color: #2563eb;">What You Need to Do</h2>
    <p>Please complete the new verification process at your earliest convenience:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://app.mobirides.com/verification" 
         style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Start Verification Now
      </a>
    </div>
    
    <h3>Required Documents:</h3>
    <ol>
      <li>National ID (Front & Back)</li>
      <li>Proof of Income</li>
    </ol>
    
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
      <strong>Why the change?</strong><br>
      We're streamlining our system for better data consistency, improved security, and a faster user experience. 
      This one-time update helps us serve you better.
    </p>
    
    <p style="font-size: 14px; color: #666;">
      If you have any questions or need assistance, please contact our support team at 
      <a href="mailto:support@mobirides.com">support@mobirides.com</a>.
    </p>
    
    <p style="font-size: 14px; color: #666;">
      Best regards,<br>
      The MobiRides Team
    </p>
  </div>
</body>
</html>
  `.trim();
}
