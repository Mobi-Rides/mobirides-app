import { supabase } from "@/integrations/supabase/client";

// Legacy navigation types for backward compatibility
export interface NavigationNotificationData {
  bookingId: string;
  userId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// New interfaces for comprehensive notification system
export interface NotificationRecipient {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  whatsappEnabled?: boolean;
  emailEnabled?: boolean;
}

export interface BookingNotificationData {
  bookingId: string;
  customerName: string;
  hostName: string;
  carBrand: string;
  carModel: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  totalAmount: number;
  bookingReference: string;
}

// Twilio & SendGrid Service Class
export class TwilioNotificationService {
  private static instance: TwilioNotificationService;

  public static getInstance(): TwilioNotificationService {
    if (!TwilioNotificationService.instance) {
      TwilioNotificationService.instance = new TwilioNotificationService();
    }
    return TwilioNotificationService.instance;
  }

  private constructor() {
    console.log('🚀 TwilioNotificationService initialized');
  }

  /**
   * Send WhatsApp notification via Supabase Edge Function
   */
  private async sendWhatsApp(
    to: string,
    templateSid: string,
    variables: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          to: to.startsWith('+') ? to : `+${to}`,
          templateSid,
          variables
        }
      });

      if (error) throw error;

      console.log(`✅ WhatsApp sent successfully: ${data.messageId}`);
      return { success: true, messageId: data.messageId };
    } catch (error) {
      console.error('❌ WhatsApp sending failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send email notification via Supabase Edge Function
   */
  private async sendEmail(
    to: string,
    templateId: string,
    dynamicData: Record<string, any>,
    subject?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          templateId,
          dynamicData: {
            ...dynamicData,
            companyName: 'MobiRides',
            supportEmail: 'support@mobirides.com',
            year: new Date().getFullYear()
          },
          subject
        }
      });

      if (error) throw error;

      console.log(`✅ Email sent successfully to ${to}`);
      return { success: true, messageId: data.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send booking confirmation notifications
   */
  async sendBookingConfirmation(
    recipient: NotificationRecipient,
    bookingData: BookingNotificationData
  ): Promise<{ whatsapp?: any; email?: any }> {
    const results: { whatsapp?: any; email?: any } = {};

    // WhatsApp notification
    if (recipient.whatsappEnabled && recipient.phone) {
      const whatsappResult = await this.sendWhatsApp(
        recipient.phone,
        'BOOKING_CONFIRMATION_TEMPLATE',
        {
          '1': recipient.name,
          '2': bookingData.bookingReference,
          '3': `${bookingData.carBrand} ${bookingData.carModel}`,
          '4': bookingData.pickupDate,
          '5': bookingData.pickupTime,
          '6': bookingData.pickupLocation
        }
      );

      results.whatsapp = whatsappResult;
    }

    // Email notification
    if (recipient.emailEnabled && recipient.email) {
      const emailResult = await this.sendEmail(
        recipient.email,
        'booking-confirmation',
        {
          customerName: recipient.name,
          bookingReference: bookingData.bookingReference,
          carDetails: `${bookingData.carBrand} ${bookingData.carModel}`,
          pickupDate: bookingData.pickupDate,
          pickupTime: bookingData.pickupTime,
          pickupLocation: bookingData.pickupLocation,
          dropoffLocation: bookingData.dropoffLocation,
          totalAmount: bookingData.totalAmount,
          hostName: bookingData.hostName
        }
      );

      results.email = emailResult;
    }

    return results;
  }

  /**
   * Send pickup reminder notifications
   */
  async sendPickupReminder(
    recipient: NotificationRecipient,
    bookingData: BookingNotificationData,
    hoursUntilPickup: number
  ): Promise<{ whatsapp?: any; email?: any }> {
    const results: { whatsapp?: any; email?: any } = {};
    const timeText = hoursUntilPickup === 24 ? 'tomorrow' : `in ${hoursUntilPickup} hours`;

    // WhatsApp notification
    if (recipient.whatsappEnabled && recipient.phone) {
      const whatsappResult = await this.sendWhatsApp(
        recipient.phone,
        'PICKUP_REMINDER_TEMPLATE',
        {
          '1': recipient.name,
          '2': `${bookingData.carBrand} ${bookingData.carModel}`,
          '3': timeText,
          '4': bookingData.pickupLocation,
          '5': bookingData.pickupTime
        }
      );

      results.whatsapp = whatsappResult;
    }

    return results;
  }
}

// Legacy function for backward compatibility
export const createNavigationNotification = async (
  type: 'navigation_started' | 'pickup_location_shared' | 'return_location_shared' | 'arrival_notification',
  data: NavigationNotificationData
) => {
  try {
    // Map navigation types to existing notification types or use a generic approach
    const contentMap = {
      navigation_started: 'Navigation has started for your booking',
      pickup_location_shared: 'Pickup location has been shared',
      return_location_shared: 'Return location has been shared',
      arrival_notification: 'Driver has arrived at the pickup location'
    };

    let content = contentMap[type]; // Changed from const to let
    if (data.location) {
      content += ` at ${data.location.address || `${data.location.latitude}, ${data.location.longitude}`}`;
    }

    // Use the existing create_booking_notification function
    const { error } = await supabase.rpc('create_booking_notification', {
      p_booking_id: data.bookingId,
      p_notification_type: 'booking_reminder', // Use existing type as fallback
      p_content: content
    });

    if (error) {
      console.error('Failed to create navigation notification:', error);
      throw error;
    }

    console.log(`Navigation notification created: ${type}`);
  } catch (error) {
    console.error('Error creating navigation notification:', error);
    throw error;
  }
};

// Helper function to trigger navigation notifications
export const triggerNavigationEvent = async (
  bookingId: string,
  event: 'start_navigation' | 'share_pickup' | 'share_return' | 'arrive_pickup',
  userId: string,
  location?: { latitude: number; longitude: number; address?: string }
) => {
  const typeMap = {
    start_navigation: 'navigation_started' as const,
    share_pickup: 'pickup_location_shared' as const,
    share_return: 'return_location_shared' as const,
    arrive_pickup: 'arrival_notification' as const
  };

  await createNavigationNotification(typeMap[event], {
    bookingId,
    userId,
    location
  });
};