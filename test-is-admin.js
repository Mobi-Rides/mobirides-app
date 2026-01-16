// Test script to check if is_admin function is working
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwenRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI2ODQ1NzgsImV4cCI6MjAzODI2MDU3OH0.8p6yqFKgxH7zlJdICIjQKjXKw7xE6n9X2h1Jwv3y1Hg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testIsAdmin() {
  try {
    console.log('Testing is_admin function...')
    
    // Sign in as admin user (you'll need to provide admin credentials)
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com', // Replace with actual admin email
      password: 'admin123' // Replace with actual admin password
    })
    
    if (signInError) {
      console.error('Sign in error:', signInError)
      return
    }
    
    console.log('Signed in as:', user.email)
    
    // Test the is_admin function
    const { data: isAdminResult, error: rpcError } = await supabase.rpc('is_admin', { 
      user_uuid: user.id 
    })
    
    console.log('is_admin result:', isAdminResult)
    console.log('is_admin error:', rpcError)
    
    if (rpcError) {
      console.error('RPC Error details:', {
        message: rpcError.message,
        code: rpcError.code,
        details: rpcError.details,
        hint: rpcError.hint
      })
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testIsAdmin()