
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function approveBooking() {
  const bookingId = '99ec6bc6-b9d2-4b54-9271-bb3c10ac5c7c'; // The new pending booking

  console.log(`Approving booking ${bookingId}...`);

  const { data, error } = await supabase
    .from('bookings')
    .update({ 
        status: 'awaiting_payment',
        // Set payment deadline to 24 hours from now
        payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error("Failed to approve booking:", error);
  } else {
    console.log("✅ Booking approved successfully. Status is now:", data.status);
  }
}

approveBooking();
