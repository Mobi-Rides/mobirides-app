
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

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

async function main() {
    console.log('--- CREATING TEST POLICIES FOR ALL USERS ---');

    // 1. Get All Users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    // 2. Get Premium Package
    const { data: pkg } = await supabase.from('insurance_packages').select('*').eq('name', 'premium').single();
    if (!pkg) throw new Error('Premium package not found');

    // 3. Get a Car
    const { data: cars } = await supabase.from('cars').select('*').limit(1);
    const car = cars?.[0];
    if (!car) throw new Error('No cars found');

    for (const user of users) {
        console.log(`Processing User: ${user.email} (${user.id})`);

        // Check if they already have an active policy
        const { data: existing } = await supabase.from('insurance_policies')
            .select('*')
            .eq('renter_id', user.id)
            .eq('status', 'active');

        if (existing && existing.length > 0) {
            console.log(`- User already has ${existing.length} active policies. Skipping.`);
            continue;
        }

        // Create Booking first
        const days = 3;
        const totalAmount = car.price_per_day * days;

        const { data: booking, error: bError } = await supabase.from('bookings').insert({
            user_id: user.id,
            car_id: car.id,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + days * 86400000).toISOString(),
            total_price: totalAmount,
            status: 'confirmed'
        }).select().single();

        if (bError) {
            console.error(`- Failed to create booking: ${bError.message}`);
            continue;
        }

        // Create Policy
        const premiumAmount = totalAmount * pkg.premium_percentage;
        const policyNumber = `TEST-POL-${Date.now()}-${user.id.substring(0, 4)}`;

        const { error: pError } = await supabase.from('insurance_policies').insert({
            booking_id: booking.id,
            renter_id: user.id,
            package_id: pkg.id,
            policy_number: policyNumber,
            total_premium: premiumAmount,
            premium_per_day: premiumAmount / days,
            number_of_days: days,
            start_date: booking.start_date,
            end_date: booking.end_date,
            status: 'active',
            coverage_cap: pkg.coverage_cap,
            excess_amount: pkg.excess_amount,
            terms_version: '1.0',
            terms_accepted_at: new Date().toISOString()
        });

        if (pError) {
            console.error(`- Failed to create policy: ${pError.message}`);
        } else {
            console.log(`+ Created Policy: ${policyNumber}`);
        }
    }
}

main().catch(console.error);
