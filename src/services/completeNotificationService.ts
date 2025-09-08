import { supabase } from '@/integrations/supabase/client';
import { ResendEmailService } from './notificationService';
import { pushNotificationService } from './pushNotificationService';
import { Database } from '@/integrations/supabase/types';

type NotificationType = Database['public']['Enums']['notification_type'];
type NotificationRole = Database['public']['Enums']['notification_role'];

interface NotificationData {
  userId: string;
  type: NotificationType;
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
   * Create a complete notification with all delivery channels
   */
  async createNotification(data: NotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Create database notification
      const { error: dbError } = await supabase.from('notifications').insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        description: data.description,
        related_booking_id: data.relatedBookingId || null,
        related_car_id: data.relatedCarId || null,
        metadata: data.metadata as any || {},
        role_target: data.roleTarget || 'system_wide',
        is_read: false
      } as any);

      if (dbError) {
        console.error('Failed to create database notification:', dbError);
        return { success: false, error: dbError.message };
      }

      // 2. Send push notification (non-blocking)
      this.sendPushNotification(data.userId, data.title, data.description);

      // 3. Send email notification (non-blocking)
      this.sendEmailNotification(data.userId, data.title, data.description, data.type);

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
    type: NotificationType
  ): Promise<void> {
    try {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.id === userId && user.email) {
        const emailService = ResendEmailService.getInstance();
        await emailService.sendEmail(
          user.email,
          'notification',
          {
            title,
            description,
            type,
            timestamp: new Date().toISOString()
          },
          title
        );
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
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
        metadata: { sender_name: senderName } as any,
        role_target: 'system_wide',
        is_read: false
      } as any);

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

      const carInfo = booking.cars as any;
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