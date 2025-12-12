
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EMAIL = 'boikhums@gmail.com';
const PASSWORD = 'Khumalo691';

async function checkVerifications() {
  console.log('--- Checking User Verifications ---');
  
  // 1. Sign In
  const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (signInError) {
    console.error('Login failed:', signInError.message);
    return;
  }
  
  const userId = session.user.id;
  console.log(`Logged in as: ${EMAIL} (${userId})`);

  // 2. Check user_verifications count visible to this user
  console.log('\n--- Querying user_verifications as Admin ---');
  const { data: verifications, error: verifyError, count } = await supabase
    .from('user_verifications')
    .select('*', { count: 'exact' });

  if (verifyError) {
    console.error('Error fetching verifications:', verifyError);
  } else {
    console.log(`Total visible verifications: ${count}`);
    console.log('Sample IDs:', verifications.map(v => v.id).slice(0, 5));
  }

  // 3. Introspect Policies (if possible via rpc, otherwise we guess)
  // We can't easily introspect via client, but we can check if the count matches expectations.
}

checkVerifications();
