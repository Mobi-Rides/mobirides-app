// Node.js test script for bulk-delete-users edge function
// Usage: node test-delete-terminal.js

import fetch from 'node-fetch';

// Configuration from .env
const SUPABASE_URL = "https://putjowciegpzdheideaf.supabase.co";
// We use SERVICE_ROLE_KEY to simulate an admin/server-side request for testing
// In a real scenario, this would be a user's access token, but service role bypasses RLS/Auth checks
// which is useful to verify the function logic itself is reachable and working.
// HOWEVER, the function checks for `is_super_admin`. Service role usually bypasses RLS but 
// the function logic might explicitly check auth.uid().
// Let's try to mock a user or just hit it to see if it's reachable (403 vs 404).
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk";

async function testEdgeFunction() {
  console.log('🔍 Testing Edge Functions from Terminal...');
  console.log(`Target: ${SUPABASE_URL}`);

  const testUserId = '00000000-0000-0000-0000-000000000000';
  const functionUrl = `${SUPABASE_URL}/functions/v1/bulk-delete-users`;

  console.log(`\n--- Calling ${functionUrl} ---`);
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds: [testUserId],
        reason: 'Terminal test deletion'
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        console.log('Response Body:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.log('Response Body (Text):', text);
    }

    if (response.status === 200) {
        console.log('\n✅ SUCCESS: Function is deployed and reachable.');
    } else if (response.status === 404) {
        console.log('\n❌ FAILURE: Function URL not found. Deployment missing?');
    } else if (response.status === 403) {
        // This is actually a good sign that the function is running but rejected our auth
        // However, with Service Role key it might pass or fail depending on logic
        console.log('\n⚠️ ACCESS DENIED: Function is reachable but rejected credentials.');
    } else {
        console.log(`\n⚠️ UNEXPECTED STATUS: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testEdgeFunction();
