// Test script to check sign-in functionality
import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignIn() {
  console.log('Testing sign-in with test@mobirides.com...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@mobirides.com',
      password: 'testpassword123'
    });
    
    if (error) {
      console.error('Sign-in error:', error.message);
      console.error('Error details:', error);
      return;
    }
    
    console.log('Sign-in successful!');
    console.log('User data:', data.user);
    
    // Check if user is confirmed
    if (data.user && !data.user.email_confirmed_at) {
      console.warn('User email is not confirmed!');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Also test with invalid credentials
async function testInvalidSignIn() {
  console.log('\nTesting sign-in with invalid credentials...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@mobirides.com',
      password: 'wrongpassword'
    });
    
    if (error) {
      console.log('Expected error for invalid credentials:', error.message);
      return;
    }
    
    console.log('Unexpected success with invalid credentials!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run tests
testSignIn().then(() => testInvalidSignIn());