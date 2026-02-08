
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyResults() {
  const BOOKING_ID = 'fa973aac-45e2-40a6-9778-7356048b26c4';
  const HOST_ID = 'a2a57a7d-9979-48e8-a078-35742a507e64'; // Arnold

  console.log('📊 VERIFYING E2E SCENARIO RESULTS\n');

  // 1. Check Booking Status
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, payment_status, total_price, start_date, end_date')
    .eq('id', BOOKING_ID)
    .single();

  console.log('1️⃣  BOOKING STATUS');
  console.log(`   ID: ${booking.id}`);
  console.log(`   Status: ${booking.status.toUpperCase()} (Expected: COMPLETED)`);
  console.log(`   Payment: ${booking.payment_status.toUpperCase()} (Expected: PAID)`);
  console.log(`   Total Price: BWP ${booking.total_price}`);
  console.log('---------------------------------------------------');

  // 2. Check Host Wallet
  const { data: wallet } = await supabase
    .from('host_wallets')
    .select('*')
    .eq('host_id', HOST_ID)
    .single();

  console.log('2️⃣  HOST WALLET');
  console.log(`   ID: ${wallet.id}`);
  console.log(`   Current Balance: BWP ${wallet.balance}`);
  console.log(`   Pending Balance: BWP ${wallet.pending_balance}`);
  console.log('---------------------------------------------------');

  // 3. Check Wallet Transactions for this Booking
  const { data: txns } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('booking_id', BOOKING_ID)
    .order('created_at', { ascending: true });

  console.log('3️⃣  WALLET TRANSACTIONS (History)');
  if (txns && txns.length > 0) {
    txns.forEach((t, i) => {
        console.log(`   [${i+1}] ${t.transaction_type.toUpperCase()}`);
        console.log(`       Amount: BWP ${t.amount}`);
        console.log(`       Description: ${t.description}`);
        console.log(`       Balance: ${t.balance_before} -> ${t.balance_after}`);
        console.log(`       Date: ${new Date(t.created_at).toLocaleString()}`);
    });
  } else {
      console.log("   ❌ No transactions found.");
  }
  console.log('---------------------------------------------------');
  
  // 4. Check Payment Transaction (The Money In)
  const { data: payTxn } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('booking_id', BOOKING_ID)
    .single();
    
  console.log('4️⃣  PAYMENT RECORD (Money In)');
  if (payTxn) {
      console.log(`   Status: ${payTxn.status}`);
      console.log(`   Amount Paid: BWP ${payTxn.amount}`);
      console.log(`   Host Earnings: BWP ${payTxn.host_earnings}`);
      console.log(`   Platform Comm: BWP ${payTxn.platform_commission}`);
  } else {
      console.log("   ❌ No payment transaction found.");
  }
}

verifyResults();
