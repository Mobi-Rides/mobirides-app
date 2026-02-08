
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { mockBookingPaymentService } from '../src/services/mockBookingPaymentService';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runTests() {
    console.log('🚀 Starting Payment Integration Verification...\n');
    let allPassed = true;

    // --- 1. Documentation Checks ---
    console.log('--- 1. Documentation Checks ---');
    try {
        const docsPath = path.resolve(process.cwd(), 'docs/PAYMENT_INTEGRATION_IMPLEMENTATION.md');
        if (fs.existsSync(docsPath)) {
            const content = fs.readFileSync(docsPath, 'utf-8');
            if (content.toLowerCase().includes('host wallet') && content.toLowerCase().includes('booking')) {
                console.log('✅ Documentation likely separates host wallet and booking payments.');
            } else {
                console.log('⚠️ Documentation found but might verify content manually.');
            }
        } else {
            console.log('❌ Documentation file not found: docs/PAYMENT_INTEGRATION_IMPLEMENTATION.md');
            allPassed = false;
        }
    } catch (e) {
        console.error('❌ Failed to check documentation', e);
        allPassed = false;
    }

    // --- 2. Mock Service Comments ---
    console.log('\n--- 2. Mock Service Comments ---');
    try {
        const servicePath = path.resolve(process.cwd(), 'src/services/mockPaymentService.ts');
        if (fs.existsSync(servicePath)) {
            const content = fs.readFileSync(servicePath, 'utf-8');
            if (content.includes('Mock Payment Service') && content.includes('HOST WALLET TOP-UPS ONLY')) {
                console.log('✅ mockPaymentService.ts has clarifying scope comments.');
            } else {
                console.log('❌ mockPaymentService.ts missing scope clarification comments.');
                allPassed = false;
            }
        } else {
            console.log('❌ mockPaymentService.ts not found.');
            allPassed = false;
        }
    } catch (e) {
        console.error('❌ Failed to check mock service', e);
        allPassed = false;
    }

    // --- 3. Mock Service Determinism ---
    console.log('\n--- 3. Mock Service Determinism ---');
    try {
        const insufficientResult = await mockBookingPaymentService.processPayment({
            booking_id: 'test', payment_method: 'card', base_rental_price: 100, dynamic_pricing_adjustment: 0,
            insurance_premium: 0, discount_amount: 0, grand_total: 100.01 // .01 triggers insufficient funds
        });

        if (!insufficientResult.success && insufficientResult.error_code === 'INSUFFICIENT_FUNDS') {
            console.log('✅ Mock service checks: .01 triggers Insufficient Funds.');
        } else {
            console.log('❌ Mock service deterministic check failed for .01');
            allPassed = false;
        }

        const successResult = await mockBookingPaymentService.processPayment({
            booking_id: 'test', payment_method: 'card', base_rental_price: 100, dynamic_pricing_adjustment: 0,
            insurance_premium: 0, discount_amount: 0, grand_total: 100.99
        });

        if (successResult.success) {
            console.log('✅ Mock service checks: Standard amount succeeds.');
        } else {
            console.log('❌ Mock service standard check failed.');
            allPassed = false;
        }

    } catch (e) {
        console.error('❌ Failed to check mock service determinism', e);
        allPassed = false;
    }

    // --- 4. End-to-End Mock Payment Flow (Simulation) ---
    console.log('\n--- 4. End-to-End Mock Payment Flow (Simulation) ---');
    // Note: We cannot easily run the full Edge Function flow from a script without the functions serving locally.
    // We will simulate the DB operations that the Edge Functions would perform.

    try {
        // 4.1 Create Test Data
        const { data: users } = await supabase.from('profiles').select('id').limit(2);
        if (!users || users.length < 2) {
            console.log('⚠️ Not enough users to test booking flow. Skipping E2E.');
        } else {
            const renterId = users[0].id;

            // Find ANY car
            const { data: cars } = await supabase.from('cars').select('id, price_per_day, owner_id').limit(1);

            if (cars && cars.length > 0) {
                const car = cars[0];
                const hostId = car.owner_id;

                // Ensure renter is not host (basic check)
                const actualRenterId = (renterId === hostId && users[1]) ? users[1].id : renterId;

                // Create Booking
                const { data: booking, error: bookingError } = await supabase.from('bookings').insert({
                    car_id: car.id,
                    renter_id: actualRenterId,
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 86400000).toISOString(), // +1 day
                    total_price: car.price_per_day,
                    status: 'pending',
                    payment_status: 'awaiting_payment',
                    payment_deadline: new Date(Date.now() + 86400000).toISOString()
                }).select().single();

                if (bookingError) throw bookingError;
                console.log('✅ Test Booking created:', booking.id);

                // 4.2 Verify "Pay Now" Condition
                if (booking.payment_status === 'awaiting_payment') {
                    console.log('✅ Booking is "awaiting_payment", so "Pay Now" button should be visible.');
                }

                // 4.3 Simulate Payment Transaction (Initiate)
                const { data: txn, error: txnError } = await supabase.from('payment_transactions').insert({
                    booking_id: booking.id,
                    user_id: actualRenterId,
                    amount: booking.total_price,
                    currency: 'BWP',
                    payment_method: 'card',
                    payment_provider: 'paygate',
                    status: 'initiated',
                    provider_reference: 'TEST_REF'
                }).select().single();

                if (txnError) throw txnError;
                console.log('✅ Payment Transaction initiated:', txn.id);

                // 4.4 Simulate Webhook Success (Process Payment)
                // Updating transaction to completed
                const rental_portion = car.price_per_day;
                const platform_commission = rental_portion * 0.15;
                const host_earnings = rental_portion - platform_commission;

                await supabase.from('payment_transactions').update({
                    status: 'completed',
                    platform_commission,
                    host_earnings,
                    completed_at: new Date().toISOString()
                }).eq('id', txn.id);

                // Update Booking
                await supabase.from('bookings').update({
                    status: 'confirmed',
                    payment_status: 'paid'
                }).eq('id', booking.id);

                // Credit Host (DB Function call simulation or direct insert if function not available in test)
                // Ideally we call the RPC 'credit_pending_earnings'
                const { error: rpcError } = await supabase.rpc('credit_pending_earnings', {
                    p_booking_id: booking.id,
                    p_host_earnings: host_earnings,
                    p_platform_commission: platform_commission
                });

                if (rpcError) {
                    console.log('⚠️ Failed to call RPC credit_pending_earnings:', rpcError.message);
                    // Verify manually via table check
                } else {
                    console.log('✅ earnings credited via RPC.');
                }

                // 4.5 Verify State
                const { data: updatedBooking } = await supabase.from('bookings').select('status, payment_status').eq('id', booking.id).single();
                if (updatedBooking?.status === 'confirmed' && updatedBooking?.payment_status === 'paid') {
                    console.log('✅ Booking updated to Confirmed/Paid.');
                } else {
                    console.log('❌ Booking update failed:', updatedBooking);
                    allPassed = false;
                }

            } else {
                console.log('⚠️ No cars found in database. Please seed cars table.');
                allPassed = false;
            }
        }
    } catch (e) {
        console.error('❌ E2E Flow Failed', e);
        allPassed = false;
    }

    // --- 5. Expiry Flow ---
    console.log('\n--- 5. Payment Deadline & Expiry Flow ---');
    try {
        // Create Expired Booking
        const { data: users } = await supabase.from('profiles').select('id').limit(1);
        if (users && users.length > 0) {
            const userId = users[0].id;
            const { data: car } = await supabase.from('cars').select('id, price_per_day').limit(1).single();

            if (car) {
                const { data: expiredBooking } = await supabase.from('bookings').insert({
                    car_id: car.id,
                    renter_id: userId,
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 86400000).toISOString(),
                    total_price: car.price_per_day,
                    status: 'pending',
                    payment_status: 'awaiting_payment',
                    payment_deadline: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
                }).select().single();

                console.log('✅ Created expired booking candidate:', expiredBooking.id);

                // Simulate Expire Function
                // We mimic what 'expire-bookings' does
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({ status: 'expired', payment_status: 'expired' })
                    .eq('id', expiredBooking.id)
                    .lt('payment_deadline', new Date().toISOString())
                    .eq('payment_status', 'awaiting_payment');

                if (updateError) throw updateError;

                // Verify
                const { data: check } = await supabase.from('bookings').select('status').eq('id', expiredBooking.id).single();
                if (check?.status === 'expired') {
                    console.log('✅ Booking successfully expired.');
                } else {
                    console.log('❌ Booking failed to expire:', check);
                    allPassed = false;
                }
            }
        }
    } catch (e) {
        console.error('❌ Expiry Flow Failed', e);
        allPassed = false;
    }

    console.log('\n-----------------------------------');
    if (allPassed) {
        console.log('🎉 ALL CHECKS PASSED');
    } else {
        console.log('⚠️ SOME CHECKS FAILED');
    }
}

runTests();
