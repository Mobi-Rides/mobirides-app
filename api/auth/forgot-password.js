import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Debug logging for environment variables (remove in production)
console.log('[Forgot Password API] Checking environment variables...');
console.log('[Forgot Password API] SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('[Forgot Password API] SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('[Forgot Password API] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('[Forgot Password API] VITE_FROM_EMAIL:', process.env.VITE_FROM_EMAIL);
console.log('[Forgot Password API] VITE_FRONTEND_URL:', process.env.VITE_FRONTEND_URL);

if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL environment variable is required');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}
if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required');
}

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Handle forgot password request
 */
export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Generate password reset link using Supabase admin
        console.log('[Forgot Password API] Generating reset link for email:', email);

        const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/reset-password?redirectedFromEmail=true`,
            }
        });

        if (resetError) {
            console.error('[Forgot Password API] Error generating reset link:', resetError);
            return res.status(400).json({
                success: false,
                error: resetError.message || 'Failed to generate password reset link'
            });
        }

        console.log('[Forgot Password API] Reset link data received:', JSON.stringify(data, null, 2));

        // Validate that we have the action link
        if (!data?.properties?.action_link) {
            console.error('[Forgot Password API] Missing action_link in response:', data);
            return res.status(400).json({
                success: false,
                error: 'Unable to generate password reset link. Please verify the email address is registered.'
            });
        }

        // Compose email content
        let token;
        try {
            const url = new URL(data.properties.action_link);
            token = url.searchParams.get('token');
            console.log('[Forgot Password API] Extracted token from action_link');
        } catch (urlError) {
            console.error('[Forgot Password API] Error parsing action_link URL:', urlError);
            return res.status(500).json({
                success: false,
                error: 'Internal error processing reset link'
            });
        }

        if (!token) {
            console.error('[Forgot Password API] No token found in action_link');
            return res.status(500).json({
                success: false,
                error: 'Invalid reset link generated'
            });
        }

        const resetLink = `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&redirectedFromEmail=true`;
        console.log('[Forgot Password API] Reset link constructed:', resetLink);

        const emailHtml = `
      <html>
        <body>
          <p>Hello,</p>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>If you did not request this, please ignore this email.</p>
        </body>
      </html>
    `;

        // Send email using Resend
        const fromEmail = process.env.VITE_FROM_EMAIL || 'noreply@mobirides.com';
        console.log('[Forgot Password API] Sending email from:', fromEmail, 'to:', email);

        try {
            const emailResult = await resend.emails.send({
                from: fromEmail,
                to: email,
                subject: 'Password Reset Request',
                html: emailHtml,
            });
            console.log('[Forgot Password API] Email send result:', emailResult);
        } catch (emailError) {
            console.error('[Forgot Password API] Error sending email via Resend:', emailError);
            return res.status(500).json({
                success: false,
                error: 'Failed to send password reset email. Please try again later.',
                details: emailError instanceof Error ? emailError.message : 'Email service error'
            });
        }

        console.log('[Forgot Password API] Password reset email sent successfully to:', email);

        return res.json({
            success: true,
            message: 'Password reset email sent successfully. Please check your inbox.'
        });

    } catch (error) {
        console.error('[Forgot Password API] Unhandled error during forgot password:', error);
        console.error('[Forgot Password API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        return res.status(500).json({
            success: false,
            error: 'Internal server error during password reset',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        return await forgotPassword(req, res);
    } else {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.'
        });
    }
}
