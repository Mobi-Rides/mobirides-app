import { supabase } from "../integrations/supabase/client";
import { reverseGeocode } from "../utils/mapbox";
import { RESEND_TEMPLATES, ResendTemplateKey } from '../config/resend-templates';

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
  carImage?: string;
}

// Resend Email Service Class
export class ResendEmailService {
  private static instance: ResendEmailService;

  public static getInstance(): ResendEmailService {
    if (!ResendEmailService.instance) {
      ResendEmailService.instance = new ResendEmailService();
    }
    return ResendEmailService.instance;
  }

  private constructor() {
    console.log('📧 ResendEmailService initialized');
  }

  /**
   * Send email via API endpoint using Resend (same as password reset flow)
   */
  public async sendEmail(
    to: string,
    templateId: string,
    dynamicData: Record<string, unknown>,
    subject?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch('/api/notifications/booking-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          templateId,
          bookingData: dynamicData,
          isHost: templateId === 'owner-booking-notification'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error sending email:", data.error);
        return { success: false, error: data.error || 'Failed to send email' };
      }

      if (!data.success) {
        console.error("Error from API:", data.error);
        return { success: false, error: data.error };
      }

      return { success: true, messageId: data.messageId };
    } catch (e) {
      console.error("Unhandled error in sendEmail:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get default subject based on template type
   */
  private getDefaultSubject(templateId: string): string {
    switch (templateId) {
      case 'booking-confirmation':
        return 'Booking Confirmation - MobiRides';
      case 'booking-request':
        return 'New Booking Request - MobiRides';
      case 'pickup-reminder':
        return 'Pickup Reminder - MobiRides';
      case 'return-reminder':
        return 'Return Reminder - MobiRides';
      default:
        return 'Notification from MobiRides';
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    recipient: NotificationRecipient,
    bookingData: BookingNotificationData,
    isHost: boolean = false
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!recipient.email) {
      return { success: false, error: 'No email address provided' };
    }

    const templateData = {
      name: recipient.name,
      bookingReference: bookingData.bookingReference,
      carBrand: bookingData.carBrand,
      carModel: bookingData.carModel,
      pickupDate: bookingData.pickupDate,
      pickupTime: bookingData.pickupTime,
      pickupLocation: bookingData.pickupLocation,
      dropoffLocation: bookingData.dropoffLocation,
      totalAmount: bookingData.totalAmount,
      customerName: bookingData.customerName,
      hostName: bookingData.hostName,
      carImage: bookingData.carImage || ''
    };

    const templateKey = isHost ? 'owner-booking-notification' : 'booking-confirmation';
    const subject = isHost 
      ? `New Booking Request - ${bookingData.carBrand} ${bookingData.carModel}`
      : `Booking Confirmed - ${bookingData.carBrand} ${bookingData.carModel}`;

    return this.sendEmail(recipient.email, templateKey, templateData, subject);
  }

  /**
   * Send pickup reminder email
   */
  async sendPickupReminder(
    recipient: NotificationRecipient,
    bookingData: BookingNotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!recipient.email) {
      return { success: false, error: 'No email address provided' };
    }

    const templateData = {
      name: recipient.name,
      bookingReference: bookingData.bookingReference,
      carBrand: bookingData.carBrand,
      carModel: bookingData.carModel,
      pickupDate: bookingData.pickupDate,
      pickupTime: bookingData.pickupTime,
      pickupLocation: bookingData.pickupLocation
    };

    return this.sendEmail(
      recipient.email, 
      'pickupReminder',
      templateData,
      `Pickup Reminder - ${bookingData.carBrand} ${bookingData.carModel}`
    );
  }

  /**
   * Send return reminder email
   */
  async sendReturnReminder(
    recipient: NotificationRecipient,
    bookingData: BookingNotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!recipient.email) {
      return { success: false, error: 'No email address provided' };
    }

    const templateData = {
      name: recipient.name,
      bookingReference: bookingData.bookingReference,
      carBrand: bookingData.carBrand,
      carModel: bookingData.carModel,
      dropoffLocation: bookingData.dropoffLocation
    };

    return this.sendEmail(
      recipient.email, 
      'return-reminder',
      templateData,
      `Return Reminder - ${bookingData.carBrand} ${bookingData.carModel}`
    );
  }

