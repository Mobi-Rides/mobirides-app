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
    // Keep password reset flow inside Supabase Auth so credential recovery and
    // password hashing remain fully managed by GoTrue.
    const resetUrl = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl,
    });

    if (resetError) {
      console.error('Supabase reset error:', resetError);
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }

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
