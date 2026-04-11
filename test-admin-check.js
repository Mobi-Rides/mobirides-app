import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwenRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI2ODQ1NzgsImV4cCI6MjAzODI2MDU3OH0.8p6yqFKgxH7zlJdICIjQKjXKw7xE6n9X2h1Jwv3y1Hg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminCheck() {
  try {
    console.log('🔍 Testing admin check...')
    
    // Sign in as admin user (you'll need to provide admin credentials)
    console.log('🔐 Signing in...')
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com', // Replace with actual admin email
      password: 'admin123' // Replace with actual admin password
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError)
      console.log('💡 Please update the email and password in this script with actual admin credentials')
      return
    }
    
    console.log('✅ Signed in as:', user.email)
    
    // Test is_admin RPC
    console.log('🔍 Testing is_admin RPC...')
    const { data: isAdminData, error: isAdminError } = await supabase
      .rpc('is_admin', { user_uuid: user.id })
    
    console.log('📊 RPC Result:')
    console.log('  Data:', isAdminData)
    console.log('  Error:', isAdminError)
    
    if (isAdminError) {
      console.error('❌ RPC failed:', isAdminError.message)
    } else {
      console.log('✅ RPC succeeded, is_admin:', isAdminData)
    }
    
    // Test direct profile query
    console.log('🔍 Testing direct profile query...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    console.log('📊 Profile Result:')
    console.log('  Data:', profileData)
    console.log('  Error:', profileError)
    
    if (profileError) {
      console.error('❌ Profile query failed:', profileError.message)
    } else {
      console.log('✅ Profile query succeeded, role:', profileData?.role)
    }
    
    // Test edge function
    console.log('🔍 Testing edge function...')
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (sessionData?.session?.access_token) {
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user-with-transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id, // Test with self (should fail with NOT_ADMIN)
          reason: 'Test admin check'
        })
      })
      
      const result = await response.json()
      console.log('📊 Edge Function Result:')
      console.log('  Status:', response.status)
      console.log('  Data:', result)
      
      if (response.status === 500) {
        console.log('🔥 Found 500 error - this is what we need to fix!')
      } else if (response.status === 403) {
        console.log('✅ Got expected 403 (not admin)')
      } else {
        console.log('✅ Unexpected status:', response.status)
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testAdminCheck()