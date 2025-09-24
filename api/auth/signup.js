import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Handle user signup with automatic email confirmation
 */
export async function signupUser(req, res) {
  try {
    const { email, password, fullName, phoneNumber } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (!fullName) {
      return res.status(400).json({
        success: false,
        error: 'Full name is required'
      });
    }

    // Create user with service role (bypasses email confirmation)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This bypasses email confirmation
      user_metadata: {
        full_name: fullName,
        phone_number: phoneNumber
      }
    });

    if (error) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      if (error.message.includes('User already registered')) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists'
        });
      }
      
      if (error.message.includes('Password should be at least')) {
        return res.status(400).json({
          success: false,
          error: 'Password should be at least 6 characters long'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: error.message || 'Signup failed'
      });
    }

    if (!data.user) {
      return res.status(500).json({
        success: false,
        error: 'Signup failed. No user data returned.'
      });
    }

<<<<<<< Updated upstream
    // The handle_new_user trigger function will automatically create the profile
    // and extract data from raw_user_meta_data, so no manual intervention needed
    
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify profile was created correctly
    const { data: profileData, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, phone_number, email_confirmed')
      .eq('id', data.user.id)
      .single();
      
    if (profileCheckError) {
      console.error('Profile verification error:', profileCheckError);
    } else {
      console.log('Profile created successfully:', {
        userId: data.user.id,
        profile: profileData
      });
=======
    // The handle_new_user trigger function should automatically create the profile
    // but if it fails, we'll create it manually as a fallback
    
    // Wait a moment to ensure the trigger has completed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify that the profile was created correctly
    let { data: profileData, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('id', data.user.id);
    
    // If profile doesn't exist, create it manually
    if (!profileData || profileData.length === 0) {
      console.log('Trigger failed to create profile, creating manually...');
      
      try {
        // Create profile manually
         const { data: manualProfile, error: manualError } = await supabaseAdmin
           .from('profiles')
           .insert({
             id: data.user.id,
             role: 'renter',
             full_name: fullName,
             phone_number: phoneNumber,
             email_confirmed: true,
             email_confirmed_at: data.user.email_confirmed_at,
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString()
           })
           .select('id, full_name, phone_number');
        
        if (manualError) {
          console.error('Manual profile creation failed:', manualError);
          return res.status(500).json({
            success: false,
            error: 'Account created but profile setup failed. Please contact support.',
            details: manualError.message
          });
        }
        
        profileData = manualProfile;
         console.log('Profile created manually:', manualProfile[0]);
        
        // Also log the welcome email manually
        await supabaseAdmin
          .from('email_delivery_logs')
          .insert({
            user_id: data.user.id,
            email_type: 'welcome',
            recipient_email: email,
            status: 'pending',
            created_at: new Date().toISOString()
          });
        
      } catch (manualCreationError) {
        console.error('Error during manual profile creation:', manualCreationError);
        return res.status(500).json({
          success: false,
          error: 'Account created but profile setup failed. Please contact support.',
          details: manualCreationError.message
        });
      }
>>>>>>> Stashed changes
    }
    
    console.log('Profile created successfully:', {
      userId: data.user.id,
      profileFullName: profileData[0].full_name,
      profilePhoneNumber: profileData[0].phone_number
    });

    console.log('User created successfully:', {
      userId: data.user.id,
      email: data.user.email,
      emailConfirmed: data.user.email_confirmed_at !== null
    });

    return res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at !== null,
        fullName,
        phoneNumber
      },
      message: 'Account created successfully! You can now sign in.'
    });

  } catch (error) {
    console.error('Error during signup:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during signup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Default export for the API route handler
export default async function handler(req, res) {
  if (req.method === 'POST') {
    return await signupUser(req, res);
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }
}