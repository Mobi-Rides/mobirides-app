import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getEmailTemplate } from '../resend-templates.js';

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
 * Send booking confirmation email
 */
async function sendBookingConfirmation(req, res) {
    try {
        const {
            to,
            isHost = false,
            bookingData
        } = req.body;

        if (!to || !bookingData) {
            return res.status(400).json({
                success: false,
                error: 'Email recipient and booking data are required'
            });
        }

        const templateId = isHost ? 'owner-booking-notification' : 'booking-confirmation';

        // Prepare template data
        const templateData = {
            customerName: bookingData.customerName || 'Customer',
            hostName: bookingData.hostName || 'Host',
            bookingReference: bookingData.bookingReference || 'N/A',
            carBrand: bookingData.carBrand || 'N/A',
            carModel: bookingData.carModel || 'N/A',
            pickupDate: bookingData.pickupDate || 'N/A',
            pickupTime: bookingData.pickupTime || 'N/A',
            pickupLocation: bookingData.pickupLocation || 'N/A',
            dropoffLocation: bookingData.dropoffLocation || 'N/A',
            totalAmount: bookingData.totalAmount || 0,
            carImage: bookingData.carImage || '',
            app_url: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
            support_email: process.env.VITE_FROM_EMAIL || 'support@mobirides.com'
        };

        // Get template
        const { subject, html } = getEmailTemplate(templateId, templateData);

        // Send email using Resend
        const emailResponse = await resend.emails.send({
            from: process.env.VITE_FROM_EMAIL || 'MobiRides <noreply@mobirides.com>',
            to: to,
            subject: subject,
            html: html,
        });

        console.log(`Booking ${isHost ? 'request' : 'confirmation'} email sent successfully to:`, to);

        return res.json({
            success: true,
            message: `Booking ${isHost ? 'request' : 'confirmation'} email sent successfully.`,
            messageId: emailResponse.data?.id
        });

    } catch (error) {
        console.error('Error sending booking confirmation email:', error);

        return res.status(500).json({
            success: false,
            error: 'Internal server error during email sending',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

async function handler(req, res) {
    if (req.method === 'POST') {
        return await sendBookingConfirmation(req, res);
    } else {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.'
        });
    }
}

export { sendBookingConfirmation };
export default handler;
