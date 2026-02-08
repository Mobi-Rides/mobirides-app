
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTriggers() {
  console.log('🔍 Checking Triggers on Bookings table...');
  
  // We can't query information_schema directly via JS client easily unless we wrap it in RPC
  // So we'll try to just perform the action and observe.
  
  // 1. Get a valid car
  const { data: cars } = await supabase.from('cars').select('id').limit(1);
  const carId = cars?.[0]?.id;
  if (!carId) { console.error('No cars found'); return; }

  // 1. Create Pending Booking (Starting TODAY)
  console.log('1. Creating Pending Booking (Today)...');
  const { data: booking, error: createError } = await supabase
    .from('bookings')
    .insert({
      car_id: carId,
      renter_id: 'a2a57a7d-9979-48e8-a078-35742a507e64', 
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString(),
      total_price: 100,
      status: 'pending'
    })
    .select()
    .single();

  if (createError) {
      console.error("Create Error:", createError);
      return;
  }
  console.log(`   Booking Created: ${booking.id} (Status: ${booking.status})`);

  // 2. Approve Booking (Set to awaiting_payment)
  console.log('2. Approving Booking (Setting status = awaiting_payment)...');
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'awaiting_payment' })
    .eq('id', booking.id);
    
  if (updateError) console.error("Update Error:", updateError);

  // 3. Check Status Immediately
  const { data: check1 } = await supabase.from('bookings').select('status').eq('id', booking.id).single();
  console.log(`   Immediate Status: ${check1.status}`);

  // 4. Wait 2 seconds and check again
  await new Promise(r => setTimeout(r, 2000));
  const { data: check2 } = await supabase.from('bookings').select('status').eq('id', booking.id).single();
  console.log(`   Status after 2s: ${check2.status}`);
  
  if (check2.status === 'confirmed') {
      console.log('🚨 ALERT: Something auto-confirmed the booking!');
  } else if (check2.status === 'awaiting_payment') {
      console.log('✅ Status remained awaiting_payment. The backend logic seems fine.');
  }
}

checkTriggers();
