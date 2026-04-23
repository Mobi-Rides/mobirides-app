// Test script for interactive handover system
// Run with: node test-interactive-handover.js

const fs = require('fs');

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
  console.log(message, data || '');
  fs.appendFileSync('test-output.log', logMessage);
}

// Clear previous log
fs.writeFileSync('test-output.log', '🚀 Test Started\n');

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

log('Checking environment variables...');
if (!process.env.VITE_SUPABASE_URL) log('❌ Missing VITE_SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) log('❌ Missing SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'MISSING_URL',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'MISSING_KEY'
);

async function testInteractiveHandover() {
  log('🚀 Starting Interactive Handover Test...');

  try {
    // Step 0: Fetch a valid booking to use for testing
    log('0️⃣ Fetching a valid booking...');
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        renter_id,
        car:cars (
          owner_id
        )
      `)
      .limit(1);

    if (bookingError) throw new Error(`Failed to fetch booking: ${bookingError.message}`);
    
    let testBookingId, testRenterId, testHostId;

    if (!bookingData || bookingData.length === 0) {
       log('⚠️ No existing bookings found. Attempting to create test data...');
       
       // Try to find a car
       const { data: cars, error: carError } = await supabase
         .from('cars')
         .select('id, owner_id')
         .limit(1);
         
       if (carError) throw new Error(`Failed to fetch cars: ${carError.message}`);
       if (!cars || cars.length === 0) throw new Error('No cars found. Cannot create test booking.');
       
       const car = cars[0];
       log('✅ Found car:', car.id);
       
       // Create a test renter
       const email = `test-renter-${Date.now()}@example.com`;
       const password = 'password123';
       
       log('Creating test renter:', email);
       const { data: authData, error: authError } = await supabase.auth.signUp({
         email,
         password
       });
       
       if (authError) throw new Error(`Failed to create renter: ${authError.message}`);
       const renterId = authData.user.id;
       log('✅ Created test renter:', renterId);
       
       // Create booking
       const startDate = new Date();
       startDate.setDate(startDate.getDate() + 1); // tomorrow
       const endDate = new Date(startDate);
       endDate.setDate(endDate.getDate() + 3); // 3 days later
       
       const bookingPayload = {
         car_id: car.id,
         renter_id: renterId,
         start_date: startDate.toISOString(),
         end_date: endDate.toISOString(),
         total_price: 100,
         status: 'confirmed' // assuming status field exists
       };
       
       log('Creating test booking...');
       const { data: newBooking, error: createError } = await supabase
         .from('bookings')
         .insert(bookingPayload)
         .select()
         .single();
         
       if (createError) throw new Error(`Failed to create booking: ${createError.message}`);
       
       testBookingId = newBooking.id;
       testRenterId = renterId;
       testHostId = car.owner_id;
       log('✅ Created test booking:', testBookingId);
       
     } else {
      const booking = bookingData[0];
      testBookingId = booking.id;
      testRenterId = booking.renter_id;
      // Handle array or object response from join
      const carData = Array.isArray(booking.car) ? booking.car[0] : booking.car;
      
      if (!carData) throw new Error('Booking found but no car data linked');
      
      testHostId = carData.owner_id;
    }

    log('✅ Using existing booking:', { 
      bookingId: testBookingId, 
      hostId: testHostId, 
      renterId: testRenterId 
    });

    // Step 1: Create interactive handover session
    log('1️⃣ Creating interactive handover session...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('handover_sessions')
      .insert({
        booking_id: testBookingId,
        host_id: testHostId,
        renter_id: testRenterId,
        handover_type: 'pickup',
        is_interactive: true,
        current_step_order: 1,
        waiting_for: 'host'
      })
      .select()
      .single();

    if (sessionError) throw sessionError;
    log('✅ Session created:', sessionData.id);

    // Step 2: Create step completions for all 14 steps
    log('\n2️⃣ Creating step completion records...');
    const steps = [
      { step_name: 'location_selection', step_order: 1, step_owner: 'host' },
      { step_name: 'location_confirmation', step_order: 2, step_owner: 'renter' },
      { step_name: 'arrival_confirmation', step_order: 3, step_owner: 'both' },
      { step_name: 'vehicle_inspection', step_order: 4, step_owner: 'host' },
      { step_name: 'damage_documentation', step_order: 5, step_owner: 'both' },
      { step_name: 'identity_verification', step_order: 6, step_owner: 'host' },
      { step_name: 'fuel_mileage_check', step_order: 7, step_owner: 'host' },
      { step_name: 'key_transfer', step_order: 8, step_owner: 'both' },
      { step_name: 'host_signature', step_order: 9, step_owner: 'host' },
      { step_name: 'renter_signature', step_order: 10, step_owner: 'renter' },
      { step_name: 'insurance_verification', step_order: 11, step_owner: 'host' },
      { step_name: 'payment_confirmation', step_order: 12, step_owner: 'both' },
      { step_name: 'final_checklist', step_order: 13, step_owner: 'both' },
      { step_name: 'handover_completion', step_order: 14, step_owner: 'both' }
    ];

    const stepCompletions = steps.map(step => ({
      handover_session_id: sessionData.id,
      ...step,
      is_completed: false,
      host_completed: false,
      renter_completed: false
    }));

    const { error: stepsError } = await supabase
      .from('handover_step_completion')
      .insert(stepCompletions);

    if (stepsError) throw stepsError;
    log('✅ Step completions created for all 14 steps');

    // Step 3: Test progress calculation
    log('\n3️⃣ Testing progress calculation...');
    const { data: progressData, error: progressError } = await supabase
      .rpc('calculate_handover_progress', {
        handover_session_id_param: sessionData.id
      });

    if (progressError) throw progressError;
    log('📊 Initial progress:', progressData);

    // Step 4: Test step advancement (host completes location selection)
    log('\n4️⃣ Testing host step completion...');
    const { data: advanceData, error: advanceError } = await supabase
      .rpc('advance_handover_step', {
        p_session_id: sessionData.id,
        p_completed_step_name: 'location_selection',
        p_user_id: testHostId,
        p_user_role: 'host',
        p_completion_data: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Test Street, New York, NY',
          type: 'custom_pin'
        }
      });

    if (advanceError) throw advanceError;
    log('✅ Host step completed:', advanceData);

    // Step 5: Check updated progress
    log('\n5️⃣ Checking updated progress...');
    const { data: updatedProgress } = await supabase
      .rpc('calculate_handover_progress', {
        handover_session_id_param: sessionData.id
      });

    log('📈 Updated progress:', updatedProgress);

    // Step 6: Test renter step completion
    log('\n6️⃣ Testing renter step completion...');
    const { data: renterAdvance } = await supabase
      .rpc('advance_handover_step', {
        p_session_id: sessionData.id,
        p_completed_step_name: 'location_confirmation',
        p_user_id: testRenterId,
        p_user_role: 'renter',
        p_completion_data: { confirmed: true }
      });

    log('✅ Renter step completed:', renterAdvance);

    // Step 7: Verify session state
    log('\n7️⃣ Verifying final session state...');
    const { data: finalSession } = await supabase
      .from('handover_sessions')
      .select(`
        *,
        handover_step_completion(*)
      `)
      .eq('id', sessionData.id)
      .single();

    log('🔍 Final session state:');
    log('- Current step:', finalSession.current_step_order);
    log('- Waiting for:', finalSession.waiting_for);
    log('- Location:', finalSession.handover_location_name);
    log('- Interactive:', finalSession.is_interactive);

    // Step 8: Test error cases
    log('\n8️⃣ Testing error cases...');
    
    // Try to complete step as wrong role
    const { data: roleData, error: roleError } = await supabase
      .rpc('advance_handover_step', {
        p_session_id: sessionData.id,
        p_completed_step_name: 'vehicle_inspection',
        p_user_id: testRenterId,
        p_user_role: 'renter'
      });

    // The function returns success: true even if no update happens (silent failure for wrong role), 
    // or success: false if validation fails.
    // Let's check if the step was actually completed by fetching it
    const { data: stepCheck } = await supabase
      .from('handover_step_completion')
      .select('is_completed')
      .eq('handover_session_id', sessionData.id)
      .eq('step_name', 'vehicle_inspection')
      .single();

    if (stepCheck && !stepCheck.is_completed) {
       log('✅ Role enforcement worked: Step not completed by wrong role');
    } else {
       log('❌ Role enforcement failed: Step was completed by wrong role or step not found');
    }

    // Try to complete non-existent session
    const { data: sessionErrorData, error: nonExistentSessionError } = await supabase
      .rpc('advance_handover_step', {
        p_session_id: '00000000-0000-0000-0000-000000000000',
        p_completed_step_name: 'test',
        p_user_id: testHostId,
        p_user_role: 'host'
      });
    
    if (sessionErrorData && sessionErrorData.success === false) {
       log('✅ Session validation worked:', sessionErrorData.error);
    } else {
       log('❌ Session validation failed:', nonExistentSessionError?.message || 'No error returned');
    }

    log('\n🎉 Interactive handover test completed successfully!');

  } catch (error) {
    log('❌ Test failed:', error.message);
    log(error);
  }
}

// Run the test
testInteractiveHandover();
