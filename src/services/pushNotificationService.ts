import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export class PushNotificationService {
  private static instance: PushNotificationService;

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private constructor() {
    console.log('📱 PushNotificationService initialized');
  }

  /**
   * Send push notification via Supabase Edge Function
   */
  public async sendPushNotification(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
    try {
      // Get user's push subscriptions using direct SQL query
      const { data: subscriptions, error: fetchError } = await supabase
        .from('push_subscriptions' as any)
        .select('*')
        .eq('user_id', userId);

      if (fetchError) {
        console.error('Error fetching push subscriptions:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('No push subscriptions found for user:', userId);
        return { success: true, messageIds: [] };
      }

      const results = [];
      
      // Send push notification to all user's devices
      for (const subscription of subscriptions as any[]) {
        try {
          const { data, error } = await supabase.functions.invoke('send-push-notification', {
            body: {
              subscription: {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
                }
              },
              payload: {
                title: payload.title,
                body: payload.body,
                icon: payload.icon || '/favicon.ico',
                url: payload.url || '/'
              }
            }
          });

          if (error) {
            console.error('Error sending push notification:', error);
            results.push({ success: false, error: error.message });
          } else {
            console.log('Push notification sent successfully to device');
            results.push({ success: true, messageId: 'push_sent' });
          }
        } catch (error) {
          console.error('Error sending push to device:', error);
          results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        messageIds: results.filter(r => r.success).map(r => r.messageId || 'push_sent'),
        error: successCount === 0 ? 'All push notifications failed' : undefined
      };
      
    } catch (error) {
      console.error('Unhandled error in sendPushNotification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send notification for booking events
   */
  async sendBookingNotification(
    userId: string,
    bookingData: {
      type: 'confirmed' | 'request' | 'cancelled' | 'reminder';
      carBrand: string;
      carModel: string;
      bookingReference: string;
    }
  ): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
    let title: string;
    let body: string;
    let url = '/bookings';

    switch (bookingData.type) {
      case 'confirmed':
        title = 'Booking Confirmed';
        body = `Your booking for ${bookingData.carBrand} ${bookingData.carModel} has been confirmed!`;
        break;
      case 'request':
        title = 'New Booking Request';
        body = `You have a new booking request for ${bookingData.carBrand} ${bookingData.carModel}`;
        url = '/host-bookings';
        break;
      case 'cancelled':
        title = 'Booking Cancelled';
        body = `Booking for ${bookingData.carBrand} ${bookingData.carModel} has been cancelled`;
        break;
      case 'reminder':
        title = 'Pickup Reminder';
        body = `Don't forget to pick up ${bookingData.carBrand} ${bookingData.carModel} today!`;
        break;
      default:
        title = 'Booking Update';
        body = `Update for your ${bookingData.carBrand} ${bookingData.carModel} booking`;
    }

    return this.sendPushNotification(userId, { title, body, url });
  }

  /**
   * Send wallet notification
   */
  async sendWalletNotification(
    userId: string,
    walletData: {
      type: 'topup' | 'deduction' | 'payment_received';
      amount: number;
    }
  ): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
    let title: string;
    let body: string;

    switch (walletData.type) {
      case 'topup':
        title = 'Wallet Top-up';
        body = `Your wallet has been topped up with P${walletData.amount.toFixed(2)}`;
        break;
      case 'deduction':
        title = 'Payment Deducted';
        body = `P${walletData.amount.toFixed(2)} has been deducted from your wallet`;
        break;
      case 'payment_received':
        title = 'Payment Received';
        body = `You received P${walletData.amount.toFixed(2)} in your wallet`;
        break;
      default:
        title = 'Wallet Update';
        body = `Your wallet balance has been updated`;
    }

    return this.sendPushNotification(userId, { 
      title, 
      body, 
      url: '/profile' 
    });
  }
}

export const pushNotificationService = PushNotificationService.getInstance();