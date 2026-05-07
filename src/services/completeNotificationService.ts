import { supabase } from '@/integrations/supabase/client';
import { ResendEmailService, TwilioWhatsAppService } from './notificationService';
import { pushNotificationService } from './pushNotificationService';
import { Database, Json } from '@/integrations/supabase/types';

type NotificationType = Database['public']['Enums']['notification_type'];
type NotificationRole = Database['public']['Enums']['notification_role'];

interface NotificationData {
  userId: string;
  type: NotificationType | string;
  title: string;
  description: string;
  relatedBookingId?: string;
  relatedCarId?: string;
  metadata?: Record<string, unknown>;
  roleTarget?: NotificationRole;
}

export class CompleteNotificationService {
  private static instance: CompleteNotificationService;

  public static getInstance(): CompleteNotificationService {
    if (!CompleteNotificationService.instance) {
      CompleteNotificationService.instance = new CompleteNotificationService();
    }
    return CompleteNotificationService.instance;
  }

  private constructor() {
    console.log('🔔 CompleteNotificationService initialized');
  }

  /**
   * Safely maps application notification types to valid database enum values.
   * If a type is not in the DB enum, it falls back to 'system_notification'.
   */
  private getDBNotificationType(type: NotificationType | string): Database['public']['Enums']['notification_type'] {
    const validDBTypes: string[] = [
      "booking_request_received", "booking_request_sent", "booking_confirmed_host", 
      "booking_confirmed_renter", "booking_cancelled_host", "booking_cancelled_renter",
      "pickup_reminder_host", "pickup_reminder_renter", "return_reminder_host",
      "return_reminder_renter", "wallet_topup", "wallet_deduction", "message_received",
      "handover_ready", "payment_received", "payment_failed", "system_notification",
      "navigation_started", "pickup_location_shared", "return_location_shared",
      "arrival_notification", "early_return_notification", "pickup_reminder",
      "return_reminder", "claim_submitted", "claim_status_updated"
    ];
    
    if (validDBTypes.includes(type)) {
      return type as Database['public']['Enums']['notification_type'];
    }
    return 'system_notification';
  }

  /**
   * Send WhatsApp notification (async, non-blocking)
   */
  private async sendWhatsAppNotification(
    userId: string,
    type: NotificationType | string,
    metadata?: Record<string, unknown>,
    relatedBookingId?: string
  ): Promise<void> {
    try {
      const whatsappService = TwilioWhatsAppService.getInstance();
      
      // Get user profile for phone number
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, full_name')
        .eq('id', userId)
        .single();

      if (profile?.phone_number) {
        // Map notification type to WhatsApp method
        const typeStr = type as string;
        if (typeStr === 'booking_request_received' || typeStr === 'booking_request_sent' || typeStr === 'awaiting_payment') {
          await whatsappService.sendBookingConfirmation(
            {
              id: userId,
              phone: profile.phone_number,
              name: profile.full_name || 'User'
            },
            {
              bookingId: relatedBookingId || (metadata?.bookingReference as string) || '',
              customerName: (metadata?.customerName as string) || 'Customer',
              hostName: (metadata?.hostName as string) || 'Host',
              carBrand: (metadata?.carBrand as string) || '',
              carModel: (metadata?.carModel as string) || '',
              pickupDate: (metadata?.pickupDate as string) || '',
              pickupTime: (metadata?.pickupTime as string) || '',
              pickupLocation: (metadata?.pickupLocation as string) || '',
              dropoffLocation: (metadata?.dropoffLocation as string) || (metadata?.pickupLocation as string) || '',
              totalAmount: (metadata?.totalAmount as number) || 0,
              bookingReference: (metadata?.bookingReference as string) || ''
            },
            typeStr === 'booking_request_received' || typeStr.includes('_host') // isHost if received or host-specific type
          );
        }
        // Add more WhatsApp mappings as needed
      }
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
    }
  }

