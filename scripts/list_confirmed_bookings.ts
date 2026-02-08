
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

async function listConfirmedBookings() {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      renter:profiles!renter_id (
        id,
        full_name
      ),
      cars (
        brand,
        model
      )
    `)
    .eq('status', 'confirmed');

  if (error) {
    console.error('Error fetching bookings:', error);
    return;
  }

  console.log('Confirmed Bookings:');
  bookings.forEach(b => {
    console.log(`- ID: ${b.id}`);
    console.log(`  Renter: ${b.renter?.full_name} (${b.renter?.id})`);
    console.log(`  Car: ${b.cars?.brand} ${b.cars?.model}`);
    console.log(`  Start: ${b.start_date}`);
    console.log('---');
  });
}

listConfirmedBookings();
