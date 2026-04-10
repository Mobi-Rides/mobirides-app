// Resend email template configuration
// This file defines the email templates used for various notifications

export interface ResendTemplate {
  id: string;
  name: string;
  subject: string;
  description?: string;
}

export type ResendTemplateKey =
  | 'booking-confirmation'
  | 'booking-request'
  | 'booking-cancelled'
  | 'payment-received'
  | 'payment_received' // Alias for backward compatibility
  | 'payment-failed'
  | 'wallet-topup'
  | 'handover-ready'
  | 'rental-reminder'
  | 'return-reminder'
  | 'verification-complete'
  | 'welcome-renter'
  | 'welcome-host'
  | 'password-reset'
  | 'email-confirmation'
  | 'system_notification' // Alias for backward compatibility
  | 'system-notification'
  | 'insurance-claim-received'
  | 'insurance-claim-update'
  | 'insurance-policy-confirmation'
  | 'insurance-host-claim-notification'
  | 'verification-rejected'
  | 'payout-confirmation'
  | 'review-request'
  | 'listing-status-update'
  | 'booking-modification'
  | 'early-return-notification'
  | 'wallet-notification'
  | 'promo-notification'
  | 'arrival-notification'
  | 'pickup-location-shared'
  | 'return-location-shared';

export const RESEND_TEMPLATES: Record<string, ResendTemplate> = {
  'booking-confirmation': {
    id: 'booking-confirmation',
    name: 'Booking Confirmation',
    subject: '🎉 Your MobiRides Booking is Confirmed!',
    description: 'Sent when a booking request is approved by the host'
  },
  'booking-request': {
    id: 'booking-request',
    name: 'New Booking Request',
    subject: '📋 New Booking Request - Action Required',
    description: 'Sent to hosts when they receive a new booking request'
  },
  'booking-cancelled': {
    id: 'booking-cancelled',
    name: 'Booking Cancelled',
    subject: '❌ Your MobiRides Booking Has Been Cancelled',
    description: 'Sent when a booking is cancelled by host or renter'
  },
  'payment-received': {
    id: 'payment-received',
    name: 'Payment Received',
    subject: '💰 Payment Received - MobiRides',
    description: 'Sent when a payment is successfully processed'
  },
  'payment_received': {
    id: 'payment-received',
    name: 'Payment Received',
    subject: '💰 Payment Received - MobiRides',
    description: 'Alias for payment-received'
  },
  'payment-failed': {
    id: 'payment-failed',
    name: 'Payment Failed',
    subject: '⚠️ Payment Failed - Please Action Needed',
    description: 'Sent when a payment fails'
  },
  'wallet-topup': {
    id: 'wallet-topup',
    name: 'Wallet Top-up',
    subject: '💳 Wallet Update - MobiRides',
    description: 'Sent for wallet balance additions'
  },
  'handover-ready': {
    id: 'handover-ready',
    name: 'Vehicle Handover Ready',
    subject: '🚗 Your Vehicle is Ready for Handover - MobiRides',
    description: 'Sent when a vehicle is ready for pickup or return'
  },
  'rental-reminder': {
    id: 'rental-reminder',
    name: 'Rental Reminder',
    subject: 'Reminder: Your rental starts soon',
    description: 'Sent as a reminder before rental start'
  },
  'return-reminder': {
    id: 'return-reminder',
    name: 'Return Reminder',
    subject: 'Reminder: Please return your rental vehicle',
    description: 'Sent as a reminder before rental end'
  },
  'verification-complete': {
    id: 'verification-complete',
    name: 'Verification Complete',
    subject: '✅ Your MobiRides Account is Now Verified',
    description: 'Sent when user identity is approved'
  },
  'welcome-renter': {
    id: 'welcome-renter',
    name: 'Welcome Renter',
    subject: 'Welcome to MobiRides! 🚗',
    description: 'Welcome email for new renters'
  },
  'welcome-host': {
    id: 'welcome-host',
    name: 'Welcome Host',
    subject: 'Welcome to MobiRides - Start Earning! 💰',
    description: 'Welcome email for new hosts'
  },
  'password-reset': {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset your MobiRides password',
    description: 'Sent for password recovery requests'
  },
  'email-confirmation': {
    id: 'email-confirmation',
    name: 'Email Confirmation',
    subject: 'Confirm your MobiRides account',
    description: 'Sent to confirm email address'
  },
  'system-notification': {
    id: 'system-notification',
    name: 'System Notification',
    subject: 'MobiRides Notification',
    description: 'General system notification'
  },
  'system_notification': {
    id: 'system-notification',
    name: 'System Notification',
    subject: 'MobiRides Notification',
    description: 'Alias for system-notification'
  },
  'insurance-claim-received': {
    id: 'insurance-claim-received',
    name: 'Insurance Claim Received',
    subject: '📋 Claim Received',
    description: 'New insurance claim notification'
  },
  'insurance-claim-update': {
    id: 'insurance-claim-update',
    name: 'Insurance Claim Update',
    subject: '🔔 Claim Status Update',
    description: 'Status update for insurance claim'
  },
  'insurance-policy-confirmation': {
    id: 'insurance-policy-confirmation',
    name: 'Insurance Policy Issued',
    subject: '✅ Insurance Policy Issued',
    description: 'Policy issuance notification'
  },
  'insurance-host-claim-notification': {
    id: 'insurance-host-claim-notification',
    name: 'Host Claim Alert',
    subject: '⚠️ Insurance Claim Filed for Your Vehicle',
    description: 'Host notification for filed claims'
  },
  'verification-rejected': {
    id: 'verification-rejected',
    name: 'Verification Rejected',
    subject: '❌ Verification Update - Action Needed',
    description: 'Sent when identity verification fails'
  },
  'payout-confirmation': {
    id: 'payout-confirmation',
    name: 'Payout Confirmed',
    subject: '💰 Payout Successful - MobiRides',
    description: 'Host payout notification'
  },
  'review-request': {
    id: 'review-request',
    name: 'Review Request',
    subject: '🌟 How was your trip? Leave a review',
    description: 'Post-trip review solicitation'
  },
  'listing-status-update': {
    id: 'listing-status-update',
    name: 'Listing Status Update',
    subject: '📋 Listing Update - MobiRides',
    description: 'Car listing approval/rejection'
  },
  'booking-modification': {
    id: 'booking-modification',
    name: 'Booking Modification',
    subject: '🔔 Booking Modification - MobiRides',
    description: 'Booking change alert'
  },
  'early-return-notification': {
    id: 'early-return-notification',
    name: 'Early Return',
    subject: '🚗 Early Vehicle Return Registered',
    description: 'Early return log notification'
  },
  'wallet-notification': {
    id: 'wallet-notification',
    name: 'Wallet Update',
    subject: '💳 Wallet Activity - MobiRides',
    description: 'Generic wallet activity notification'
  },
  'promo-notification': {
    id: 'promo-notification',
    name: 'Promotion',
    subject: '🎁 Exclusive Offer Just For You!',
    description: 'Marketing and reward notifications'
  },
  'arrival-notification': {
    id: 'arrival-notification',
    name: 'Driver Arrived',
    subject: '🚗 Driver has Arrived!',
    description: 'Sent when driver arrives at pickup'
  },
  'pickup-location-shared': {
    id: 'pickup-location-shared',
    name: 'Pickup Shared',
    subject: '📍 Pickup Location Shared',
    description: 'Location sharing notification'
  },
  'return-location-shared': {
    id: 'return-location-shared',
    name: 'Return Shared',
    subject: '📍 Return Location Shared',
    description: 'Return location sharing notification'
  }
};

// Helper function to get template by key
export function getTemplate(key: ResendTemplateKey): ResendTemplate {
  return RESEND_TEMPLATES[key] || DEFAULT_TEMPLATE;
}

// Helper function to get all template keys
export function getTemplateKeys(): ResendTemplateKey[] {
  return Object.keys(RESEND_TEMPLATES) as ResendTemplateKey[];
}

// Default template for fallback
export const DEFAULT_TEMPLATE: ResendTemplate = {
  id: 'system-notification',
  name: 'Default Notification',
  subject: 'MobiRides Notification',
  description: 'Fallback template'
};