  /**
   * Create a complete notification with all delivery channels
   */
  async createNotification(data: NotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Create database notification
      const { error: dbError } = await supabase.from('notifications').insert({
        user_id: data.userId,
        type: this.getDBNotificationType(data.type),
        title: data.title,
        description: data.description,
        related_booking_id: data.relatedBookingId || null,
        related_car_id: data.relatedCarId || null,
        metadata: (data.metadata || {}) as Json,
        role_target: data.roleTarget || 'system_wide',
        is_read: false
      });

      if (dbError) {
        console.error('Failed to create database notification:', dbError);
        return { success: false, error: dbError.message };
      }

      // 2. Send push notification (non-blocking)
      this.sendPushNotification(data.userId, data.title, data.description);

      // 3. Send email notification (non-blocking)
      this.sendEmailNotification(data.userId, data.title, data.description, data.type, data.metadata, data.relatedBookingId);

      // 4. Send WhatsApp notification (non-blocking)
      this.sendWhatsAppNotification(data.userId, data.type, data.metadata, data.relatedBookingId);

      return { success: true };
    } catch (error) {
      console.error('Error in createNotification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send push notification (async, non-blocking)
   */
  private async sendPushNotification(userId: string, title: string, body: string): Promise<void> {
    try {
      await pushNotificationService.sendPushNotification(userId, {
        title,
        body,
        icon: '/favicon.ico',
        url: '/notifications'
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * Send email notification (async, non-blocking)
   */
  private async sendEmailNotification(
    userId: string, 
    title: string, 
    description: string, 
    type: NotificationType | string,
    metadata?: Record<string, unknown>,
    relatedBookingId?: string

  ): Promise<void> {
    try {
      // Get user email and profile data
      const [emailResponse, profileResponse] = await Promise.all([
        supabase.rpc('get_user_email_for_notification', { user_uuid: userId }),
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single()
      ]);

      if (emailResponse.data && emailResponse.data.length > 0) {
        const emailService = ResendEmailService.getInstance();
        const templateKey = this.getEmailTemplateKey((metadata?.type as string) || (type as string));
        const name = profileResponse.data?.full_name || 'User';
        
        // Prepare template-specific data
        const templateData: Record<string, unknown> = {
          name,
          title,
          description,
          type,
          timestamp: new Date().toLocaleDateString(),
          actionUrl: metadata?.actionUrl || `${window.location.origin}/notifications`,
          ...metadata
        };

        // Add specific data mappings for known templates
        if (templateKey === 'booking-confirmation') {
          templateData.customerName = name;
        } else if (templateKey === 'booking-request' || templateKey === 'owner-booking-notification') {
          templateData.hostName = name;
          if (relatedBookingId) {
            templateData.approve_url = `${window.location.origin}/booking-requests/${relatedBookingId}`;
            templateData.decline_url = `${window.location.origin}/booking-requests/${relatedBookingId}`;
          }
        } else if (templateKey === 'awaiting-payment') {
          templateData.customerName = name;
          // Ensure car details are available for payment email
          if (metadata?.carBrand && metadata?.carModel) {
            templateData.carDetails = `${metadata.carBrand} ${metadata.carModel}`;
          }
        }


        await emailService.sendEmail(
          emailResponse.data,
          templateKey,
          templateData,
          (metadata?.subject as string) || title
        );
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  /**
   * Map notification type to email template ID
   */
  private getEmailTemplateKey(type: NotificationType | string): string {
    switch (type as string) {
      case 'booking_request_received':
        return 'booking-request-received';
      case 'booking_request_sent':
        return 'booking-request';
      case 'awaiting_payment':
      case 'payment_required':
        return 'awaiting-payment';
      case 'booking_confirmed_host':
        return 'owner-booking-notification';
      case 'booking_confirmed_renter':
        return 'booking-confirmation';
      case 'booking_cancelled_host':
      case 'booking_cancelled_renter':
        return 'booking-cancelled';
      case 'payment_received':
        return 'payment-received';
      case 'payment_failed':
        return 'payment-failed';
      case 'payout_processed':
        return 'payout-confirmation';
      case 'wallet_topup':
        return 'wallet-topup';
      case 'wallet_deduction':
        return 'wallet-notification';
      case 'handover_ready':
        return 'handover-ready';
      case 'message_received':
        return 'system-notification';
      case 'early_return_notification':
        return 'early-return-notification';
      case 'pickup_reminder':
      case 'pickup_reminder_host':
      case 'pickup_reminder_renter':
        return 'rental-reminder';
      case 'return_reminder':
      case 'return_reminder_host':
      case 'return_reminder_renter':
        return 'return-reminder';
      case 'claim_submitted':
        return 'insurance-claim-received';
      case 'claim_status_updated':
        return 'insurance-claim-update';
      case 'review_request':
        return 'review-request';
      case 'listing_approved':
      case 'listing_rejected':
        return 'listing-status-update';
      case 'booking_modified':
        return 'booking-modification';
      case 'welcome_renter':
        return 'welcome-renter';
      case 'welcome_host':
        return 'welcome-host';
      case 'verification_approved':
        return 'verification-complete';
      case 'verification_rejected':
        return 'verification-rejected';
      case 'system_notification':
      default:
        // Fallback for types that don't have a direct mapping but might be used
        if ((type as string) === 'awaiting_payment' || (type as string) === 'payment_required') {
          return 'awaiting-payment';
        }
        return 'system-notification';
    }
  }

  /**
   * Create message notification with push notification
   */
  async createMessageNotification(
    recipientId: string,
    senderName: string,
    messagePreview?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const title = 'New Message';
      const description = messagePreview 
        ? `${senderName}: ${messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview}`
        : `You have a new message from ${senderName}`;

      // Create database notification
      const { error: dbError } = await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'message_received',
        title,
        description,
        metadata: { sender_name: senderName },
        role_target: 'system_wide',
        is_read: false
      });

      if (dbError) {
        console.error('Failed to create message notification:', dbError);
        return { success: false, error: dbError.message };
      }

      // Send push notification (non-blocking)
      this.sendMessagePushNotification(recipientId, senderName, messagePreview);

      return { success: true };
    } catch (error) {
      console.error('Error creating message notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send message push notification (async, non-blocking)
   */
  private async sendMessagePushNotification(
    recipientId: string, 
    senderName: string, 
    messagePreview?: string
  ): Promise<void> {
    try {
      await pushNotificationService.sendMessageNotification(recipientId, {
        senderName,
        messagePreview
      });
    } catch (error) {
      console.error('Failed to send message push notification:', error);
    }
  }

  /**
   * Create booking notification with proper role targeting
   */
  async createBookingNotification(
    bookingId: string,
    type: 'request' | 'confirmed' | 'cancelled',
    hostMessage: string,
    renterMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          renter_id,
          cars (
            id,
            owner_id,
            brand,
            model
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        return { success: false, error: 'Booking not found' };
      }

      const carInfo = booking.cars as unknown as { id: string; owner_id: string; brand: string; model: string };
      const hostId = carInfo.owner_id;
      const renterId = booking.renter_id;

      // Create notifications for both parties
      const results = await Promise.allSettled([
        // Host notification
        this.createNotification({
          userId: hostId,
          type: this.getHostNotificationType(type),
          title: this.getNotificationTitle(type, 'host'),
          description: hostMessage,
          relatedBookingId: bookingId,
          relatedCarId: carInfo.id,
          roleTarget: 'host_only'
        }),
        // Renter notification  
        this.createNotification({
          userId: renterId,
          type: this.getRenterNotificationType(type),
          title: this.getNotificationTitle(type, 'renter'),
          description: renterMessage,
          relatedBookingId: bookingId,
          relatedCarId: carInfo.id,
          roleTarget: 'renter_only'
        })
      ]);

      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('Some notifications failed:', failures);
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating booking notifications:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private getHostNotificationType(type: string): NotificationType {
    switch (type) {
      case 'request': return 'booking_request_received';
      case 'confirmed': return 'booking_confirmed_host';
      case 'cancelled': return 'booking_cancelled_host';
      default: return 'system_notification';
    }
  }

  private getRenterNotificationType(type: string): NotificationType {
    switch (type) {
      case 'request': return 'booking_request_sent';
      case 'confirmed': return 'booking_confirmed_renter';
      case 'cancelled': return 'booking_cancelled_renter';
      default: return 'system_notification';
    }
  }

  private getNotificationTitle(type: string, role: 'host' | 'renter'): string {
    switch (type) {
      case 'request':
        return role === 'host' ? 'New Booking Request' : 'Request Submitted';
      case 'confirmed':
        return 'Booking Confirmed';
      case 'cancelled':
        return 'Booking Cancelled';
      default:
        return 'Notification';
    }
  }
}

export const completeNotificationService = CompleteNotificationService.getInstance();