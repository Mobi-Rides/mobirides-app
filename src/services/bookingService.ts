import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookingNotificationType } from "@/types/booking";

// Add expiration check for pending bookings older than 24 hours
export const handleExpiredBookings = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();

    // Find pending bookings created more than 24 hours ago
    const { data: expiredBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id, car_id, renter_id")
      .eq("status", "pending")
      .lt("created_at", yesterdayStr);

    if (fetchError) {
      console.error("Error fetching expired bookings:", fetchError);
      return;
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      return;
    }

    console.log(`Found ${expiredBookings.length} expired booking requests`);

    // Update each expired booking
    for (const booking of expiredBookings) {
      // Update booking status
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "expired" })
        .eq("id", booking.id);

      if (updateError) {
        console.error(`Error updating booking ${booking.id}:`, updateError);
        continue;
      }

      // Fetch car details for notification
      const { data: car } = await supabase
        .from("cars")
        .select("brand, model, owner_id")
        .eq("id", booking.car_id)
        .single();

      if (!car) continue;

      // Create notification for renter
      await supabase.from("notifications").insert({
        user_id: booking.renter_id,
        type: "booking_cancelled", // Using existing type instead of BOOKING_REMINDER
        content: `Your booking request for ${car.brand} ${car.model} has expired.`,
        related_car_id: booking.car_id,
        related_booking_id: booking.id,
      });

      // Create notification for host
      await supabase.from("notifications").insert({
        user_id: car.owner_id,
        type: "booking_cancelled", // Using existing type instead of BOOKING_REMINDER
        content: `A booking request for your ${car.brand} ${car.model} has expired.`,
        related_car_id: booking.car_id,
        related_booking_id: booking.id,
      });
    }

    console.log(`Successfully processed ${expiredBookings.length} expired bookings`);
  } catch (error) {
    console.error("Error handling expired bookings:", error);
  }
};
