const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envLocalPath = path.resolve(__dirname, '.env.local');
const envPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Checking policies for profiles table...');

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkPolicies() {
    const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'profiles');

    if (error) {
        // pg_policies might not be accessible via postgrest public API depending on setup
        // Try RPC approach or just simple profile fetch with anon user
        console.log('Cannot access system tables directly via Client. Trying to fetch a profile as anon...');

        // Create anon client
        const anonSupabase = createClient(supabaseUrl, supabaseKey);
        // Try to randomly fetch a profile
        const { data: profiles, error: profileError } = await anonSupabase
            .from('profiles')
            .select('id, full_name')
            .limit(1);

        if (profileError) {
            console.error('FAILED to fetch profiles as anon:', profileError);
        } else {
            console.log('SUCCESS: Fetched profiles as anon (RLS is permissive or disabled):', profiles);
            if (profiles.length === 0) console.log('WARNING: No profiles found, but no error.');
        }
    } else {
        console.log('Policies found:', data);
    }
}

checkPolicies();
