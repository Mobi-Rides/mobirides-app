// Resend email template configuration
// This file defines the email templates used for various notifications

export interface ResendTemplate {
  id: string;
  name: string;
  subject: string;
  description?: string;
}

export type ResendTemplateKey =
  | 'booking_confirmation'
  | 'booking_request'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'wallet_topup'
  | 'handover_ready'
  | 'rental_reminder'
  | 'return_reminder'
  | 'verification_complete'
  | 'welcome_renter'
  | 'welcome_host'
  | 'password_reset'
  | 'email_confirmation'
  | 'system_notification'
  | 'booking-confirmation'
  | 'owner-booking-notification'
  | 'insurance-claim-received'
  | 'insurance-claim-update'
  | 'insurance-policy-confirmation'
  | 'insurance-host-claim-notification';

export const RESEND_TEMPLATES: Record<ResendTemplateKey, ResendTemplate> = {
  booking_confirmation: {
    id: 'booking-confirmation',
    name: 'Booking Confirmation',
    subject: 'Your MobiRides booking has been confirmed!',
    description: 'Sent when a booking request is approved by the host'
  },
  booking_request: {
    id: 'booking-request',
    name: 'New Booking Request',
    subject: 'New booking request for your vehicle',
    description: 'Sent to hosts when they receive a new booking request'
  },
  booking_cancelled: {
    id: 'booking-cancelled',
    name: 'Booking Cancelled',
    subject: 'Your MobiRides booking has been cancelled',
    description: 'Sent when a booking is cancelled by host or renter'
  },
  payment_received: {
    id: 'payment-received',
    name: 'Payment Received',
    subject: 'Payment received - MobiRides',
    description: 'Sent when a payment is successfully processed'
  },
  payment_failed: {
    id: 'payment-failed',
    name: 'Payment Failed',
    subject: 'Payment failed - Please try again',
    description: 'Sent when a payment fails to process'
  },
  wallet_topup: {
    id: 'wallet-topup',
    name: 'Wallet Top-up',
    subject: 'Your MobiRides wallet has been topped up',
    description: 'Sent when a host successfully tops up their wallet'
  },
  handover_ready: {
    id: 'handover-ready',
    name: 'Vehicle Handover Ready',
    subject: 'Your vehicle is ready for pickup/return',
    description: 'Sent when a vehicle is ready for pickup or return'
  },
  rental_reminder: {
    id: 'rental-reminder',
    name: 'Rental Reminder',
    subject: 'Reminder: Your rental starts soon',
    description: 'Sent as a reminder before rental start time'
  },
  return_reminder: {
    id: 'return-reminder',
    name: 'Return Reminder',
    subject: 'Reminder: Please return your rental vehicle',
    description: 'Sent as a reminder before rental end time'
  },
  verification_complete: {
    id: 'verification-complete',
    name: 'Account Verification Complete',
    subject: 'Your MobiRides account has been verified',
    description: 'Sent when user identity verification is approved'
  },
  welcome_renter: {
    id: 'welcome-renter',
    name: 'Welcome New Renter',
    subject: 'Welcome to MobiRides!',
    description: 'Sent to new users who sign up as renters'
  },
  welcome_host: {
    id: 'welcome-host',
    name: 'Welcome New Host',
    subject: 'Welcome to MobiRides - Start earning with your car!',
    description: 'Sent to new users who become hosts'
  },
  password_reset: {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset your MobiRides password',
    description: 'Sent when user requests password reset'
  },
  email_confirmation: {
    id: 'email-confirmation',
    name: 'Email Confirmation',
    subject: 'Confirm your MobiRides account',
    description: 'Sent to confirm user email address during signup'
  },
  system_notification: {
    id: 'system-notification',
    name: 'System Notification',
    subject: 'MobiRides System Notification',
    description: 'General system notifications and updates'
  },
  'booking-confirmation': {
    id: 'booking-confirmation',
    name: 'Booking Confirmation',
    subject: '🎉 Your MobiRides Booking is Confirmed!',
    description: 'Sent when a booking request is approved by the host'
  },
  'owner-booking-notification': {
    id: 'owner-booking-notification',
    name: 'New Booking Request',
    subject: '📋 New Booking Request - Action Required',
    description: 'Sent to hosts when they receive a new booking request'
  },
  'insurance-claim-received': {
    id: 'insurance-claim-received',
    name: 'Insurance Claim Received',
    subject: '📋 Claim Received - {{claimNumber}}',
    description: 'Sent when a user submits a new insurance claim'
  },
  'insurance-claim-update': {
    id: 'insurance-claim-update',
    name: 'Insurance Claim Status Update',
    subject: '🔔 Claim Status Update - {{claimNumber}}',
    description: 'Sent when an admin updates claim status'
  },
  'insurance-policy-confirmation': {
    id: 'insurance-policy-confirmation',
    name: 'Insurance Policy Confirmation',
    subject: '✅ Insurance Policy Issued - {{policyNumber}}',
    description: 'Sent when an insurance policy is created'
  },
  'insurance-host-claim-notification': {
    id: 'insurance-host-claim-notification',
    name: 'Host Claim Notification',
    subject: '⚠️ Insurance Claim Filed for {{carName}} - {{claimNumber}}',
    description: 'Sent to car owners when a claim is filed on their vehicle'
  }
};

// Helper function to get template by key
export function getTemplate(key: ResendTemplateKey): ResendTemplate {
  return RESEND_TEMPLATES[key];
}

// Helper function to get all template keys
export function getTemplateKeys(): ResendTemplateKey[] {
  return Object.keys(RESEND_TEMPLATES) as ResendTemplateKey[];
}

// Default template for fallback
export const DEFAULT_TEMPLATE: ResendTemplate = {
  id: 'default',
  name: 'Default Notification',
  subject: 'MobiRides Notification',
  description: 'Default template used when no specific template is found'
};