import { NormalizedNotification } from './notificationHelpers';
import { Database } from '@/integrations/supabase/types';

type NotificationType = Database['public']['Enums']['notification_type'];

// Enhanced metadata interfaces for different notification types
export interface BookingMetadata {
  booking_id?: string;
  car_make?: string;
  car_model?: string;
  pickup_location?: string;
  return_location?: string;
  pickup_date?: string;
  return_date?: string;
  total_amount?: number;
  status?: string;
  host_name?: string;
  renter_name?: string;
}

export interface PaymentMetadata {
  amount?: number;
  currency?: string;
  transaction_id?: string;
  payment_method?: string;
  status?: string;
  description?: string;
  wallet_balance?: number;
}

export interface HandoverMetadata {
  handover_type?: 'pickup' | 'return';
  car_make?: string;
  car_model?: string;
  location?: string;
  status?: 'ready' | 'in_progress' | 'step_completed' | 'completed' | 'delayed' | 'cancelled';
  step_name?: string;
  progress_percentage?: number;
  estimated_time?: string;
  other_party_name?: string;
}

export interface MessageMetadata {
  sender_name?: string;
  conversation_id?: string;
  message_preview?: string;
  message_type?: string;
  attachment_count?: number;
}

export interface SystemMetadata {
  system_event?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  action_required?: boolean;
  maintenance_window?: string;
}

export interface RentalMetadata {
  rental_id?: string;
  car_make?: string;
  car_model?: string;
  current_location?: string;
  status?: string;
  earnings?: number;
  duration?: string;
}

// Union type for all metadata types
export type NotificationMetadata = 
  | BookingMetadata 
  | PaymentMetadata 
  | HandoverMetadata 
  | MessageMetadata 
  | SystemMetadata 
  | RentalMetadata;

// Metadata handler class
export class NotificationMetadataHandler {
  /**
   * Extract and validate metadata based on notification type
   */
  static extractMetadata(notification: NormalizedNotification): NotificationMetadata {
    const rawMetadata = notification.metadata || {};
    const type = notification.type;

    switch (true) {
      case this.isBookingType(type):
        return this.extractBookingMetadata(rawMetadata);
      
      case this.isPaymentType(type):
        return this.extractPaymentMetadata(rawMetadata);
      
      case this.isHandoverType(type):
        return this.extractHandoverMetadata(rawMetadata);
      
      case this.isMessageType(type):
        return this.extractMessageMetadata(rawMetadata);
      
      case this.isSystemType(type):
        return this.extractSystemMetadata(rawMetadata);
      
      case this.isRentalType(type):
        return this.extractRentalMetadata(rawMetadata);
      
      default:
        return rawMetadata as NotificationMetadata;
    }
  }

  /**
   * Generate display-friendly metadata summary
   */
  static getMetadataSummary(notification: NormalizedNotification): string[] {
    const metadata = this.extractMetadata(notification);
    const type = notification.type;
    const summary: string[] = [];

    switch (true) {
      case this.isBookingType(type):
        return this.getBookingSummary(metadata as BookingMetadata);
      
      case this.isPaymentType(type):
        return this.getPaymentSummary(metadata as PaymentMetadata);
      
      case this.isHandoverType(type):
        return this.getHandoverSummary(metadata as HandoverMetadata);
      
      case this.isMessageType(type):
        return this.getMessageSummary(metadata as MessageMetadata);
      
      case this.isSystemType(type):
        return this.getSystemSummary(metadata as SystemMetadata);
      
      case this.isRentalType(type):
        return this.getRentalSummary(metadata as RentalMetadata);
      
      default:
        return [];
    }
  }

