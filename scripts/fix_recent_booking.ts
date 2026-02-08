
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetBooking() {
  const bookingId = '026db951-e5d7-4d00-83ef-8b7bde056cba'; // ID from debug output

  console.log(`Resetting booking ${bookingId} to 'awaiting_payment'...`);

  const { data, error } = await supabase
    .from('bookings')
    .update({ 
        status: 'awaiting_payment',
        payment_status: 'unpaid' // Ensure it's explicitly unpaid
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error("Failed to reset booking:", error);
  } else {
    console.log("✅ Booking reset successfully:", data);
  }
}

resetBooking();
