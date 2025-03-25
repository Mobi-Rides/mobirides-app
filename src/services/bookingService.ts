export const handleExpiredBookings = async () => {
  try {
    console.log("Checking for expired booking requests...");
    
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());
    
    if (error) {
      console.error("Error fetching expired bookings:", error);
      return;
    }
    
    console.log(`Found ${bookings.length} expired booking requests`);
    
    // Update each expired booking
    for (const booking of bookings) {
      // Using 'cancelled' instead of 'expired' since 'expired' is not a valid status
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", booking.id);
      
      if (updateError) {
        console.error(`Error updating booking ${booking.id}:`, updateError);
      }
    }
    
    console.log(`Successfully processed ${bookings.length} expired bookings`);
  } catch (error) {
    console.error("Error in handleExpiredBookings:", error);
  }
};
