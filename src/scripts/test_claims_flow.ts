
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
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

async function runTest() {
    console.log('🚀 Starting Full Claim Flow Verification...');

    // 1. Get User
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
    if (uError || !users.length) throw new Error('No users found');
    const user = users[0];
    console.log(`👤 Identifying User: ${user.email}`);

    // 2. Create Booking & Policy (Setup)
    console.log('📦 Setting up Booking & Policy...');
    const { data: cars } = await supabase.from('cars').select('id, price_per_day').limit(1);
    const car = cars?.[0];
    if (!car) throw new Error('No cars found');

    const startDate = new Date();
    startDate.setHours(10, 0, 0, 0); // 10:00 AM
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(14, 0, 0, 0);   // 02:00 PM (different time to safely pass check)

    // Create Booking
    const { data: booking, error: bError } = await supabase.from('bookings').insert({
        renter_id: user.id,
        car_id: car.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '14:00',
        total_price: car.price_per_day * 3,
        status: 'confirmed'
    }).select().single();
    if (bError) throw new Error(`Booking Failed: ${bError.message}`);

    // Create Policy
    const { data: pkg } = await supabase.from('insurance_packages').select('id, premium_percentage, coverage_cap, excess_amount').eq('name', 'standard').single();
    if (!pkg) throw new Error('Package not found');

    const { data: policy, error: pError } = await supabase.from('insurance_policies').insert({
        booking_id: booking.id,
        renter_id: user.id,
        package_id: pkg.id,
        car_id: car.id,
        policy_number: `VERIFY-${Date.now()}`,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(), // explicit time included
        rental_amount_per_day: car.price_per_day,
        premium_per_day: car.price_per_day * pkg.premium_percentage,
        number_of_days: 3,
        total_premium: (car.price_per_day * pkg.premium_percentage) * 3,
        status: 'active',
        coverage_cap: pkg.coverage_cap,
        excess_amount: pkg.excess_amount,
        terms_accepted_at: new Date().toISOString()
    }).select().single();
    if (pError) throw new Error(`Policy Failed: ${pError.message}`);
    console.log(`✅ Policy Created: ${policy.policy_number}`);

    // 3. Test Upload (The Request)
    console.log('📤 Testing File Upload (Simulating UI Upload)...');

    // Create specific PDF-like buffer
    const pdfBuffer = Buffer.from('%PDF-1.4\n%...', 'utf-8');
    const fileName = `claims/${policy.id}/evidence-${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('insurance-claims')
        .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
        });

    if (uploadError) {
        console.error('❌ Upload Failed:', uploadError);
        throw uploadError;
    }
    console.log(`✅ Upload Successful: ${uploadData.path}`);

    // 4. Submit Claim
    console.log('📝 Submitting Claim...');
    const { data: claim, error: cError } = await supabase.from('insurance_claims').insert({
        policy_id: policy.id,
        booking_id: booking.id,
        renter_id: user.id,
        claim_number: `CLM-TEST-${Date.now()}`,
        incident_date: new Date().toISOString(),
        incident_type: 'collision',
        incident_description: 'Automated Test Collision',
        damage_description: 'Bumper damage',
        location: 'Test City',
        estimated_damage_cost: 1500.00,
        evidence_urls: [uploadData.path],
        status: 'submitted'
    }).select().single();

    if (cError) throw new Error(`Claim Submission Failed: ${cError.message}`);
    console.log(`✅ Claim Submitted Successfully: ${claim.claim_number}`);

    // Cleanup
    console.log('🧹 Cleanup...');
    await supabase.from('insurance_claims').delete().eq('id', claim.id);
    await supabase.storage.from('insurance-claims').remove([fileName]);
    await supabase.from('insurance_policies').delete().eq('id', policy.id);
    await supabase.from('bookings').delete().eq('id', booking.id);
    console.log('✨ Verification Complete!');
}

runTest().catch(e => {
    console.error('❌ Verification Failed:', e);
    process.exit(1);
});
