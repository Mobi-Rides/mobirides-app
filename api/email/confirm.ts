import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for backend operations
const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// In-memory storage for pending confirmations (in production, use Redis or database)
const pendingConfirmations = new Map<string, {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  token: string;
  createdAt: number;
}>();

// Clean up expired tokens (older than 24 hours)
setInterval(() => {
  const now = Date.now();
  const expiration = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [token, data] of Array.from(pendingConfirmations.entries())) {
    if (now - data.createdAt > expiration) {
      pendingConfirmations.delete(token);
    }
  }
}, 60 * 60 * 1000); // Run cleanup every hour

/**
 * Create SMTP transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 2465,
    secure: true, // true for 2465, false for other ports
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY
    }
  });
}

/**
 * Generate email confirmation HTML template
 */
function generateConfirmationEmailHTML(
  name: string,
  confirmationUrl: string,
  email: string
): string {
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
export async function sendConfirmationEmail(req: Request, res: Response) {
  try {
    const { email, password, fullName, phoneNumber } = req.body;

    if (!email || !password || !fullName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, fullName, phoneNumber'
      });
    }

    // Generate confirmation token
    const token = uuidv4();
    
    // Store pending confirmation data
    pendingConfirmations.set(token, {
      email,
      password,
      fullName,
      phoneNumber,
      token,
      createdAt: Date.now()
    });

    // Create transporter
    const transporter = createTransporter();
    
    // Generate confirmation URL
    const confirmationUrl = `${req.headers.origin || 'http://localhost:8080'}/confirm-email?token=${token}`;
    
    // Generate email HTML
    const emailHTML = generateConfirmationEmailHTML(
      fullName,
      confirmationUrl,
      email
    );
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@mobirides.com',
      to: email,
      subject: 'Confirm your MobiRides account',
      html: emailHTML
    });

    console.log('Confirmation email sent successfully:', info.messageId);
    
    return res.json({
      success: true,
      messageId: info.messageId,
      message: 'Confirmation email sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    
    let errorMessage = 'Failed to send confirmation email';
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        errorMessage = 'Email service authentication failed. Please check SMTP configuration.';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'Unable to connect to email server. Please check your internet connection.';
      } else if (error.message.includes('EAUTH')) {
        errorMessage = 'Email authentication failed. Please verify your API key.';
      } else if (error.message && error.message.includes('You can only send testing emails to your own email address')) {
        errorMessage = 'Email sending restricted: You can only send emails to verified addresses. To send to other recipients, please verify your domain at resend.com/domains or upgrade your Resend plan.';
      } else if (error.message && error.message.includes('verify a domain at resend.com/domains')) {
        errorMessage = 'Domain verification required: Please verify your domain at resend.com/domains to send emails to external recipients.';
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

/**
 * Verify confirmation token and complete signup
 */
export async function verifyConfirmationToken(req: Request, res: Response) {
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

    // Create user account in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: confirmationData.email,
      password: confirmationData.password,
      email_confirm: true, // Mark email as confirmed
      user_metadata: {
        fullName: confirmationData.fullName,
        phoneNumber: confirmationData.phoneNumber
      }
    });

    if (authError) {
      console.error('Error creating user in Supabase:', authError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user account. Please try again.'
      });
    }

    // Token is valid and user created successfully, remove it from pending confirmations
    pendingConfirmations.delete(token);
    
    return res.json({
      success: true,
      userData: {
        id: authData.user?.id,
        email: confirmationData.email,
        fullName: confirmationData.fullName,
        phoneNumber: confirmationData.phoneNumber,
        password: confirmationData.password // Include password for auto sign-in
      },
      message: 'Email confirmed successfully and user account created'
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
export async function resendConfirmationEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find pending confirmation by email
    let confirmationData: {
      email: string;
      password: string;
      fullName: string;
      phoneNumber: string;
      token: string;
      createdAt: number;
    } | null = null;
    let tokenToResend: string | null = null;

    for (const [token, data] of Array.from(pendingConfirmations.entries())) {
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

    // Create transporter
    const transporter = createTransporter();
    
    // Generate confirmation URL
    const confirmationUrl = `${req.headers.origin || 'http://localhost:8080'}/confirm-email?token=${tokenToResend}`;
    
    // Generate email HTML
    const emailHTML = generateConfirmationEmailHTML(
      confirmationData.fullName,
      confirmationUrl,
      email
    );
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@mobirides.com',
      to: email,
      subject: 'Confirm your MobiRides account - Resent',
      html: emailHTML
    });

    console.log('Confirmation email resent successfully:', info.messageId);
    
    return res.json({
      success: true,
      messageId: info.messageId,
      message: 'Confirmation email resent successfully'
    });
    
  } catch (error) {
    console.error('Error resending confirmation email:', error);
    
    let errorMessage = 'Failed to resend confirmation email';
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        errorMessage = 'Email service authentication failed. Please check SMTP configuration.';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'Unable to connect to email server. Please check your internet connection.';
      } else if (error.message.includes('EAUTH')) {
        errorMessage = 'Email authentication failed. Please verify your API key.';
      } else if (error.message && error.message.includes('You can only send testing emails to your own email address')) {
        errorMessage = 'Email sending restricted: You can only send emails to verified addresses. To send to other recipients, please verify your domain at resend.com/domains or upgrade your Resend plan.';
      } else if (error.message && error.message.includes('verify a domain at resend.com/domains')) {
        errorMessage = 'Domain verification required: Please verify your domain at resend.com/domains to send emails to external recipients.';
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
export default async function handler(req: Request, res: Response) {
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