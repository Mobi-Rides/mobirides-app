import { createClient } from '@supabase/supabase-js';

const frontendUrl = process.env.VITE_FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:5173';

if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL environment variable is required');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
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

/**
 * Handle password reset request — generates a Supabase recovery token and
 * sends a branded email via resend-service with the token embedded in the URL.
 */
async function resetPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        // Generate a password-recovery link with an embedded token
        const { data, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
                redirectTo: `${frontendUrl}/reset-password?redirectedFromEmail=true`,
            }
        });

        if (generateError || !data?.properties) {
            console.error('[reset-password] generateLink failed');
            return res.status(500).json({ success: false, error: 'Failed to generate password reset link' });
        }

        // Prefer the dedicated hashed_token field — more reliable than parsing the action_link URL
        const token = data.properties.hashed_token || (() => {
            try {
                return new URL(data.properties.action_link).searchParams.get('token');
            } catch {
                return null;
            }
        })();

        if (!token) {
            console.error('[reset-password] Could not extract recovery token from generateLink response');
            return res.status(500).json({ success: false, error: 'Failed to extract recovery token' });
        }

        const resetLink = `${frontendUrl}/reset-password?token=${token}&redirectedFromEmail=true`;

        // Send branded email via resend-service using the correct schema keys
        const resendResponse = await fetch(`${process.env.SUPABASE_URL}/functions/v1/resend-service`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
                to: email,
                templateId: 'password-reset',
                dynamicData: {
                    reset_url: resetLink,
                    confirmation_url: resetLink,
                    support_email: process.env.VITE_SUPPORT_EMAIL || 'support@mobirides.com',
                    app_url: frontendUrl,
                }
            })
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error('[reset-password] resend-service error:', errorText);
            return res.status(500).json({ success: false, error: 'Failed to send password reset email' });
        }

        return res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully'
        });

    } catch (error) {
        console.error('[reset-password] Unhandled error');
        return res.status(500).json({ success: false, error: 'Internal server error during password reset' });
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        return await resetPassword(req, res);
    }
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
}