  /**
   * Send promo code notification email
   */
  async sendPromoNotification(
    recipient: NotificationRecipient,
    promoData: {
      code: string;
      discount: string;
      description: string;
      validUntil?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!recipient.email) {
      return { success: false, error: 'No email address provided' };
    }

    const templateData = {
      name: recipient.name,
      promoCode: promoData.code,
      discountValue: promoData.discount,
      description: promoData.description,
      validUntil: promoData.validUntil || 'Limited time only',
    };

    return this.sendEmail(
      recipient.email,
      'promo-notification', // Requires this template ID in Resend
      templateData,
      `Special Offer: ${promoData.discount} with code ${promoData.code}`
    );
  }
}

// Twilio WhatsApp Service Class
export class TwilioWhatsAppService {
  private static instance: TwilioWhatsAppService;

  public static getInstance(): TwilioWhatsAppService {
    if (!TwilioWhatsAppService.instance) {
      TwilioWhatsAppService.instance = new TwilioWhatsAppService();
    }
    return TwilioWhatsAppService.instance;
  }

  private constructor() {
    console.log('💬 TwilioWhatsAppService initialized');
  }

  /**
   * Send WhatsApp notification via Supabase Edge Function
   */
  public async sendWhatsApp(
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
   * Send booking confirmation WhatsApp
   */
  async sendBookingConfirmation(
    recipient: NotificationRecipient,
    bookingData: BookingNotificationData,
    isHost: boolean = false
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!recipient.phone) {
      return { success: false, error: 'No phone number provided' };
    }

    const templateSid = isHost ? 'BOOKING_REQUEST_TEMPLATE' : 'BOOKING_CONFIRMATION_TEMPLATE';
    const variables = {
      '1': recipient.name,
      '2': bookingData.bookingReference,
      '3': `${bookingData.carBrand} ${bookingData.carModel}`,
      '4': bookingData.pickupDate,
      '5': bookingData.pickupTime,
      '6': bookingData.pickupLocation
    };

    return this.sendWhatsApp(recipient.phone, templateSid, variables);
  }

  /**
   * Send pickup reminder WhatsApp
   */
  async sendPickupReminder(
    recipient: NotificationRecipient,
    bookingData: BookingNotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!recipient.phone) {
      return { success: false, error: 'No phone number provided' };
    }

    const variables = {
      '1': recipient.name,
      '2': bookingData.bookingReference,
      '3': `${bookingData.carBrand} ${bookingData.carModel}`,
      '4': bookingData.pickupDate,
      '5': bookingData.pickupTime,
      '6': bookingData.pickupLocation
    };

    return this.sendWhatsApp(recipient.phone, 'PICKUP_REMINDER_TEMPLATE', variables);
  }

  /**
   * Send return reminder WhatsApp
   */
  async sendReturnReminder(
    recipient: NotificationRecipient,
    bookingData: BookingNotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!recipient.phone) {
      return { success: false, error: 'No phone number provided' };
    }

    const variables = {
      '1': recipient.name,
      '2': bookingData.bookingReference,
      '3': `${bookingData.carBrand} ${bookingData.carModel}`,
      '4': bookingData.dropoffLocation
    };

    return this.sendWhatsApp(recipient.phone, 'RETURN_REMINDER_TEMPLATE', variables);
  }
}

// Unified Notification Service (Legacy - for backward compatibility)
export class TwilioNotificationService {
  private static instance: TwilioNotificationService;
  private emailService: ResendEmailService;
  private whatsappService: TwilioWhatsAppService;

  public static getInstance(): TwilioNotificationService {
    if (!TwilioNotificationService.instance) {
      TwilioNotificationService.instance = new TwilioNotificationService();
    }
    return TwilioNotificationService.instance;
  }

  private constructor() {
    this.emailService = ResendEmailService.getInstance();
    this.whatsappService = TwilioWhatsAppService.getInstance();
    console.log('🚀 TwilioNotificationService initialized (legacy compatibility mode)');
  }

