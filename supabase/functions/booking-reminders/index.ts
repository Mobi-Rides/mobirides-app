import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const twoHoursFromNow = new Date(now);
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
    
    const thirtyMinutesFromNow = new Date(now);
    thirtyMinutesFromNow.setMinutes(thirtyMinutesFromNow.getMinutes() + 30);

    console.log('Processing booking reminders for:', now.toISOString());

    // Get confirmed bookings starting tomorrow (24h reminder)
    const { data: tomorrowBookings } = await supabaseClient
      .from('bookings')
      .select(`
        id,
        start_date,
        start_time,
        renter_id,
        cars (
          id,
          brand,
          model,
          owner_id
        )
      `)
      .eq('status', 'confirmed')
      .eq('start_date', tomorrow.toISOString().split('T')[0])
      .eq('preparation_reminder_sent', false);

    // Get confirmed bookings starting today for 2h and 30min reminders
    const { data: todayBookings } = await supabaseClient
      .from('bookings')
      .select(`
        id,
        start_date,
        start_time,
        renter_id,
        cars (
          id,
          brand,
          model,
          owner_id
        )
      `)
      .eq('status', 'confirmed')
      .eq('start_date', now.toISOString().split('T')[0]);

    let processedCount = 0;

    // Process 24-hour reminders
    if (tomorrowBookings) {
      for (const booking of tomorrowBookings) {
        const carTitle = `${booking.cars[0]?.brand} ${booking.cars[0]?.model}`;
        
        // Notification for renter
        await supabaseClient.from('notifications').insert({
          user_id: booking.renter_id,
          type: 'booking_reminder',
          content: `Your rental of ${carTitle} starts tomorrow at ${booking.start_time || '09:00'}. Please prepare for pickup!`,
          related_booking_id: booking.id,
          related_car_id: booking.cars[0]?.id
        });

        // Notification for host
        await supabaseClient.from('notifications').insert({
          user_id: booking.cars[0]?.owner_id,
          type: 'booking_reminder',
          content: `Your ${carTitle} rental starts tomorrow at ${booking.start_time || '09:00'}. Please prepare for handover!`,
          related_booking_id: booking.id,
          related_car_id: booking.cars[0]?.id
        });

        // Mark reminder as sent
        await supabaseClient
          .from('bookings')
          .update({ preparation_reminder_sent: true })
          .eq('id', booking.id);
        
        processedCount++;
      }
    }

    // Process 2-hour and 30-minute reminders for today's bookings
    if (todayBookings) {
      for (const booking of todayBookings) {
        const bookingStartTime = new Date(`${booking.start_date}T${booking.start_time || '09:00'}`);
        const timeDiff = bookingStartTime.getTime() - now.getTime();
        const hoursUntilStart = timeDiff / (1000 * 60 * 60);
        const minutesUntilStart = timeDiff / (1000 * 60);

        const carTitle = `${booking.cars[0]?.brand} ${booking.cars[0]?.model}`;

        // 2-hour reminder
        if (hoursUntilStart <= 2.1 && hoursUntilStart >= 1.9) {
          // Notification for renter
          await supabaseClient.from('notifications').insert({
            user_id: booking.renter_id,
            type: 'booking_reminder',
            content: `Your rental of ${carTitle} starts in 2 hours! Time to head to pickup location.`,
            related_booking_id: booking.id,
            related_car_id: booking.cars[0]?.id
          });

          // Notification for host
          await supabaseClient.from('notifications').insert({
            user_id: booking.cars[0]?.owner_id,
            type: 'booking_reminder',
            content: `Your ${carTitle} handover is in 2 hours! Please ensure the car is ready.`,
            related_booking_id: booking.id,
            related_car_id: booking.cars[0]?.id
          });
          
          processedCount++;
        }

        // 30-minute reminder
        if (minutesUntilStart <= 35 && minutesUntilStart >= 25) {
          // Notification for renter
          await supabaseClient.from('notifications').insert({
            user_id: booking.renter_id,
            type: 'booking_reminder',
            content: `Your rental of ${carTitle} starts in 30 minutes! Final preparations time.`,
            related_booking_id: booking.id,
            related_car_id: booking.cars[0]?.id
          });

          // Notification for host
          await supabaseClient.from('notifications').insert({
            user_id: booking.cars[0]?.owner_id,
            type: 'booking_reminder',
            content: `Your ${carTitle} handover is in 30 minutes! Please be ready at pickup location.`,
            related_booking_id: booking.id,
            related_car_id: booking.cars[0]?.id
          });
          
          processedCount++;
        }
      }
    }

    console.log(`Processed ${processedCount} booking reminders`);

    return new Response(
      JSON.stringify({ 
        message: `Successfully processed ${processedCount} booking reminders`,
        timestamp: now.toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing booking reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});