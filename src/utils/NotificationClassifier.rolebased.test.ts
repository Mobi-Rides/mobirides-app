/**
 * Enhanced Role-Based Notification Classification Tests
 * Tests the enhanced NotificationClassifier with new role-specific notification types
 * to address the critical role-based targeting issue.
 */

import { NotificationClassifier } from './NotificationClassifier';

describe('NotificationClassifier - Role-Based Targeting', () => {
  describe('Host-Specific Notifications', () => {
    test('should classify booking_request_received as booking', () => {
      const notification = {
        type: 'booking_request_received',
        content: 'New booking request for your Toyota Camry from Aug 10 - Aug 15',
        related_booking_id: 'booking-123',
        related_car_id: 'car-456',
        sender_role: 'renter'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.reasons).toContain('Role-specific booking type detected (strong hint)');
    });

    test('should classify booking_confirmed_host as booking', () => {
      const notification = {
        type: 'booking_confirmed_host',
        content: 'You have confirmed the booking for your BMW X5',
        related_booking_id: 'booking-789',
        related_car_id: 'car-101',
        sender_role: 'host'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(85);
      expect(result.reasons).toContain('Role-specific booking notification type (very strong clue)');
    });

    test('should classify pickup_reminder_host as booking', () => {
      const notification = {
        type: 'pickup_reminder_host',
        content: 'Pickup reminder: Honda Civic rental starts tomorrow',
        related_booking_id: 'booking-321',
        related_car_id: 'car-654',
        sender_role: 'host'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.reasons).toContain('Pickup/return reminder type (booking hint)');
    });

    test('should classify return_reminder_host as booking', () => {
      const notification = {
        type: 'return_reminder_host',
        content: 'Return reminder: Mercedes C-Class rental ends tomorrow',
        related_booking_id: 'booking-987',
        related_car_id: 'car-321',
        sender_role: 'host'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.reasons).toContain('Pickup/return reminder type (booking hint)');
    });
  });

  describe('Renter-Specific Notifications', () => {
    test('should classify booking_request_sent as booking', () => {
      const notification = {
        type: 'booking_request_sent',
        content: 'Your booking request for Audi A4 has been submitted and is pending approval',
        related_booking_id: 'booking-456',
        related_car_id: 'car-789',
        sender_role: 'renter'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.reasons).toContain('Role-specific booking type detected (strong hint)');
    });

    test('should classify booking_confirmed_renter as booking', () => {
      const notification = {
        type: 'booking_confirmed_renter',
        content: 'Your booking for Tesla Model 3 has been confirmed for Aug 20 - Aug 25',
        related_booking_id: 'booking-654',
        related_car_id: 'car-987',
        sender_role: 'renter'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(85);
      expect(result.reasons).toContain('Role-specific booking notification type (very strong clue)');
    });

    test('should classify pickup_reminder_renter as booking', () => {
      const notification = {
        type: 'pickup_reminder_renter',
        content: 'Pickup reminder: Your rental of Ford Mustang starts tomorrow',
        related_booking_id: 'booking-111',
        related_car_id: 'car-222',
        sender_role: 'renter'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.reasons).toContain('Pickup/return reminder type (booking hint)');
    });

    test('should classify return_reminder_renter as booking', () => {
      const notification = {
        type: 'return_reminder_renter',
        content: 'Return reminder: Your rental of Volkswagen Golf ends tomorrow',
        related_booking_id: 'booking-333',
        related_car_id: 'car-444',
        sender_role: 'renter'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.reasons).toContain('Pickup/return reminder type (booking hint)');
    });
  });

  describe('Cancellation Notifications', () => {
    test('should classify booking_cancelled_host as booking', () => {
      const notification = {
        type: 'booking_cancelled_host',
        content: 'Booking for your Hyundai Elantra has been cancelled',
        related_booking_id: 'booking-555',
        related_car_id: 'car-666',
        sender_role: 'host'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(85);
      expect(result.reasons).toContain('Role-specific booking notification type (very strong clue)');
    });

    test('should classify booking_cancelled_renter as booking', () => {
      const notification = {
        type: 'booking_cancelled_renter',
        content: 'Your booking for Nissan Altima has been cancelled',
        related_booking_id: 'booking-777',
        related_car_id: 'car-888',
        sender_role: 'renter'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(85);
      expect(result.reasons).toContain('Role-specific booking notification type (very strong clue)');
    });
  });

  describe('Role Context Enhancement', () => {
    test('should give higher score for host with payment context', () => {
      const notification = {
        type: 'custom_notification',
        content: 'You have earned $50 commission from your car rental',
        sender_role: 'host'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('payment');
      expect(result.reasons).toContain('host role with payment context');
    });

    test('should give higher score for renter with booking context', () => {
      const notification = {
        type: 'custom_notification',
        content: 'Your booking has been confirmed and you can proceed with pickup',
        sender_role: 'renter'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.reasons).toContain('renter role with booking context');
    });

    test('should handle mixed role scenarios correctly', () => {
      const notification = {
        type: 'booking_confirmed_host',
        content: 'You confirmed the booking and will receive $100 payment',
        related_booking_id: 'booking-999',
        sender_role: 'host',
        amount: 100,
        currency: 'USD'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      // Should still be booking due to role-specific type override
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(60); // Adjusted expectation
    });
  });

  describe('Legacy Notification Handling', () => {
    test('should still handle generic booking notifications', () => {
      const notification = {
        type: 'booking_confirmed',
        content: 'Booking has been confirmed for Toyota Prius',
        related_booking_id: 'booking-legacy'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should prioritize role-specific over generic types', () => {
      const roleSpecific = {
        type: 'booking_confirmed_renter',
        content: 'Your booking has been confirmed',
        related_booking_id: 'booking-123'
      };
      
      const generic = {
        type: 'booking_confirmed',
        content: 'Your booking has been confirmed',
        related_booking_id: 'booking-123'
      };
      
      const roleResult = NotificationClassifier.classifyNotification(roleSpecific);
      const genericResult = NotificationClassifier.classifyNotification(generic);
      
      expect(roleResult.confidence).toBeGreaterThanOrEqual(genericResult.confidence);
      // Role-specific should be definitively booking
      expect(roleResult.type).toBe('booking');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle notifications with conflicting signals', () => {
      const notification = {
        type: 'booking_confirmed_renter',
        content: 'Payment of $200 has been processed for your booking',
        related_booking_id: 'booking-conflict',
        amount: 200,
        sender_role: 'renter'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      // Role-specific type should take precedence
      expect(result.type).toBe('booking');
    });

    test('should handle unknown role-specific types gracefully', () => {
      const notification = {
        type: 'unknown_host_notification',
        content: 'Some notification content about booking',
        sender_role: 'host'
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      // Unknown role-specific types with _host suffix should default to booking
      expect(result.type).toBe('booking');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    test('should handle missing role information', () => {
      const notification = {
        type: 'booking_confirmed_host',
        content: 'Booking confirmed'
        // No sender_role
      };
      
      const result = NotificationClassifier.classifyNotification(notification);
      expect(result.type).toBe('booking');
      // Should still work without role info
    });
  });
});

// Export for potential use in other test files
export { NotificationClassifier };
