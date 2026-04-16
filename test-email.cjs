const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmail() {
  const targetEmail = 'bathoensescob@gmail.com';
  console.log(`Testing email notification for: ${targetEmail}`);

  // 1. Test Listing Status Update (One of the new ones)
  console.log('\n--- Testing Listing Status Update ---');
  const { data: listingData, error: listingError } = await supabase.functions.invoke('resend-service', {
    body: {
      to: targetEmail,
      templateId: 'listing-status-update',
      dynamicData: {
        name: 'Bathoen',
        carName: 'Toyota Corolla 2024',
        status: 'approved',
        message: 'Your Toyota Corolla has been approved and is now live on MobiRides!',
        listing_url: 'https://mobirides.app/dashboard'
      },
      subject: '📋 Listing Approved: Toyota Corolla 2024'
    }
  });

  if (listingError) {
    console.error('Error testing listing-status-update:', listingError);
  } else {
    console.log('Success testing listing-status-update:', listingData);
  }

  // 2. Test Wallet Notification
  console.log('\n--- Testing Wallet Notification ---');
  const { data: walletData, error: walletError } = await supabase.functions.invoke('resend-service', {
    body: {
      to: targetEmail,
      templateId: 'wallet-notification',
      dynamicData: {
        name: 'Bathoen',
        message: 'You have received a payment of P500.00 for your recent booking.',
        balance: '1250.00'
      },
      subject: '💳 Wallet Activity - MobiRides'
    }
  });

  if (walletError) {
    console.error('Error testing wallet-notification:', walletError);
  } else {
    console.log('Success testing wallet-notification:', walletData);
  }

  // 3. Test Booking Confirmation (Classic)
  console.log('\n--- Testing Booking Confirmation ---');
  const { data: bookingData, error: bookingError } = await supabase.functions.invoke('resend-service', {
    body: {
      to: targetEmail,
      templateId: 'booking-confirmation',
      dynamicData: {
        customerName: 'Bathoen',
        bookingReference: 'MOB-TEST-123',
        carDetails: 'Toyota Corolla 2024',
        pickupDate: '2026-04-20',
        pickupTime: '10:00 AM',
        pickupLocation: 'Gaborone CBD',
        dropoffLocation: 'Gaborone CBD',
        totalAmount: '1500.00',
        hostName: 'MobiRides Host'
      },
      subject: '🎉 Your MobiRides Booking is Confirmed!'
    }
  });

  if (bookingError) {
    console.error('Error testing booking-confirmation:', bookingError);
  } else {
    console.log('Success testing booking-confirmation:', bookingData);
  }
}

testEmail();
