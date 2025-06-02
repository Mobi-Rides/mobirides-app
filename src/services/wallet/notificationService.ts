
import { supabase } from "@/integrations/supabase/client";

export class NotificationService {
  async createNotification(hostId: string, type: string, content: string, relatedBookingId?: string) {
    try {
      // Map wallet-specific types to database enum values
      const typeMapping: { [key: string]: "booking_cancelled" | "booking_confirmed" | "booking_request" | "message_received" | "booking_reminder" } = {
        "wallet_topup": "booking_confirmed",
        "wallet_deduction": "booking_cancelled", 
        "wallet_created": "booking_confirmed",
        "wallet_reset": "booking_cancelled"
      };

      const dbType = typeMapping[type] || "booking_confirmed";

      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: hostId,
          type: dbType,
          content: content,
          related_booking_id: relatedBookingId,
          is_read: false
        });

      if (error) {
        console.error("NotificationService: Error creating notification:", error);
      }
    } catch (error) {
      console.error("NotificationService: Unexpected error creating notification:", error);
    }
  }
}

export const notificationService = new NotificationService();
