import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for pending confirmations (in production, use Redis or database)
const pendingConfirmations = new Map();

// Clean up expired tokens (older than 24 hours)
setInterval(() => {
  const now = Date.now();
  const expiration = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [token, data] of pendingConfirmations.entries()) {
    if (now - data.createdAt > expiration) {
      pendingConfirmations.delete(token);
    }
  }
}, 60 * 60 * 1000); // Run cleanup every hour

/**
 * Send email using direct Resend API
 */
async function sendEmailViaResendAPI(to, subject, html) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'noreply@mobirides.com',
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
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token with user data
    pendingConfirmations.set(token, {
      email,
      fullName,
      phoneNumber,
      password,
      expiresAt,
      createdAt: new Date()
    });

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

    // Get pending confirmation data
    const confirmationData = pendingConfirmations.get(token);
    
    if (!confirmationData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired confirmation token'
      });
    }

    // Check if token is expired (24 hours)
    const now = Date.now();
    const expiration = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - confirmationData.createdAt > expiration) {
      pendingConfirmations.delete(token);
      return res.status(400).json({
        success: false,
        error: 'Confirmation token has expired. Please sign up again.'
      });
    }

    // Return the confirmation data for the frontend to complete the signup
    // Remove the token from pending confirmations
    pendingConfirmations.delete(token);
    
    return res.json({
      success: true,
      userData: {
        email: confirmationData.email,
        password: confirmationData.password,
        fullName: confirmationData.fullName,
        phoneNumber: confirmationData.phoneNumber
      },
      message: 'Email confirmed successfully'
    });
    
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

    // Find pending confirmation by email
    let confirmationData = null;
    let tokenToResend = null;

    for (const [token, data] of pendingConfirmations.entries()) {
      if (data.email === email) {
        confirmationData = data;
        tokenToResend = token;
        break;
      }
    }

    if (!confirmationData || !tokenToResend) {
      return res.status(400).json({
        success: false,
        error: 'No pending confirmation found for this email'
      });
    }

    // Generate confirmation URL
    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm-email?token=${tokenToResend}`;
    
    // Generate email HTML
    const emailHTML = generateConfirmationEmailHTML(
      confirmationData.fullName,
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