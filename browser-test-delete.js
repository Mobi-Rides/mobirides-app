// Browser console test for delete-user-with-transfer and bulk-delete-users edge functions
// Run this in your browser console while logged in as admin

async function testEdgeFunctions() {
  console.log('🔍 Testing Edge Functions...');
  
  // Try to find access token
  let accessToken = null;
  let userEmail = 'unknown';
  
  // 1. Try to find Supabase token in localStorage
  // The key usually starts with 'sb-' and ends with '-auth-token'
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.access_token) {
            accessToken = parsed.access_token;
            if (parsed.user && parsed.user.email) {
                userEmail = parsed.user.email;
            }
            console.log(`✅ Found token in localStorage key: ${key}`);
            break;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not read localStorage automatically', e);
  }

  // 2. Fallback: Ask user if not found
  if (!accessToken) {
    accessToken = prompt('Could not automatically find access token. Please paste your Supabase Access Token (or type "cancel"):');
    if (!accessToken || accessToken === 'cancel') {
      console.error('❌ No access token provided.');
      return;
    }
  }
  
  console.log(`✅ Using access token for user: ${userEmail}`);
  
  try {
    // Test with a dummy user ID (this should fail with 403 if not admin, or 404 if admin)
    const testUserId = '00000000-0000-0000-0000-000000000000';
    
    // --- Test 2: bulk-delete-users ---
    console.log('\n--- Testing bulk-delete-users ---');
    
    // Using the project URL directly since we don't have the env vars here easily
    // We can try to infer it from current origin or just hardcode for this test if known
    // Based on previous context: https://putjowciegpzdheideaf.supabase.co
    const PROJECT_URL = 'https://putjowciegpzdheideaf.supabase.co'; 
    const FUNCTION_URL = `${PROJECT_URL}/functions/v1/bulk-delete-users`;
    
    console.log(`Calling: ${FUNCTION_URL}`);

    const response2 = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [testUserId],
          reason: 'Test bulk deletion functionality'
        })
      });
      
      let result2;
      try {
        result2 = await response2.json();
      } catch (e) {
        result2 = { error: 'Could not parse JSON response', text: await response2.text() };
      }
      
      console.log('📊 Result 2:', result2);

      let message = `Status: ${response2.status}\n`;
      if (response2.status === 200) {
          message += '✅ Function is working!';
      } else if (response2.status === 403) {
          message += '⚠️ 403 Forbidden - You are not a Super Admin (or token is invalid).';
      } else if (response2.status === 404) {
          message += '❌ 404 Not Found - Function not deployed?';
      } else if (response2.status === 500) {
          message += `🔥 500 Error: ${result2.error || 'Unknown error'}`;
      } else {
          message += `Result: ${JSON.stringify(result2)}`;
      }
      
      alert(message);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    alert('Test failed with error: ' + error.message);
  }
}

// Run the test
testEdgeFunctions();
