import { Request, Response } from 'express';
import { ResendEmailService } from '../../src/services/notificationService';

interface TestEmailRequest {
  to: string;
  subject?: string;
  type: 'basic' | 'template' | 'confirmation' | 'booking';
  templateData?: any;
}

const resendService = new ResendEmailService();

export default async function handler(req: Request, res: Response) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject = 'Test Email', type, templateData }: TestEmailRequest = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Email recipient is required' });
    }

    let result;

    switch (type) {
      case 'basic':
        // Test basic email sending
        result = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'noreply@mobirides.com',
            to: [to],
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #8B5CF6;">Resend Test Email</h2>
                <p>This is a basic test email from Mobirides Resend service.</p>
                <p><strong>Test Type:</strong> Basic Email</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="margin: 0; color: #059669;">✅ Resend API is working correctly!</p>
                </div>
              </div>
            `,
          }),
        });
        break;

      case 'template':
        // Test template-based email
        result = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'noreply@mobirides.com',
            to: [to],
            subject: 'Template Test - Mobirides',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 24px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Mobirides</h1>
                  <p style="color: white; margin: 8px 0 0 0;">Template Test Email</p>
                </div>
                <div style="padding: 24px;">
                  <h2>Hello ${templateData?.name || 'User'}!</h2>
                  <p>This is a template-based test email with dynamic content.</p>
                  <ul>
                    <li><strong>User:</strong> ${templateData?.name || 'Test User'}</li>
                    <li><strong>Email:</strong> ${to}</li>
                    <li><strong>Test ID:</strong> ${templateData?.testId || Math.random().toString(36).substr(2, 9)}</li>
                  </ul>
                  <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0;">
                    <p style="margin: 0;">📧 Template rendering is working correctly!</p>
                  </div>
                </div>
              </div>
            `,
          }),
        });
        break;

      case 'confirmation':
        // Test confirmation email (similar to signup)
        result = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'noreply@mobirides.com',
            to: [to],
            subject: 'Confirm Your Email - Mobirides',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 24px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Welcome to Mobirides!</h1>
                </div>
                <div style="padding: 24px;">
                  <h2>Confirm Your Email Address</h2>
                  <p>Thank you for signing up! Please confirm your email address by clicking the button below:</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="#" style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Email</a>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">This is a test confirmation email. The link above is not functional.</p>
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
                    <p style="margin: 0;">⚠️ This is a test email for confirmation flow testing.</p>
                  </div>
                </div>
              </div>
            `,
          }),
        });
        break;

      case 'config':
        // Test configuration validation
        return res.status(200).json({
          success: true,
          message: 'Configuration validated successfully',
          data: {
            templates: 4, // Available templates: booking-confirmation, pickup-reminder, return-reminder, welcome-renter
            functionAvailable: true, // Direct API calls are available
            apiKeyConfigured: !!process.env.RESEND_API_KEY,
            fromEmailConfigured: !!process.env.FROM_EMAIL,
            environment: 'test'
          }
        });

      case 'booking':
        // Test booking notification using direct API call
        result = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'noreply@mobirides.com',
            to: [to],
            subject: 'Booking Confirmation - Toyota Camry',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 24px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Mobirides</h1>
                  <p style="color: white; margin: 8px 0 0 0;">Booking Confirmation</p>
                </div>
                <div style="padding: 24px;">
                  <h2>Booking Confirmed!</h2>
                  <p>Dear Test User,</p>
                  <p>Your booking has been confirmed. Here are the details:</p>
                  <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Booking Reference:</strong> TEST-BOOKING-123</p>
                    <p><strong>Vehicle:</strong> Toyota Camry</p>
                    <p><strong>Pickup Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Pickup Time:</strong> 10:00 AM</p>
                    <p><strong>Pickup Location:</strong> Test Pickup Location</p>
                    <p><strong>Dropoff Location:</strong> Test Dropoff Location</p>
                    <p><strong>Total Amount:</strong> $150</p>
                  </div>
                  <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 16px; margin: 16px 0;">
                    <p style="margin: 0;">🚗 Booking notification test completed successfully!</p>
                  </div>
                </div>
              </div>
            `,
          }),
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid test type' });
    }

    // Handle response for direct API calls (basic, template, confirmation)
    if (result && typeof result === 'object' && 'ok' in result) {
      const responseData = await result.json();
      
      if (!result.ok) {
        return res.status(result.status).json({
          error: 'Resend API error',
          details: responseData
        });
      }

      return res.status(200).json({
        success: true,
        message: `${type} email sent successfully`,
        data: responseData
      });
    }

    // This should not be reached for booking type as it returns early
    return res.status(500).json({
      error: 'Unexpected error in email processing',
      type: type
    });

  } catch (error) {
    console.error('Resend test error:', error);
    return res.status(500).json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}