// Browser console test for delete-user-with-transfer edge function
// Run this in your browser console while logged in as admin

async function testDeleteUser() {
  console.log('🔍 Testing delete user functionality...');
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ No session found. Please log in as admin first.');
      return;
    }
    
    console.log('✅ Found session for:', session.user.email);
    
    // Test with a dummy user ID (this should fail with 403 if not admin, or 404 if admin)
    const testUserId = '00000000-0000-0000-0000-000000000000';
    
    console.log('🔍 Testing edge function with user ID:', testUserId);
    
    const response = await fetch('https://putjowciegpzdheideaf.supabase.co/functions/v1/delete-user-with-transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        reason: 'Test deletion functionality'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Edge Function Test Results:');
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    console.log('  Result:', result);
    
    if (response.status === 500) {
      console.log('🔥 FOUND 500 ERROR! This is what we need to fix.');
      console.log('  Error details:', result.error);
      console.log('  Error code:', result.code);
      console.log('  Error details:', result.details);
    } else if (response.status === 403) {
      console.log('✅ Got expected 403 (permission denied) - admin check is working');
    } else if (response.status === 404) {
      console.log('✅ Got 404 (user not found) - function is working but user doesn\'t exist');
    } else {
      console.log('✅ Unexpected status:', response.status);
    }
    
    // Test actual deletion with a real user
    console.log('🔍 Now testing with a real user from the admin panel...');
    console.log('💡 Go to the admin panel, right-click on a user, and select "Delete User"');
    console.log('💡 Then check the console for the results');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testDeleteUser();