
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const HOST_ID = 'a2a57a7d-9979-48e8-a078-35742a507e64'; // Arnold

async function testFinancialFeatures() {
  console.log('🧪 TESTING NEW FINANCIAL FEATURES\n');

  // --- PART 1: HOST ACTIONS ---
  console.log('👤 HOST ACTIONS (Arnold)');
  
  // 1. Add Payout Method
  console.log('   1. Checking Payout Method...');
  
  let method;
  const { data: existingMethods } = await supabase
    .from('payout_details')
    .select('*')
    .eq('host_id', HOST_ID)
    .limit(1);

  if (existingMethods && existingMethods.length > 0) {
      method = existingMethods[0];
      console.log(`   ✅ Using Existing Method: ${method.display_name}`);
  } else {
      console.log('   ➕ Adding New Method (FNB Bank)...');
      const payoutDetails = {
        bank_name: 'FNB Botswana',
        account_number: '62254789632',
        account_holder: 'Arnold Bathoen',
        branch_code: '280167'
      };

      const { data: newMethod, error: methodError } = await supabase
        .from('payout_details')
        .insert({
          host_id: HOST_ID,
          payout_method: 'bank_transfer',
          details_encrypted: payoutDetails,
          display_name: 'FNB Botswana - ***9632',
          is_default: true
        })
        .select()
        .single();

      if (methodError) {
          console.error('   ❌ Failed to add payout method:', methodError);
          return; 
      }
      method = newMethod;
      console.log(`   ✅ Payout Method Added: ${method.display_name}`);
  }

  // 2. Request Withdrawal
  const WITHDRAW_AMOUNT = 500;
  console.log(`   2. Requesting Withdrawal of BWP ${WITHDRAW_AMOUNT}...`);
  
  const { error: withdrawError } = await supabase.rpc('process_withdrawal_request', {
    p_host_id: HOST_ID,
    p_amount: WITHDRAW_AMOUNT,
    p_payout_method: method.payout_method,
    p_payout_details: method.details_encrypted
  });

  if (withdrawError) {
      console.error('   ❌ Withdrawal Failed:', withdrawError);
  } else {
      console.log('   ✅ Withdrawal Requested Successfully.');
  }
  console.log('---------------------------------------------------\n');


  // --- PART 2: ADMIN VISIBILITY ---
  console.log('👮 ADMIN DASHBOARD VISIBILITY');

  // 1. Check Withdrawals Tab
  console.log('   1. Checking Withdrawal Requests Table...');
  const { data: withdrawals, error: fetchError } = await supabase
    .from('withdrawal_requests')
    .select('*') // Removed join for debugging
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError) {
      console.error("      Fetch Error:", fetchError);
  } else if (withdrawals && withdrawals.length > 0) {
      const w = withdrawals[0];
      console.log(`      Found Request: BWP ${w.amount} (ID: ${w.id})`);
      console.log(`      Status: ${w.status}`);
  } else {
      console.log('      ❌ No withdrawals found (Unexpected).');
  }

  // 2. Check Payments Tab
  console.log('   2. Checking Inbound Payments Table...');
  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('id, amount, status, user_id')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (payments && payments.length > 0) {
      console.log(`      Found Recent Payment: BWP ${payments[0].amount} (${payments[0].status})`);
  } else {
      console.log('      ❌ No payments found.');
  }

  // 3. Check Insurance Tab
  console.log('   3. Checking Pending Insurance Remittance...');
  const { data: policies } = await supabase
    .from('insurance_policies')
    .select('*')
    .eq('payu_remittance_status', 'pending');

  const totalPending = policies?.reduce((sum, p) => sum + (p.payu_amount || 0), 0) || 0;
  console.log(`      Pending Remittance Count: ${policies?.length}`);
  console.log(`      Total To Remit: BWP ${totalPending.toFixed(2)}`);
  
  console.log('\n✅ TEST COMPLETE');
}

testFinancialFeatures();
