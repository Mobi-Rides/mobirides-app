
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

// Create a Supabase client with the SERVICE ROLE key to act as admin
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProcessWithdrawal() {
  console.log('🚀 Starting process-withdrawal test...');

  // 1. Setup: Create a test user (host) and a test wallet if needed, or find an existing one
  // For simplicity, we'll pick an existing host with a wallet
  const { data: wallet, error: walletError } = await supabase
    .from('host_wallets')
    .select('id, host_id, balance')
    .limit(1)
    .single();

  if (walletError || !wallet) {
    console.error('❌ Failed to find a host wallet for testing:', walletError);
    return;
  }
  
  console.log(`ℹ️ Using Wallet ID: ${wallet.id} (Host: ${wallet.host_id}, Balance: ${wallet.balance})`);

  // 2. Create a fake "pending" withdrawal request directly in DB
  // Use amount > 200 to satisfy DB check constraint
  const withdrawalAmount = 250.00; 
  const { data: request, error: reqError } = await supabase
    .from('withdrawal_requests')
    .insert({
      host_id: wallet.host_id,
      wallet_id: wallet.id,
      amount: withdrawalAmount,
      status: 'pending',
      payout_method: 'bank_transfer', // Corrected column name
      payout_details: { bank: 'Test Bank', account: '123456789' } // Corrected column name
    })
    .select()
    .single();

  if (reqError) {
    console.error('❌ Failed to create test withdrawal request:', reqError);
    return;
  }
  
  console.log(`✅ Created test withdrawal request: ${request.id}`);

  // 3. Call the Edge Function to APPROVE it
  console.log('🔄 Invoking process-withdrawal (APPROVE)...');
  
  const { data: functionData, error: functionError } = await supabase.functions.invoke('process-withdrawal', {
    body: {
      withdrawal_id: request.id,
      action: 'approve',
      notes: 'Automated test approval'
    }
  });

  if (functionError) {
    console.error('❌ Edge function invocation failed:', functionError);
    // Print more details if available
    if (functionError instanceof Error) {
        console.error('Error details:', functionError.message);
        // Try to read the context response body if it exists
        if ('context' in functionError && (functionError as any).context instanceof Response) {
            try {
                const errorBody = await (functionError as any).context.json();
                console.error('🔻 RESPONSE BODY:', JSON.stringify(errorBody, null, 2));
            } catch (e) {
                console.error('Could not read response body:', e);
            }
        }
    }
  } else {
    console.log('✅ Edge function response:', functionData);
  }

  // 4. Verify the result in DB
  const { data: verifyRequest } = await supabase
    .from('withdrawal_requests')
    .select('status, provider_reference')
    .eq('id', request.id)
    .single();

  if (verifyRequest?.status === 'completed') {
    console.log(`🎉 SUCCESS: Withdrawal status is 'completed'. Ref: ${verifyRequest.provider_reference}`);
  } else {
    console.error(`❌ FAILURE: Withdrawal status is ${verifyRequest?.status}`);
  }
  
  // 5. Check for notification
  const { data: notification } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', wallet.host_id)
    .eq('type', 'payout_completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
   if (notification) {
       console.log('✅ Notification verified:', notification.description);
   } else {
       console.warn('⚠️ Notification not found (might be async or RLS issue reading back)');
   }

  // Cleanup (Optional: delete the test request to keep DB clean)
  // await supabase.from('withdrawal_requests').delete().eq('id', request.id);
}

testProcessWithdrawal();
