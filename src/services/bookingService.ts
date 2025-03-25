
import { supabase } from "@/integrations/supabase/client";

export const handleExpiredBookings = async () => {
  console.log("Checking for expired booking requests...");
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data, error } = await supabase
      .from("booking_requests")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("created_at", twentyFourHoursAgo.toISOString())
      .select();

    if (error) {
      console.error("Error updating expired bookings:", error);
      return { success: false, error };
    }

    if (data && data.length > 0) {
      console.log(`${data.length} expired booking requests updated`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in handleExpiredBookings:", error);
    return { success: false, error };
  }
};
