
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

async function testPaymentArchitecture() {
  console.log('🚀 Starting Payment Architecture Verification...');

  // 1. Setup Data
  // Find a car and its owner (Host)
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('id, owner_id, price_per_day')
    .limit(1)
    .single();

  if (carError || !car) {
    console.error('❌ Failed to find a car:', carError);
    return;
  }

  // Find a Renter (someone who is NOT the owner)
  const { data: renter, error: renterError } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', car.owner_id)
    .limit(1)
    .single();

  if (renterError || !renter) {
    console.error('❌ Failed to find a renter:', renterError);
    return;
  }

  console.log(`ℹ️ Car ID: ${car.id}, Host: ${car.owner_id}`);
  console.log(`ℹ️ Renter: ${renter.id}`);

  // 2. Create Booking
  // Scenario: Rental = 200, Insurance = 50, Total = 250
  const rentalPrice = 200;
  const insurancePremium = 50;
  const totalPrice = rentalPrice + insurancePremium;

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      car_id: car.id,
      renter_id: renter.id,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString(),
      total_price: totalPrice,
      base_rental_price: rentalPrice,
      insurance_premium: insurancePremium,
      status: 'pending', // Initial status
      payment_status: 'awaiting_payment',
      payment_deadline: new Date(Date.now() + 86400000).toISOString()
    })
    .select()
    .single();

  if (bookingError) {
    console.error('❌ Failed to create booking:', bookingError);
    return;
  }
  console.log(`✅ Created Booking: ${booking.id} (Total: ${booking.total_price}, Insurance: ${booking.insurance_premium})`);

  // 3. Create Pending Transaction
  const { data: txn, error: txnError } = await supabase
    .from('payment_transactions')
    .insert({
      booking_id: booking.id,
      user_id: renter.id,
      amount: totalPrice,
      currency: 'BWP',
      payment_method: 'card',
      payment_provider: 'mock_provider',
      status: 'pending',
      provider_reference: `TEST_${Date.now()}`
    })
    .select()
    .single();

  if (txnError) {
    console.error('❌ Failed to create transaction:', txnError);
    return;
  }
  console.log(`✅ Created Pending Transaction: ${txn.id}`);

  // 3.5 Wait for replication/consistency
  console.log('⏳ Waiting 2 seconds for DB consistency...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Invoke Payment Webhook (The Core Test)
  console.log('🔄 Invoking payment-webhook...');
  
  const { data: webhookResult, error: webhookError } = await supabase.functions.invoke('payment-webhook', {
    body: {
      transaction_id: txn.id,
      status: 'success',
      provider_ref: `PROV_${Date.now()}`
    }
  });

  if (webhookError) {
    console.error('❌ Webhook invocation failed:', webhookError);
    if (webhookError instanceof Error && 'context' in webhookError) {
        try {
            const errBody = await (webhookError as any).context.json();
            console.error('Error Body:', JSON.stringify(errBody, null, 2));
        } catch {}
    }
    return;
  }
  console.log('✅ Webhook Response:', webhookResult);

  // 5. Verification
  console.log('\n--- VERIFICATION ---');

  // 5.1 Verify Transaction Splits
  const { data: updatedTxn } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('id', txn.id)
    .single();

  const expectedCommission = rentalPrice * 0.15; // 200 * 0.15 = 30
  const expectedEarnings = rentalPrice * 0.85;   // 200 * 0.85 = 170

  if (updatedTxn.status === 'completed') {
    console.log('✅ Transaction Status: Completed');
  } else {
    console.error(`❌ Transaction Status: ${updatedTxn.status}`);
  }

  if (updatedTxn.platform_commission === expectedCommission) {
    console.log(`✅ Platform Commission: ${updatedTxn.platform_commission} (Expected: ${expectedCommission})`);
  } else {
    console.error(`❌ Platform Commission: ${updatedTxn.platform_commission} (Expected: ${expectedCommission})`);
  }

  if (updatedTxn.host_earnings === expectedEarnings) {
    console.log(`✅ Host Earnings: ${updatedTxn.host_earnings} (Expected: ${expectedEarnings})`);
  } else {
    console.error(`❌ Host Earnings: ${updatedTxn.host_earnings} (Expected: ${expectedEarnings})`);
  }

  // 5.2 Verify Booking Status
  const { data: updatedBooking } = await supabase
    .from('bookings')
    .select('status, payment_status')
    .eq('id', booking.id)
    .single();

  if (updatedBooking.status === 'confirmed' && updatedBooking.payment_status === 'paid') {
    console.log('✅ Booking Status: Confirmed & Paid');
  } else {
    console.error(`❌ Booking Status: ${updatedBooking.status}/${updatedBooking.payment_status}`);
  }

  // 5.3 Verify Host Wallet Credit
  const { data: walletTxn } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('booking_id', booking.id)
    .eq('transaction_type', 'rental_earnings_pending') // Corrected column name
    .single();

  if (walletTxn) {
    if (walletTxn.amount === expectedEarnings) {
      console.log(`✅ Wallet Transaction Found: +${walletTxn.amount} (Pending)`);
    } else {
      console.error(`❌ Wallet Transaction Amount: ${walletTxn.amount} (Expected: ${expectedEarnings})`);
    }
  } else {
    console.error('❌ No Wallet Transaction found for this booking!');
  }

  // Cleanup
  // await supabase.from('bookings').delete().eq('id', booking.id);
}

testPaymentArchitecture();
