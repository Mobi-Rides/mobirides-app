import { createClient } from "npm:@supabase/supabase-js@2";

// Define the Supabase client with proper typing
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Check for expired booking requests and change their status to 'expired'
async function handleExpiredBookings() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all pending bookings where the start date is in the past
    const { data: expiredBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .lt('start_date', today.toISOString());

    if (error) throw error;
    
    if (expiredBookings && expiredBookings.length > 0) {
      // Update status to expired for expired bookings
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'expired' })
        .in('id', expiredBookings.map(booking => booking.id));
      
      if (updateError) throw updateError;
      
      console.log(`Updated ${expiredBookings.length} expired booking requests`);
    }
    
    return { success: true, count: expiredBookings?.length || 0 };
  } catch (error) {
    console.error('Error handling expired bookings:', error);
    return { success: false, error };
  }
}

// Create notifications for car owners about bookings the day before they start
async function createBookingReminders() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    // Get all confirmed bookings starting tomorrow
    const { data: upcomingBookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        car:cars (
          brand,
          model,
          owner_id
        )
      `)
      .eq('status', 'confirmed')
      .gte('start_date', tomorrow.toISOString())
      .lt('start_date', dayAfter.toISOString());
    
    if (error) throw error;
    
    if (upcomingBookings && upcomingBookings.length > 0) {
      // Create notifications for each booking
      for (const booking of upcomingBookings) {
        // Check if a reminder has already been sent (to avoid duplicates if the function runs multiple times)
        const { data: existingNotifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('related_booking_id', booking.id)
          .eq('type', 'booking_reminder');
          
        if (existingNotifications && existingNotifications.length === 0) {
          // Notify the car owner
          await supabase.from('notifications').insert({
            user_id: booking.car.owner_id,
            type: 'booking_reminder',
            content: `Reminder: A booking for your ${booking.car.brand} ${booking.car.model} starts tomorrow.`,
            related_car_id: booking.car_id,
            related_booking_id: booking.id
          });
          
          console.log(`Created reminder for booking ${booking.id}`);
        }
      }
      
      console.log(`Created booking reminders for ${upcomingBookings.length} bookings`);
    }
    
    return { success: true, count: upcomingBookings?.length || 0 };
  } catch (error) {
    console.error('Error creating booking reminders:', error);
    return { success: false, error };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Running booking cleanup functions...');
    
    // Handle expired bookings
    const expiredResult = await handleExpiredBookings();
    console.log('Expired bookings result:', expiredResult);
    
    // Create booking reminders
    const remindersResult = await createBookingReminders();
    console.log('Booking reminders result:', remindersResult);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        expiredBookings: expiredResult, 
        bookingReminders: remindersResult 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
      console.error('Error in booking-cleanup function:', error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
