
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHotfixPhase1() {
  console.log('🧪 Starting Phase 1 Hotfix Tests (MOB-201 to MOB-206)...');

  // --- Setup: Get a valid car and renter ---
  console.log('\n--- Setup ---');
  // Need to find a valid car first
  const { data: cars, error: carError } = await supabase
    .from('cars')
    .select('id, owner_id')
    .limit(1);

  if (carError || !cars || cars.length === 0) {
    console.error('❌ Setup Failed: Could not find a car.', carError);
    return;
  }
  const car = cars[0];
  console.log(`✅ Found Car: ${car.id} (Owner: ${car.owner_id})`);

  // Use owner as renter for simplicity (bypass RLS with service role)
  const renterId = car.owner_id; 
  console.log(`✅ Using Renter: ${renterId}`);

  // --- Test 1: MOB-201 (destination_type column) ---
  console.log('\n--- Test 1: MOB-201 (destination_type) ---');
  // Generate a random UUID for booking ID manually since we are inserting directly
  const testBookingId = crypto.randomUUID();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      id: testBookingId,
      car_id: car.id,
      renter_id: renterId,
      start_date: today,
      end_date: tomorrow,
      total_price: 100,
      status: 'confirmed',
      destination_type: 'out_of_zone' // Testing the new column
    })
    .select()
    .single();

  if (bookingError) {
    console.error('❌ MOB-201 Failed: Could not create booking with destination_type.', bookingError);
    return;
  } else {
    if (booking.destination_type === 'out_of_zone') {
      console.log('✅ MOB-201 Passed: Booking created with destination_type="out_of_zone".');
    } else {
      console.error(`❌ MOB-201 Failed: destination_type mismatch. Expected "out_of_zone", got "${booking.destination_type}".`);
    }
  }

  // --- Test 2: MOB-204 (Duplicate Handover Session Prevention) ---
  console.log('\n--- Test 2: MOB-204 (Duplicate Handover Guard) ---');
  
  // Create first session
  const { data: session1, error: session1Error } = await supabase
    .from('handover_sessions')
    .insert({
      booking_id: testBookingId,
      handover_type: 'pickup',
      host_id: car.owner_id,
      renter_id: renterId,
      handover_completed: false
    })
    .select()
    .single();

  if (session1Error) {
    console.error('❌ MOB-204 Setup Failed: Could not create first session.', session1Error);
  } else {
    console.log('✅ Created first handover session (pickup).');

    // Try to create duplicate session
    const { data: session2, error: session2Error } = await supabase
      .from('handover_sessions')
      .insert({
        booking_id: testBookingId,
        handover_type: 'pickup', // Same type
        host_id: car.owner_id,
        renter_id: renterId,
        handover_completed: false // Still active
      })
      .select()
      .single();

    // Check specifically for unique constraint violation (Postgres error 23505)
    if (session2Error && session2Error.code === '23505') { 
      console.log('✅ MOB-204 Passed: Duplicate session creation blocked by unique index (Code 23505).');
    } else {
      console.error('❌ MOB-204 Failed: Duplicate session was NOT blocked or wrong error.', session2Error ? session2Error : 'No error returned');
    }
  }

  // --- Test 3: MOB-202 (Status Transition Logic - Simulation) ---
  console.log('\n--- Test 3: MOB-202/205 (Status Transition & Query) ---');
  
  // Simulate the frontend logic: Update booking status to 'in_progress'
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'in_progress' })
    .eq('id', testBookingId);

  if (updateError) {
    console.error('❌ MOB-202 Simulation Failed: Could not update status to in_progress.', updateError);
  } else {
    console.log('✅ Updated booking status to "in_progress".');

    // Verify we can query it (MOB-205 logic)
    const { data: activeBookings, error: queryError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', testBookingId)
      .in('status', ['confirmed', 'in_progress']);

    if (queryError) {
      console.error('❌ MOB-205 Query Failed.', queryError);
    } else if (activeBookings && activeBookings.length > 0) {
      console.log(`✅ MOB-205 Passed: Successfully queried booking with status "${activeBookings[0].status}".`);
    } else {
      console.error('❌ MOB-205 Failed: Booking not found with status "in_progress".');
    }
  }

  // --- Cleanup ---
  console.log('\n--- Cleanup ---');
  // Delete handover sessions first (foreign key constraint)
  await supabase.from('handover_sessions').delete().eq('booking_id', testBookingId);
  // Delete booking
  await supabase.from('bookings').delete().eq('id', testBookingId);
  console.log('✅ Cleanup complete.');
}

testHotfixPhase1();
