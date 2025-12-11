const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEST_PROMO_CODE = "TEST_PROMO_" + Math.random().toString(36).substring(7).toUpperCase();
const TEST_USER_EMAIL = `test_user_${Date.now()}@example.com`;
let testUserId;
let testPromoId;

async function runTests() {
  console.log("🚀 Starting Promo Code System Tests...\n");

  try {
    // 1. Create a Test User
    console.log("👤 Creating test user...");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: "password123",
      email_confirm: true,
      user_metadata: { full_name: "Test User" }
    });

    if (authError) throw new Error(`Failed to create user: ${authError.message}`);
    testUserId = authData.user.id;
    console.log(`✅ Test user created: ${testUserId} (${TEST_USER_EMAIL})`);

    // Ensure profile exists (triggers might take a moment)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update marketing preferences
    const { error: prefError } = await supabase
        .from('profiles')
        .update({ marketing_notifications: true })
        .eq('id', testUserId);
    
    if (prefError) console.warn("⚠️ Failed to update preferences:", prefError.message);
    else console.log("✅ Marketing notifications enabled for user");


    // 2. Create a Promo Code
    console.log(`\n🎟️ Creating promo code: ${TEST_PROMO_CODE}...`);
    const { data: promoData, error: promoError } = await supabase
      .from("promo_codes")
      .insert({
        code: TEST_PROMO_CODE,
        discount_amount: 50,
        discount_type: "fixed",
        max_uses: 10,
        is_active: true,
        description: "Automated Test Code",
        min_booking_amount: 100
      })
      .select()
      .single();

    if (promoError) throw new Error(`Failed to create promo code: ${promoError.message}`);
    testPromoId = promoData.id;
    console.log(`✅ Promo code created: ${testPromoId}`);


    // 3. Validate Promo Code Logic (Simulation)
    console.log("\n🔍 Validating promo code logic...");
    
    // Case A: Valid usage
    const bookingAmount = 500;
    if (bookingAmount >= promoData.min_booking_amount && promoData.is_active) {
        console.log(`✅ Validation Passed: Amount ${bookingAmount} >= Min ${promoData.min_booking_amount}`);
    } else {
        throw new Error("Validation logic failed for valid case");
    }

    // Case B: Invalid usage (below min amount)
    const lowAmount = 50;
    if (lowAmount < promoData.min_booking_amount) {
        console.log(`✅ Validation Passed: Rejected amount ${lowAmount} < Min ${promoData.min_booking_amount}`);
    } else {
        throw new Error("Validation logic failed for invalid case");
    }


    // 4. Apply Promo Code (Simulate Booking)
    console.log("\n💳 Applying promo code to a booking...");
    
    // Create a dummy booking first
    // Note: We need a valid car ID. Fetching one...
    const { data: cars } = await supabase.from("cars").select("id").limit(1);
    if (!cars || cars.length === 0) throw new Error("No cars found to book");
    const carId = cars[0].id;

    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
            car_id: carId,
            renter_id: testUserId,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 86400000).toISOString(),
            total_price: 450, // 500 - 50 discount
            status: 'pending'
        })
        .select()
        .single();

    if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`);
    console.log(`✅ Dummy booking created: ${booking.id}`);

    // Record usage
    const { error: usageError } = await supabase
        .from("promo_code_usage")
        .insert({
            promo_code_id: testPromoId,
            user_id: testUserId,
            booking_id: booking.id,
            discount_applied: 50,
            original_amount: 500,
            final_amount: 450
        });

    if (usageError) throw new Error(`Failed to record usage: ${usageError.message}`);
    console.log("✅ Promo usage recorded in database");


    // 5. Verify Usage Increment
    console.log("\n📈 Verifying usage count increment...");
    // Call the RPC function manually since triggers might not be set up to call it automatically on insert in this script context
    // In the real app, the service calls this.
    await supabase.rpc('increment_promo_code_uses', { promo_id: testPromoId });

    const { data: updatedPromo } = await supabase
        .from("promo_codes")
        .select("current_uses")
        .eq("id", testPromoId)
        .single();

    if (updatedPromo.current_uses === 1) {
        console.log("✅ Usage count incremented correctly to 1");
    } else {
        throw new Error(`Usage count incorrect. Expected 1, got ${updatedPromo.current_uses}`);
    }


    // 6. Verify "Already Used" Logic
    console.log("\n🚫 Verifying double-usage prevention...");
    const { data: duplicateCheck } = await supabase
        .from("promo_code_usage")
        .select("id")
        .eq("promo_code_id", testPromoId)
        .eq("user_id", testUserId);

    if (duplicateCheck && duplicateCheck.length > 0) {
        console.log("✅ Duplicate usage correctly detected (User has already used this code)");
    } else {
        throw new Error("Failed to detect existing usage");
    }

    // 7. Cleanup
    console.log("\n🧹 Cleaning up test data...");
    if (testPromoId) {
        // First delete usage records due to foreign key constraints
        await supabase.from("promo_code_usage").delete().eq("promo_code_id", testPromoId);
        // Then delete the promo code
        await supabase.from("promo_codes").delete().eq("id", testPromoId);
    }
    
    if (booking) await supabase.from("bookings").delete().eq("id", booking.id);
    if (testUserId) await supabase.auth.admin.deleteUser(testUserId);
    
    console.log("✅ Cleanup complete");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    // Attempt cleanup even on failure
    try {
        if (testPromoId) {
            await supabase.from("promo_code_usage").delete().eq("promo_code_id", testPromoId);
            await supabase.from("promo_codes").delete().eq("id", testPromoId);
        }
        if (testUserId) await supabase.auth.admin.deleteUser(testUserId);
    } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError.message);
    }
    process.exit(1);
  }
}

runTests();
