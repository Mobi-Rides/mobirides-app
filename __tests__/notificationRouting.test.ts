// @ts-nocheck
import { CompleteNotificationService } from '../src/services/completeNotificationService';
import { ResendEmailService } from '../src/services/notificationService';
import { RESEND_TEMPLATES } from '../src/config/resend-templates';

jest.mock('../src/services/notificationService', () => ({
  ResendEmailService: {
    getInstance: jest.fn(() => ({
      sendEmail: jest.fn().mockResolvedValue({ success: true })
    }))
  }
}));

describe('Notification Routing Verification', () => {
  const service = CompleteNotificationService.getInstance();

  const allNotificationTypes = [
    'arrival_notification',
    'booking_cancelled_host',
    'booking_cancelled_renter',
    'booking_confirmed_host',
    'booking_confirmed_renter',
    'booking_request_received',
    'booking_request_sent',
    'claim_status_updated',
    'claim_submitted',
    'early_return_notification',
    'handover_ready',
    'message_received',
    'navigation_started',
    'payment_failed',
    'payment_received',
    'pickup_location_shared',
    'pickup_reminder',
    'pickup_reminder_host',
    'pickup_reminder_renter',
    'return_location_shared',
    'return_reminder',
    'return_reminder_host',
    'return_reminder_renter',
    'system_notification',
    'wallet_deduction',
    'wallet_topup'
  ];

  it('should map every notification type to a valid ResendTemplateKey', async () => {
    // Access private method for testing purpose
    const getEmailTemplateKey = (service as any).getEmailTemplateKey.bind(service);

    for (const type of allNotificationTypes) {
      const templateKey = getEmailTemplateKey(type);
      
      expect(templateKey).toBeDefined();
      
      expect(RESEND_TEMPLATES[templateKey]).toBeDefined();
      
      const template = RESEND_TEMPLATES[templateKey];
      expect(template.id).toBeDefined();
      expect(template.id).not.toBe('');
    }
  });
});