  /**
   * Get action buttons based on notification type and metadata
   */
  static getActionButtons(notification: NormalizedNotification): Array<{
    label: string;
    action: string;
    variant?: 'default' | 'outline' | 'destructive';
    icon?: string;
  }> {
    const metadata = this.extractMetadata(notification);
    const type = notification.type;
    const actions: Array<{
      label: string;
      action: string;
      variant?: 'default' | 'outline' | 'destructive';
      icon?: string;
    }> = [];

    switch (true) {
      case this.isBookingType(type):
        if (type === 'booking_request_received' && !notification.is_read) {
          actions.push(
            { label: 'Accept', action: 'accept_booking', variant: 'default', icon: 'Check' },
            { label: 'Decline', action: 'decline_booking', variant: 'outline', icon: 'X' }
          );
        }
        if ((metadata as BookingMetadata).booking_id || notification.related_booking_id) {
          actions.push({ label: 'View Booking', action: 'view_booking', variant: 'outline', icon: 'Eye' });
        }
        break;
      
      case this.isPaymentType(type):
        actions.push({ label: 'View Wallet', action: 'view_wallet', variant: 'outline', icon: 'Wallet' });
        if (type.includes('failed') || type.includes('error')) {
          actions.push({ label: 'Retry Payment', action: 'retry_payment', variant: 'default', icon: 'RefreshCw' });
        }
        break;
      
      case this.isHandoverType(type): {
        const handoverMeta = metadata as HandoverMetadata;
        if (handoverMeta.status === 'ready' || handoverMeta.status === 'in_progress') {
          actions.push({ label: 'View on Map', action: 'view_map', variant: 'default', icon: 'MapPin' });
        }
        if (notification.related_booking_id) {
          actions.push({ label: 'View Booking', action: 'view_booking', variant: 'outline', icon: 'Eye' });
        }
        break;
      }
      
      case this.isMessageType(type):
        actions.push({ label: 'View Messages', action: 'view_messages', variant: 'default', icon: 'MessageSquare' });
        break;
      
      case this.isRentalType(type):
        if (notification.related_booking_id) {
          actions.push({ label: 'View Rental', action: 'view_rental', variant: 'default', icon: 'Car' });
        }
        break;
    }

    return actions;
  }

  // Type checking helpers
  private static isBookingType(type: NotificationType): boolean {
    return type.includes('booking') || type.includes('request') || type.includes('confirmed') || type.includes('cancelled');
  }

  private static isPaymentType(type: NotificationType): boolean {
    return type.includes('payment') || type.includes('wallet') || type.includes('topup') || type.includes('deduction');
  }

  private static isHandoverType(type: NotificationType): boolean {
    return type.includes('handover');
  }

  private static isMessageType(type: NotificationType): boolean {
    return type.includes('message');
  }

  private static isSystemType(type: NotificationType): boolean {
    return type.includes('system') || type.includes('maintenance');
  }

  private static isRentalType(type: NotificationType): boolean {
    return type.includes('rental') || type.includes('earnings');
  }

  // Metadata extraction helpers
  private static extractBookingMetadata(rawMetadata: Record<string, unknown>): BookingMetadata {
    return {
      booking_id: rawMetadata.booking_id as string,
      car_make: rawMetadata.car_make as string,
      car_model: rawMetadata.car_model as string,
      pickup_location: rawMetadata.pickup_location as string,
      return_location: rawMetadata.return_location as string,
      pickup_date: rawMetadata.pickup_date as string,
      return_date: rawMetadata.return_date as string,
      total_amount: rawMetadata.total_amount as number,
      status: rawMetadata.status as string,
      host_name: rawMetadata.host_name as string,
      renter_name: rawMetadata.renter_name as string,
    };
  }

  private static extractPaymentMetadata(rawMetadata: Record<string, unknown>): PaymentMetadata {
    return {
      amount: rawMetadata.amount as number,
      currency: rawMetadata.currency as string || 'BWP',
      transaction_id: rawMetadata.transaction_id as string,
      payment_method: rawMetadata.payment_method as string,
      status: rawMetadata.status as string,
      description: rawMetadata.description as string,
      wallet_balance: rawMetadata.wallet_balance as number,
    };
  }

  private static extractHandoverMetadata(rawMetadata: Record<string, unknown>): HandoverMetadata {
    return {
      handover_type: rawMetadata.handover_type as 'pickup' | 'return',
      car_make: rawMetadata.car_make as string,
      car_model: rawMetadata.car_model as string,
      location: rawMetadata.location as string,
      status: rawMetadata.status as HandoverMetadata['status'],
      step_name: rawMetadata.step_name as string,
      progress_percentage: rawMetadata.progress_percentage as number,
      estimated_time: rawMetadata.estimated_time as string,
      other_party_name: rawMetadata.other_party_name as string,
    };
  }

  private static extractMessageMetadata(rawMetadata: Record<string, unknown>): MessageMetadata {
    return {
      sender_name: rawMetadata.sender_name as string,
      conversation_id: rawMetadata.conversation_id as string,
      message_preview: rawMetadata.message_preview as string,
      message_type: rawMetadata.message_type as string,
      attachment_count: rawMetadata.attachment_count as number,
    };
  }

  private static extractSystemMetadata(rawMetadata: Record<string, unknown>): SystemMetadata {
    return {
      system_event: rawMetadata.system_event as string,
      severity: rawMetadata.severity as SystemMetadata['severity'] || 'info',
      action_required: rawMetadata.action_required as boolean,
      maintenance_window: rawMetadata.maintenance_window as string,
    };
  }

