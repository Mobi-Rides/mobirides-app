import { supabase } from '../../src/integrations/supabase/client.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Call our custom Resend service to send the branded email
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    
    if (!supabaseServiceRole || !supabaseUrl) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create a generic reset URL - Supabase will handle the actual token via email
    const resetUrl = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/reset-password`;

    // Call our Resend service function to send branded email
    const resendResponse = await fetch(`${supabaseUrl}/functions/v1/resend-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRole}`,
      },
      body: JSON.stringify({
        to: email,
        template: 'password-reset',
        data: {
          reset_url: resetUrl,
          confirmation_url: resetUrl,
          support_email: process.env.VITE_SUPPORT_EMAIL || 'support@mobirides.com',
          app_url: process.env.VITE_APP_URL || 'https://mobirides.com'
        }
      })
    });

    // Also trigger Supabase's built-in reset (for the actual token generation)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl,
    });

    if (resetError) {
      console.error('Supabase reset error:', resetError);
      // Continue anyway since we want to send our custom email
    }

    if (!ok) {
      const errorText = await resendResponse.text();
      console.error('Resend service error:', errorText);
      return res.status(500).json({ error: `Failed to send password reset email: ${errorText}` });
    }

    const resendResult = await resendResponse.json();
    console.log('Password reset email sent successfully:', resendResult);

    return res.status(200).json({ 
      message: 'Password reset email sent successfully',
      success: true 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred while sending the password reset email' 
    });
  }
}