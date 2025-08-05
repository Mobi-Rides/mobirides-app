import { supabase } from "@/integrations/supabase/client";

export interface NavigationNotificationData {
  bookingId: string;
  userId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

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