  private static extractRentalMetadata(rawMetadata: Record<string, unknown>): RentalMetadata {
    return {
      rental_id: rawMetadata.rental_id as string,
      car_make: rawMetadata.car_make as string,
      car_model: rawMetadata.car_model as string,
      current_location: rawMetadata.current_location as string,
      status: rawMetadata.status as string,
      earnings: rawMetadata.earnings as number,
      duration: rawMetadata.duration as string,
    };
  }

  // Summary generation helpers
  private static getBookingSummary(metadata: BookingMetadata): string[] {
    const summary: string[] = [];
    
    if (metadata.car_make && metadata.car_model) {
      summary.push(`Vehicle: ${metadata.car_make} ${metadata.car_model}`);
    }
    if (metadata.pickup_location) {
      summary.push(`Pickup: ${metadata.pickup_location}`);
    }
    if (metadata.pickup_date) {
      summary.push(`Date: ${new Date(metadata.pickup_date).toLocaleDateString()}`);
    }
    if (metadata.total_amount) {
      summary.push(`Amount: BWP ${metadata.total_amount.toFixed(2)}`);
    }
    
    return summary;
  }

  private static getPaymentSummary(metadata: PaymentMetadata): string[] {
    const summary: string[] = [];
    
    if (metadata.amount) {
      summary.push(`Amount: ${metadata.currency || 'BWP'} ${metadata.amount.toFixed(2)}`);
    }
    if (metadata.payment_method) {
      summary.push(`Method: ${metadata.payment_method}`);
    }
    if (metadata.status) {
      summary.push(`Status: ${metadata.status}`);
    }
    if (metadata.wallet_balance !== undefined) {
      summary.push(`Balance: BWP ${metadata.wallet_balance.toFixed(2)}`);
    }
    
    return summary;
  }

  private static getHandoverSummary(metadata: HandoverMetadata): string[] {
    const summary: string[] = [];
    
    if (metadata.car_make && metadata.car_model) {
      summary.push(`Vehicle: ${metadata.car_make} ${metadata.car_model}`);
    }
    if (metadata.location) {
      summary.push(`Location: ${metadata.location}`);
    }
    if (metadata.status) {
      summary.push(`Status: ${metadata.status.replace('_', ' ').toUpperCase()}`);
    }
    if (metadata.progress_percentage !== undefined) {
      summary.push(`Progress: ${metadata.progress_percentage}%`);
    }
    if (metadata.step_name) {
      summary.push(`Current Step: ${metadata.step_name}`);
    }
    
    return summary;
  }

  private static getMessageSummary(metadata: MessageMetadata): string[] {
    const summary: string[] = [];
    
    if (metadata.sender_name) {
      summary.push(`From: ${metadata.sender_name}`);
    }
    if (metadata.message_preview) {
      summary.push(`Preview: ${metadata.message_preview}`);
    }
    if (metadata.attachment_count && metadata.attachment_count > 0) {
      summary.push(`Attachments: ${metadata.attachment_count}`);
    }
    
    return summary;
  }

  private static getSystemSummary(metadata: SystemMetadata): string[] {
    const summary: string[] = [];
    
    if (metadata.severity) {
      summary.push(`Severity: ${metadata.severity.toUpperCase()}`);
    }
    if (metadata.action_required) {
      summary.push('Action Required');
    }
    if (metadata.maintenance_window) {
      summary.push(`Maintenance: ${metadata.maintenance_window}`);
    }
    
    return summary;
  }

  private static getRentalSummary(metadata: RentalMetadata): string[] {
    const summary: string[] = [];
    
    if (metadata.car_make && metadata.car_model) {
      summary.push(`Vehicle: ${metadata.car_make} ${metadata.car_model}`);
    }
    if (metadata.earnings) {
      summary.push(`Earnings: BWP ${metadata.earnings.toFixed(2)}`);
    }
    if (metadata.duration) {
      summary.push(`Duration: ${metadata.duration}`);
    }
    if (metadata.status) {
      summary.push(`Status: ${metadata.status}`);
    }
    
    return summary;
  }
}

// Helper function to format metadata for display
export function formatMetadataForDisplay(notification: NormalizedNotification): {
  summary: string[];
  actions: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'outline' | 'destructive';
    icon?: string;
  }>;
  metadata: NotificationMetadata;
} {
  return {
    summary: NotificationMetadataHandler.getMetadataSummary(notification),
    actions: NotificationMetadataHandler.getActionButtons(notification),
    metadata: NotificationMetadataHandler.extractMetadata(notification),
  };
}