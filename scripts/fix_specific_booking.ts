
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBookingStatus(bookingId: string) {
  console.log(`Updating booking ${bookingId} to 'awaiting_payment'...`);
  
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'awaiting_payment' })
    .eq('id', bookingId)
    .select();

  if (error) {
    console.error('Error updating booking:', error);
  } else {
    console.log('Booking updated successfully:', data);
  }
}

// Booking ID for Arnold Bathoen starting 2026-02-05
const targetBookingId = '13411361-fbc1-4d4d-bc2c-dd7f32c1f794';

fixBookingStatus(targetBookingId);
