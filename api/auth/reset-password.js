import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Backend environment variables on Vercel
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceRole) {
      console.error('Missing Supabase configuration (URL or Service Role Key)');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Initialize backend client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create a generic reset URL - Supabase will handle the actual token via email
    // Unify frontend URL variables
    const frontendUrl = process.env.VITE_FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password`;
    const supportEmail = process.env.VITE_SUPPORT_EMAIL || 'support@mobirides.com';

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
          support_email: supportEmail,
          app_url: frontendUrl
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

    if (!resendResponse.ok) {
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