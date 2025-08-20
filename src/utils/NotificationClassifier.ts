import { NormalizedNotification } from "./notificationHelpers";

type Notification = NormalizedNotification;

interface NotificationClassification {
  type: 'booking' | 'payment' | 'handover' | 'system';
  confidence: number;
  details: string;
}

export class NotificationClassifier {
  static classifyNotification(notification: Notification): NotificationClassification {
    const type = String(notification.type);
    
    // Booking-related notifications
    if (type.includes('booking') || type.includes('request') || type.includes('confirmed') || type.includes('cancelled')) {
      return {
        type: 'booking',
        confidence: 95,
        details: `Classified as booking notification based on type: ${type}`
      };
    }
    
    // Payment/wallet notifications  
    if (type.includes('wallet') || type.includes('payment') || type.includes('topup') || type.includes('deduction') || type === 'payment_received' || type === 'payment_failed') {
      return {
        type: 'payment',
        confidence: 95,
        details: `Classified as payment notification based on type: ${type}`
      };
    }
    
    // Handover/pickup/return/navigation/arrival notifications
    if (type.includes('pickup') || type.includes('return') || type.includes('handover') || type.includes('navigation') || type.includes('arrival') || type.includes('location_shared')) {
      return {
        type: 'handover',
        confidence: 90,
        details: `Classified as handover notification based on type: ${type}`
      };
    }
    
    
    // System notifications (explicit system types)
    if (type === 'system_notification' || type.includes('system')) {
      return {
        type: 'system',
        confidence: 95,
        details: `Classified as system notification based on type: ${type}`
      };
    }
    
    // Default to system
    return {
      type: 'system',
      confidence: 50,
      details: `Default classification for type: ${type}`
    };
  }

  static isBookingNotification(notification: Notification): boolean {
    const type = String(notification.type);
    return type.includes('booking') || type.includes('request') || type.includes('confirmed') || type.includes('cancelled');
  }

  static isPaymentNotification(notification: Notification): boolean {
    const type = String(notification.type);
    return type.includes('wallet') || type.includes('payment') || type.includes('topup') || type.includes('deduction') || type === 'payment_received' || type === 'payment_failed';
  }

  static isActiveRentalNotification(notification: Notification): boolean {
    const type = String(notification.type);
    return type.includes('pickup') || type.includes('return') || type.includes('handover') || type.includes('navigation') || type.includes('arrival') || type.includes('location_shared');
  }

  static isSystemNotification(notification: Notification): boolean {
    const type = String(notification.type);
    return type === 'system_notification' || type.includes('system');
  }
}