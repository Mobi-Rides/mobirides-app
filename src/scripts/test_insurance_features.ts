
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// --- Configuration & Setup ---
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
let envConfig: any = {};
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
    console.error('❌ Missing Supabase Config. Ensure .env.local exists with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred) or VITE_SUPABASE_ANON_KEY.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Test Functions ---

async function testUnderwritingLogic() {
    console.log('\n🔍 Testing Underwriting Logic (Simulation)...');

    // 1. Get a test user
    const { data: users } = await supabase.from('profiles').select('id, full_name, is_verified').limit(1);
    const user = users?.[0] || {
        id: 'dummy-user-id',
        full_name: 'Dummy User',
        is_verified: false
    };
    console.log(`   User: ${user.full_name} (${user.id}) | Verified: ${user.is_verified} ${!users?.length ? '(MOCKED)' : ''}`);

    // 2. Get a test car
    const { data: cars } = await supabase.from('cars').select('id, brand, model, value, year').limit(1);
    const car = cars?.[0] || {
        id: 'dummy-car-id',
        brand: 'TestBrand',
        model: 'TestModel',
        value: 1200000, // High value to trigger logic
        year: 2023
    };
    console.log(`   Car: ${car.year} ${car.brand} ${car.model} | Value: ${car.value} ${!cars?.length ? '(MOCKED)' : ''}`);

    // 3. Run Logic (Replicated from UnderwriterService)
    let baseScore = 100;
    const riskFactors = [];

    // Check age (simulated)
    // const age = 24; if (age < 25) baseScore -= 20;

    // Check verification
    if (!user.is_verified) {
        baseScore -= 30; // UPDATED LOGIC: Deduct score
        riskFactors.push('Unverified Driver');
    }

    // Check car value
    if (car.value > 1000000) {
        baseScore -= 20;
        riskFactors.push('High Value Vehicle');
    }

    // Determine Premium Load
    let premiumLoad = 1.0;
    let riskTier = 'standard';

    if (baseScore >= 90) {
        riskTier = 'low_risk';
        premiumLoad = 0.9; // 10% discount
    } else if (baseScore >= 70) {
        riskTier = 'standard';
        premiumLoad = 1.0;
    } else if (baseScore >= 50) {
        riskTier = 'moderate_risk';
        premiumLoad = 1.25; // 25% loading
    } else {
        riskTier = 'high_risk';
        premiumLoad = 1.5; // 50% loading
    }

    console.log(`   Result: Score=${baseScore}, Tier=${riskTier}, Load=${premiumLoad}x`);
    console.log(`   Factors: ${riskFactors.join(', ') || 'None'}`);
    console.log('✅ Underwriting Logic check complete.');
}

async function testAutomationExpirations() {
    console.log('\n🔍 Testing Policy Expiration Automation...');

    // 1. Create a dummy expired policy
    const { data: users } = await supabase.from('profiles').select('id').limit(1);
    const { data: cars } = await supabase.from('cars').select('id').limit(1);
    const { data: pkgs } = await supabase.from('insurance_packages').select('id').limit(1);

    if (!users?.length || !cars?.length || !pkgs?.length) {
        console.log('⚠️ Cannot setup test data (missing relations).');
        return;
    }

    const testPolicy = {
        renter_id: users[0].id,
        car_id: cars[0].id,
        package_id: pkgs[0].id,
        start_date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        end_date: new Date(Date.now() - 86400000).toISOString(),   // Yesterday (Expired)
        status: 'active', // Should be expired
        policy_number: `TEST-EXP-${Date.now()}`,
        booking_id: (await supabase.from('bookings').select('id').limit(1)).data?.[0]?.id // Attach to random booking
    };

    if (!testPolicy.booking_id) {
        console.log('⚠️ No booking found for FK.');
        return;
    }

    const { data: pol, error: createError } = await supabase
        .from('insurance_policies')
        .insert(testPolicy)
        .select()
        .single();

    if (createError) {
        console.error('   ❌ Failed to create test policy:', createError.message);
        return;
    }
    console.log(`   Created test active (but old) policy: ${pol.id}`);

    // 2. Run Automation Logic (Replicated)
    const { data: expiredPolicies, error: findError } = await supabase
        .from('insurance_policies')
        .select('id')
        .eq('status', 'active')
        .lt('end_date', new Date().toISOString());

    if (findError) {
        console.error('   ❌ Query failed:', findError.message);
    } else {
        console.log(`   Found ${expiredPolicies.length} policies to expire.`);
        const foundOurPolicy = expiredPolicies.find((p: any) => p.id === pol.id);

        if (foundOurPolicy) {
            console.log('   ✅ Correctly identified our test policy as expired.');

            // Cleanup
            await supabase.from('insurance_policies').delete().eq('id', pol.id);
            console.log('   Cleanup: Deleted test policy.');
        } else {
            console.error('   ❌ Failed to find our test policy! Check query logic.');
        }
    }
}

async function testSmallClaimsAutoProcess() {
    console.log('\n🔍 Testing Small Claims Automation...');

    // 1. Create dummy small claim
    // Need a booking first for FK
    const { data: bookings } = await supabase.from('bookings').select('id, renter_id, car_id').limit(1);
    const { data: policies } = await supabase.from('insurance_policies').select('id').limit(1);

    if (!bookings?.length || !policies?.length) {
        console.log('⚠️ No bookings/policies for test.');
        return;
    }

    const testClaim = {
        booking_id: bookings[0].id,
        policy_id: policies[0].id,
        renter_id: bookings[0].renter_id,
        status: 'submitted',
        estimated_damage_cost: 400, // < 500 threshold
        incident_date: new Date().toISOString(),
        incident_type: 'minor_damage', // VALID ENUM VALUE
        incident_description: 'Test claim for automation',
        damage_description: 'Minor test scratch',
        claim_number: `CLM-TEST-${Date.now()}` // 
    };

    const { data: claim, error: createError } = await supabase
        .from('insurance_claims')
        .insert(testClaim)
        .select()
        .single();

    if (createError) {
        console.error('   ❌ Failed to create test claim:', createError.message);
        return;
    }
    console.log(`   Created test small claim: ${claim.id} (Cost: P${claim.estimated_damage_cost})`);

    // 2. Run Automation Logic
    const { data: eligibleClaims } = await supabase
        .from('insurance_claims')
        .select('*')
        .eq('status', 'submitted')
        .lt('estimated_damage_cost', 500);

    const match = eligibleClaims?.find((c: any) => c.id === claim.id);

    if (match) {
        console.log('   ✅ Correctly identified claim for auto-approval.');

        // Clean up
        await supabase.from('insurance_claims').delete().eq('id', claim.id);
        console.log('   Cleanup: Deleted test claim.');
    } else {
        console.error('   ❌ Failed to identify claim for auto-approval.');
    }
}

// --- Main Execution ---
async function runTests() {
    console.log('🚀 Starting Insurance Features Verification...');

    await testUnderwritingLogic();
    await testAutomationExpirations();
    await testSmallClaimsAutoProcess();

    console.log('\n🏁 Verification Complete.');
    process.exit(0);
}

runTests();
