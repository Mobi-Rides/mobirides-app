import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export class NotificationService {
  async createWalletNotification(
    hostId: string,
    type: 'topup' | 'deduction' | 'payment_received',
    amount: number,
    description?: string
  ) {
    try {
      // Use the new database function for wallet notifications
      const { error } = await supabase.rpc('create_wallet_notification', {
        p_host_id: hostId,
        p_type: type,
        p_amount: amount,
        p_description: description
      });

      if (error) {
        console.error("NotificationService: Error creating wallet notification:", error);
      }
    } catch (error) {
      console.error("NotificationService: Unexpected error creating wallet notification:", error);
    }
  }

  async createNotification(
    hostId: string,
    type: string,
    content: string,
    relatedBookingId?: string,
  ) {
    try {
      // Use proper enum types instead of mapping
      const typeMapping: {
        [key: string]: string;
      } = {
        wallet_topup: "wallet_topup",
        wallet_deduction: "wallet_deduction", 
        wallet_created: "wallet_topup",
        wallet_reset: "wallet_deduction",
        booking_confirmed: "booking_confirmed_host",
        booking_cancelled: "booking_cancelled_host",
        booking_request: "booking_request_received",
        message_received: "pickup_reminder_renter",
        booking_reminder: "pickup_reminder_host"
      };

      const dbType = typeMapping[type] || "pickup_reminder_host";

      const { error } = await supabase.from("notifications").insert({
        user_id: hostId,
        type: dbType as Database['public']['Enums']['notification_type'],
        title: 'Notification',
        content: content,
        related_booking_id: relatedBookingId,
        is_read: false,
      });

      if (error) {
        console.error(
          "NotificationService: Error creating notification:",
          error.message || JSON.stringify(error, null, 2),
        );
      }
    } catch (error) {
      console.error(
        "NotificationService: Unexpected error creating notification:",
        error instanceof Error ? error.message : JSON.stringify(error, null, 2),
      );
    }
  }
}

export const notificationService = new NotificationService();