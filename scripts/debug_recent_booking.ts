
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecentBooking() {
  console.log("Checking most recent booking...");

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      payment_status,
      renter_id,
      total_price,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching booking:", error);
    return;
  }

  console.log("Found Booking:", booking);
  
  // Check if there is a payment transaction linked
  const { data: txn } = await supabase
    .from('payment_transactions')
    .select('id, status, amount')
    .eq('booking_id', booking.id)
    .maybeSingle(); // Use maybeSingle to avoid error if none exists

  console.log("Linked Transaction:", txn || "None");
}

checkRecentBooking();
