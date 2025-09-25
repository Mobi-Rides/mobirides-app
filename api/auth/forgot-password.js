import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

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
        const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
        options: {
            redirectTo: `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/reset-password?redirectedFromEmail=true`,
        }
        });

        if (resetError) {
            console.error('Error generating reset link:', resetError);
            return res.status(400).json({
                success: false,
                error: resetError.message || 'Failed to generate password reset link'
            });
        }

        // Compose email content
        const url = new URL(data.properties.action_link);
        const token = url.searchParams.get('token');
        const resetLink = `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&redirectedFromEmail=true`;

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
        await resend.emails.send({
            from: process.env.VITE_FROM_EMAIL, //'no-reply@yourdomain.com',
            to: email,
            subject: 'Password Reset Request',
            html: emailHtml,
        });

        console.log('Password reset email sent successfully to:', email);

        return res.json({
            success: true,
            message: 'Password reset email sent successfully. Please check your inbox.'
        });

    } catch (error) {
        console.error('Error during forgot password:', error);

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
