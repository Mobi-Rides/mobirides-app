import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { createTransporter } from './confirm.ts';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Create Supabase client with service role for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TTL for confirmation tokens (24 hours)
const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Send email using direct Resend API
 */
async function sendEmailViaResendAPI(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  
  const fromEmail = process.env.FROM_EMAIL || 'noreply@mobirides.com';
  // Ensure this domain is verified in your Resend account
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * Generate email confirmation HTML template
 */
function generateConfirmationEmailHTML(name, confirmationUrl, email) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm your MobiRides account</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to MobiRides!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thank you for signing up for MobiRides! We're excited to have you join our car-sharing community.</p>
          <p>To complete your registration and activate your account, please click the button below:</p>
          <div style="text-align: center;">
            <a href="${confirmationUrl}" class="button">Confirm Your Email</a>
          </div>
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${confirmationUrl}</p>
          <p><strong>Important:</strong> This confirmation link will expire in 24 hours for security reasons.</p>
          <p>If you didn't create an account with MobiRides, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The MobiRides Team</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send confirmation email
 */
export async function sendConfirmationEmail(req, res) {
  try {
    const { email, fullName, phoneNumber, password } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Email and full name are required'
      });
    }

    // Generate confirmation token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS);

    // Store confirmation data in database
    try {
      const { error: insertError } = await supabase
        .from('pending_confirmations')
        .insert({
          token,
          email,
          full_name: fullName,
          phone_number: phoneNumber,
          password,
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('Database error storing confirmation:', insertError);
        throw new Error('Failed to store confirmation data');
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      throw new Error('Database connection failed');
    }

    // Generate confirmation URL
    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm-email?token=${token}`;

    // Generate email HTML
    const emailHtml = generateConfirmationEmailHTML(fullName, confirmationUrl, email);

    // Send email using direct Resend API
    const result = await sendEmailViaResendAPI(
      email,
      'Confirm Your Email - Mobirides',
      emailHtml
    );

    console.log('Confirmation email sent successfully:', {
      messageId: result.id,
      to: email,
      token: token.substring(0, 8) + '...'
    });

    return res.status(200).json({
      success: true,
      messageId: result.id,
      message: 'Confirmation email sent successfully'
    });

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    
    let errorMessage = 'Failed to send confirmation email';
    
    if (error instanceof Error) {
      if (error.message.includes('Resend API error')) {
        errorMessage = 'Email service error. Please check your Resend API configuration.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to email service. Please check your internet connection.';
      }
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Verify confirmation token and complete signup
 */
export async function verifyConfirmationToken(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    try {
      // Get confirmation data from database
      const { data: confirmationData, error: selectError } = await supabase
        .from('pending_confirmations')
        .select('*')
        .eq('token', token)
        .single();

      if (selectError || !confirmationData) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired confirmation token'
        });
      }

      // Check if token has expired
      const now = new Date();
      const expiresAt = new Date(confirmationData.expires_at);
      
      if (now > expiresAt) {
        // Clean up expired token
        await supabase
          .from('pending_confirmations')
          .delete()
          .eq('token', token);
          
        return res.status(400).json({
          success: false,
          error: 'Confirmation token has expired. Please sign up again.'
        });
      }

      // Remove token from pending confirmations (consume the token)
      const { error: deleteError } = await supabase
        .from('pending_confirmations')
        .delete()
        .eq('token', token);

      if (deleteError) {
        console.error('Error deleting confirmation token:', deleteError);
        // Continue anyway since we have the data
      }
      
      return res.json({
        success: true,
        userData: {
          email: confirmationData.email,
          password: confirmationData.password,
          fullName: confirmationData.full_name,
          phoneNumber: confirmationData.phone_number
        },
        message: 'Email confirmed successfully'
      });
    } catch (dbError) {
      console.error('Database error in verifyConfirmationToken:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
  } catch (error) {
    console.error('Error verifying confirmation token:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to verify confirmation token'
    });
  }
}

/**
 * Resend confirmation email
 */
export async function resendConfirmationEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    try {
      // Find pending confirmation by email
      const { data: confirmationData, error: selectError } = await supabase
        .from('pending_confirmations')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (selectError || !confirmationData) {
        return res.status(400).json({
          success: false,
          error: 'No pending confirmation found for this email'
        });
      }

      // Check if the existing token is still valid (not expired)
      const now = new Date();
      const expiresAt = new Date(confirmationData.expires_at);
      
      if (now > expiresAt) {
        // Remove expired token
        await supabase
          .from('pending_confirmations')
          .delete()
          .eq('token', confirmationData.token);
          
        return res.status(400).json({
          success: false,
          error: 'Previous confirmation has expired. Please sign up again.'
        });
      }

      const tokenToResend = confirmationData.token;

    // Generate confirmation URL
    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm-email?token=${tokenToResend}`;
    
    // Generate email HTML
    const emailHTML = generateConfirmationEmailHTML(
      confirmationData.full_name,
      confirmationUrl,
      email
    );
    
    // Send email using direct Resend API
    const result = await sendEmailViaResendAPI(
      email,
      'Confirm Your Email - Mobirides',
      emailHTML
    );

    console.log('Confirmation email resent successfully:', {
      messageId: result.id,
      to: email,
      token: tokenToResend.substring(0, 8) + '...'
    });
    
    return res.json({
      success: true,
      messageId: result.id,
      message: 'Confirmation email resent successfully'
    });
    
  } catch (dbError) {
    console.error('Database error in resendConfirmationEmail:', dbError);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed'
    });
  }
    
  } catch (error) {
    console.error('Error resending confirmation email:', error);
    
    let errorMessage = 'Failed to resend confirmation email';
    
    if (error instanceof Error) {
      if (error.message.includes('Resend API error')) {
        errorMessage = 'Email service error. Please check your Resend API configuration.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to email service. Please check your internet connection.';
      } else {
        errorMessage = `Email sending failed: ${error.message}`;
      }
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

// Default export for the API route handler
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action } = req.body;
    
    if (action === 'send') {
      return await sendConfirmationEmail(req, res);
    } else if (action === 'verify') {
      return await verifyConfirmationToken(req, res);
    } else if (action === 'resend') {
      return await resendConfirmationEmail(req, res);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use "send", "verify", or "resend"'
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }
}