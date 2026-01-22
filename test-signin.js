// Test script to check sign-in functionality
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

// Configuration
// Prefer env vars, fallback to the hardcoded ones if missing (as in original file)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = 'test@mobirides.com';
const TEST_PASSWORD = 'testpassword123';

async function testSignIn() {
  console.log(`Testing sign-in with ${TEST_EMAIL}...`);

  try {
    let result = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    // If sign in fails with invalid credentials, try to sign up!
    if (result.error && result.error.message === 'Invalid login credentials') {
      console.log('⚠️ Sign-in failed (Invalid credentials). Attempting to create user...');

      const signUpResult = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });

      if (signUpResult.error) {
        console.error('❌ Sign-up failed:', signUpResult.error.message);
        return;
      }

      console.log('✅ Sign-up successful. Retrying sign-in...');

      // Wait a moment for propagation if needed? usually instant.
      result = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
    }

    const { data, error } = result;

    if (error) {
      console.error('❌ Sign-in error:', error.message);
      console.error('Error details:', error);
      return;
    }

    console.log('✅ Sign-in successful!');
    console.log('User ID:', data.user.id);

    // Check if user is confirmed
    if (data.user && !data.user.email_confirmed_at) {
      console.warn('⚠️ User email is not confirmed!');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Also test with invalid credentials
async function testInvalidSignIn() {
  console.log('\nTesting sign-in with invalid credentials...');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: 'wrongpassword'
    });

    if (error) {
      console.log('✅ Expected error for invalid credentials:', error.message);
      return;
    }

    console.log('❌ Unexpected success with invalid credentials!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run tests
testSignIn().then(() => testInvalidSignIn());