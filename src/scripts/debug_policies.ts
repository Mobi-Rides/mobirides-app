
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to load env from .env.local or .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

let envConfig = {};
if (fs.existsSync(envLocalPath)) {
    envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
} else if (fs.existsSync(envPath)) {
    envConfig = dotenv.parse(fs.readFileSync(envPath));
}

for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
    console.log('--- USERS ---');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) console.error(usersError);
    else {
        users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}`));
    }

    console.log('\n--- INSURANCE POLICIES ---');
    const { data: policies, error: policiesError } = await supabase.from('insurance_policies').select('*');
    if (policiesError) console.error(policiesError);
    else {
        if (policies.length === 0) console.log('No policies found.');
        policies.forEach(p => console.log(`Policy ID: ${p.id}, Renter: ${p.renter_id}, Status: ${p.status}, Number: ${p.policy_number}`));
    }
}

debug();