  /**
   * Send WhatsApp notification via Supabase Edge Function
   * @deprecated Use TwilioWhatsAppService directly
   */
  public async sendWhatsApp(
    to: string,
    templateSid: string,
    variables: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.whatsappService.sendWhatsApp(to, templateSid, variables);
  }

  /**
   * Send email notification via Resend
   * @deprecated Use ResendEmailService directly
   */
  public async sendEmail(
    to: string,
    templateId: string,
    dynamicData: Record<string, unknown>,
    subject?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.emailService.sendEmail(to, templateId, dynamicData, subject);
  }

  /**
   * Send booking confirmation notifications
   */
  async sendBookingConfirmation(
    recipient: NotificationRecipient,
    bookingData: BookingNotificationData
  ): Promise<{ whatsapp?: { success: boolean; messageId?: string; error?: string }; email?: { success: boolean; messageId?: string; error?: string } }> {
    const results: { whatsapp?: { success: boolean; messageId?: string; error?: string }; email?: { success: boolean; messageId?: string; error?: string } } = {};

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
  ): Promise<{ whatsapp?: { success: boolean; messageId?: string; error?: string }; email?: { success: boolean; messageId?: string; error?: string } }> {
    const results: { whatsapp?: { success: boolean; messageId?: string; error?: string }; email?: { success: boolean; messageId?: string; error?: string } } = {};
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

  /**
   * Send early return notifications
   */
  async sendEarlyReturnNotification(
    recipient: NotificationRecipient,
    bookingData: BookingNotificationData,
    actualReturnDate: string
  ): Promise<{ whatsapp?: { success: boolean; messageId?: string; error?: string }; email?: { success: boolean; messageId?: string; error?: string } }> {
    const results: { whatsapp?: { success: boolean; messageId?: string; error?: string }; email?: { success: boolean; messageId?: string; error?: string } } = {};

    // WhatsApp notification
    if (recipient.whatsappEnabled && recipient.phone) {
      const whatsappResult = await this.sendWhatsApp(
        recipient.phone,
        'EARLY_RETURN_TEMPLATE',
        {
          '1': recipient.name,
          '2': bookingData.bookingReference,
          '3': `${bookingData.carBrand} ${bookingData.carModel}`,
          '4': actualReturnDate,
          '5': bookingData.hostName
        }
      );

      results.whatsapp = whatsappResult;
    }

    // Email notification
    if (recipient.emailEnabled && recipient.email) {
      const emailResult = await this.sendEmail(
        recipient.email,
        'early-return-notification',
        {
          customerName: recipient.name,
          bookingReference: bookingData.bookingReference,
          carDetails: `${bookingData.carBrand} ${bookingData.carModel}`,
          actualReturnDate: actualReturnDate,
          originalEndDate: bookingData.pickupDate, // This should be end date in real implementation
          hostName: bookingData.hostName,
          totalAmount: bookingData.totalAmount
        },
        'Early Return Notification - Booking Completed'
      );

      results.email = emailResult;
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
      // Try to get a human-readable address first, fallback to coordinates if needed
      const locationText = data.location.address || 
        await reverseGeocode(data.location.latitude, data.location.longitude);
      content += ` at ${locationText}`;
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

// Export new services for direct usage
export const resendEmailService = ResendEmailService.getInstance();
export const twilioWhatsAppService = TwilioWhatsAppService.getInstance();

// Helper function to create early return notification
export const createEarlyReturnNotification = async (
  bookingId: string,
  actualReturnDate: string,
  originalEndDate: string
) => {
  try {
    const content = `Booking returned early on ${actualReturnDate}. Originally scheduled until ${originalEndDate}.`;

    // Use the existing create_booking_notification function
    const { error } = await supabase.rpc('create_booking_notification', {
      p_booking_id: bookingId,
      p_notification_type: 'early_return_notification',
      p_content: content
    });

    if (error) {
      console.error('Failed to create early return notification:', error);
      throw error;
    }

    console.log(`Early return notification created for booking: ${bookingId}`);
  } catch (error) {
    console.error('Error creating early return notification:', error);
    throw error;
  }
};