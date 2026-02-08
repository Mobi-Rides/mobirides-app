
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const HOST_EMAIL = 'bathoensescob@gmail.com';
const RENTER_EMAIL = `test_renter_${Date.now()}@example.com`;
const RENTER_PASSWORD = 'password123';

async function runEndToEndScenario() {
  console.log('🚀 Starting End-to-End Rental Scenario...');

  // 1. Get Host User
  console.log(`\n🔍 Finding Host for Arnold's Cars`);
  
  // Use known Arnold ID or search by profile
  const ARNOLD_PROFILE_ID = 'a2a57a7d-9979-48e8-a078-35742a507e64';
  const hostId = ARNOLD_PROFILE_ID;
  
  console.log(`✅ Using Host ID: ${hostId}`);

  // 2. Find a Car owned by Host
  const { data: cars, error: carError } = await supabase
    .from('cars')
    .select('*')
    .eq('owner_id', hostId)
    .ilike('model', '%Land Cruiser%') // Prefer the Land Cruiser
    .limit(1);

  if (carError || !cars || cars.length === 0) {
    console.error('❌ Host has no cars listed!');
    return;
  }
  const car = cars[0];
  console.log(`✅ Found Car: ${car.brand} ${car.model} (ID: ${car.id}) - Price: ${car.price_per_day}`);

  // 3. Create Renter Account
  console.log(`\n👤 Creating Renter: ${RENTER_EMAIL}`);
  const { data: renterAuth, error: createError } = await supabase.auth.admin.createUser({
    email: RENTER_EMAIL,
    password: RENTER_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Test Renter' }
  });

  if (createError) throw createError;
  const renterId = renterAuth.user.id;
  console.log(`✅ Created Renter ID: ${renterId}`);

  // Ensure profile exists (triggers usually handle this, but let's wait/verify)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. Create Booking Request
  console.log('\n📅 Creating Booking Request...');
  const startDate = new Date();
  const endDate = new Date(Date.now() + 86400000); // Tomorrow
  const rentalPrice = car.price_per_day; // 1 day
  const insurance = 50; // Mock insurance
  const total = rentalPrice + insurance;

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      car_id: car.id,
      renter_id: renterId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      total_price: total,
      base_rental_price: rentalPrice,
      insurance_premium: insurance,
      status: 'pending',
      payment_status: 'unpaid'
    })
    .select()
    .single();

  if (bookingError) throw bookingError;
  console.log(`✅ Booking Created: ${booking.id} (Status: ${booking.status})`);

  // 5. Host Approves Booking
  console.log('\n👍 Simulating Host Approval...');
  const { error: approveError } = await supabase
    .from('bookings')
    .update({ 
      status: 'awaiting_payment',
      payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', booking.id);

  if (approveError) throw approveError;
  console.log('✅ Booking Approved. Status: awaiting_payment');

  // 6. Renter Pays (Simulated)
  console.log('\n💳 Simulating Renter Payment...');
  
  // Calculate earnings
  const hostEarnings = rentalPrice * 0.85;
  const platformCommission = rentalPrice * 0.15;

  // 1. Create Payment Transaction first
  const { data: txn, error: txnError } = await supabase
    .from('payment_transactions')
    .insert({
      booking_id: booking.id,
      user_id: renterId,
      amount: total,
      currency: 'BWP',
      payment_method: 'card',
      payment_provider: 'mock_provider',
      status: 'completed',
      host_earnings: hostEarnings,
      platform_commission: platformCommission,
      commission_rate: 0.15,
      provider_reference: `SIM_TXN_${Date.now()}`
    })
    .select()
    .single();

  if (txnError) {
      console.error("Transaction Creation Failed:", txnError);
      throw txnError;
  }
  console.log(`✅ Transaction Created: ${txn.id}`);

  // 2. Update booking with transaction ID
  const { error: payError } = await supabase
    .from('bookings')
    .update({ 
      status: 'confirmed',
      payment_status: 'paid',
      payment_transaction_id: txn.id // LINK THE TRANSACTION
    })
    .eq('id', booking.id);

  if (payError) throw payError;
  
  // Also credit host wallet (Mocking the webhook logic)
  await supabase.rpc('credit_pending_earnings', {
    p_booking_id: booking.id,
    p_host_earnings: hostEarnings,
    p_platform_commission: platformCommission
  });
  
  console.log('✅ Payment Complete. Booking Confirmed.');

  // 7. Pickup Handover
  console.log('\n🔑 Initiating Pickup Handover...');
  
  // Create handover session
  // Note: Schema has 'handover_type' instead of 'type', and does NOT have 'status', 'current_step', 'total_steps'
  const { data: pickupSession, error: pickupError } = await supabase
    .from('handover_sessions')
    .insert({
      booking_id: booking.id,
      handover_type: 'pickup', // Correct column name
      host_id: hostId,
      renter_id: renterId,
      host_ready: true,
      renter_ready: true
    })
    .select()
    .single();

  if (pickupError) {
      console.error("Pickup Session Creation Failed:", pickupError);
      throw pickupError;
  }
  console.log(`✅ Pickup Session Created: ${pickupSession.id}`);

  // Simulate completing steps
  console.log('... Completing pickup steps (photos, fuel, mileage)...');
  await supabase
    .from('handover_sessions')
    .update({ 
      handover_completed: true,
      // completed_at column exists? No, schema doesn't show 'completed_at', just updated_at.
      // Wait, schema check shows 'handover_completed' boolean.
    })
    .eq('id', pickupSession.id);
    
  console.log('✅ Pickup Handover Completed.');

  // 8. Return Handover
  console.log('\n🏁 Initiating Return Handover...');
  
  const { data: returnSession, error: returnError } = await supabase
    .from('handover_sessions')
    .insert({
      booking_id: booking.id,
      handover_type: 'return', // Correct column name
      host_id: hostId,
      renter_id: renterId,
      host_ready: true,
      renter_ready: true
    })
    .select()
    .single();

  if (returnError) {
      console.error("Return Session Creation Failed:", returnError);
      throw returnError;
  }
  console.log(`✅ Return Session Created: ${returnSession.id}`);

  // Simulate completing steps
  console.log('... Completing return steps...');
  await supabase
    .from('handover_sessions')
    .update({ 
      handover_completed: true
    })
    .eq('id', returnSession.id);

  // 9. Complete Booking & Release Earnings
  console.log('\n💰 Completing Booking & Releasing Earnings...');
  
  // Update booking to completed
  await supabase
    .from('bookings')
    .update({ 
      status: 'completed',
      actual_end_date: new Date().toISOString()
    })
    .eq('id', booking.id);

  // Release earnings
  try {
      const { error: releaseError } = await supabase.rpc('release_pending_earnings', {
        p_booking_id: booking.id
      });
      if (releaseError) console.error('Earnings Release Error:', releaseError);
      else console.log('✅ Earnings Released to Host Wallet.');
  } catch (e) {
      console.log('Note: Earnings release might fail if wallet trigger logic is strict, but booking is completed.');
  }

  // 10. Simulate Withdrawal
  console.log('\n🏦 Simulating Host Withdrawal...');
  
  // Get wallet ID
  const { data: wallet } = await supabase.from('host_wallets').select('id, balance').eq('host_id', hostId).single();
  console.log(`   Available Balance: BWP ${wallet.balance}`);

  // Create Payout Method if not exists (using upsert logic or just create new one)
  const payoutDetails = {
    bank_name: 'E2E Bank',
    account_number: '123456789',
    account_holder: 'Arnold E2E',
    branch_code: '000000'
  };

  // Check existing method
  let payoutMethodId;
  const { data: existingMethod } = await supabase.from('payout_details').select('id, payout_method, details_encrypted').eq('host_id', hostId).limit(1);
  
  if (existingMethod && existingMethod.length > 0) {
      payoutMethodId = existingMethod[0].id;
  } else {
      const { data: newMethod } = await supabase.from('payout_details').insert({
          host_id: hostId,
          payout_method: 'bank_transfer',
          details_encrypted: payoutDetails,
          display_name: 'E2E Bank',
          is_default: true
      }).select().single();
      payoutMethodId = newMethod.id;
  }

  // Request Withdrawal (Try 200 BWP)
  const withdrawAmount = 200;
  if (wallet.balance >= withdrawAmount) {
      const { data: withdrawalId, error: withdrawError } = await supabase.rpc('process_withdrawal_request', {
          p_host_id: hostId,
          p_amount: withdrawAmount,
          p_payout_method: 'bank_transfer',
          p_payout_details: payoutDetails
      });

      if (withdrawError) console.error("Withdrawal Failed:", withdrawError);
      else console.log(`✅ Withdrawal Requested: BWP ${withdrawAmount} (ID: ${withdrawalId})`);
  } else {
      console.log("   ⚠️ Insufficient balance for withdrawal test (Need 200).");
  }

  console.log('\n🎉 FULL PROCESS COMPLETE!');
  console.log(`Renter Email: ${RENTER_EMAIL}`);
  console.log(`Renter Password: ${RENTER_PASSWORD}`);
}

runEndToEndScenario();
