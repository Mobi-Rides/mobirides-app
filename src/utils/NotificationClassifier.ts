import { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export interface NotificationClassification {
  type: 'booking' | 'payment' | 'handover' | 'system' | 'message';
  confidence: number;
  details: string;
}

export class NotificationClassifier {
  static classifyNotification(notification: Notification): NotificationClassification {
    const type = notification.type;
    const content = notification.content || '';
    
    // Map new database enum types to frontend categories
    if (type.includes('booking_request') || 
        type.includes('booking_confirmed') || 
        type.includes('booking_cancelled') ||
        type.includes('pickup_reminder') ||
        type.includes('return_reminder')) {
      return {
        type: 'booking',
        confidence: 95,
        details: 'Booking-related notification'
      };
    }
    
    if (type === 'wallet_topup' || 
        type === 'wallet_deduction' || 
        type === 'payment_received' || 
        type === 'payment_failed') {
      return {
        type: 'payment',
        confidence: 95,
        details: 'Payment-related notification'
      };
    }
    
    if (type === 'handover_ready' || content.toLowerCase().includes('handover')) {
      return {
        type: 'handover',
        confidence: 90,
        details: 'Handover-related notification'
      };
    }
    
    if (type === 'message_received') {
      return {
        type: 'message',
        confidence: 95,
        details: 'Message notification'
      };
    }
    
    // Fallback for unknown types
    return {
      type: 'system',
      confidence: 50,
      details: 'System notification'
    };
  }
  
  static isBookingNotification(notification: Notification): boolean {
    const classification = this.classifyNotification(notification);
    return classification.type === 'booking';
  }
  
  static isPaymentNotification(notification: Notification): boolean {
    const classification = this.classifyNotification(notification);
    return classification.type === 'payment';
  }
  
  static isActiveRentalNotification(notification: Notification): boolean {
    const type = notification.type;
    return type.includes('pickup_reminder') || 
           type.includes('return_reminder') || 
           type === 'handover_ready';
  }
}