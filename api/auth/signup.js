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

    // Call the handle_new_user function to create profile and send welcome email
    const { data: welcomeResult, error: welcomeError } = await supabaseAdmin
      .rpc('handle_new_user', { user_id: data.user.id });

    if (welcomeError) {
      console.error('Welcome process error:', welcomeError);
      // Don't fail the signup if welcome process fails, just log it
    } else {
      console.log('Welcome process completed:', welcomeResult);
    }

    // Also update the profile with the full name from signup
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        email_confirmed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user.id);

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError);
      // Don't fail the signup if profile update fails, just log it
    }

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