import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

// Create Supabase client for authentication
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Handle user login
 */
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Attempt to sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }
      
      if (error.message.includes('Email not confirmed')) {
        return res.status(401).json({
          success: false,
          error: 'Please confirm your email before logging in'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Login failed. Please check your credentials.'
      });
    }

    if (!data.user) {
      return res.status(401).json({
        success: false,
        error: 'Login failed. No user data returned.'
      });
    }

    console.log('User logged in successfully:', {
      userId: data.user.id,
      email: data.user.email
    });

    return res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at !== null
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Error during login:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during login',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Default export for the API route handler
export default async function handler(req, res) {
  if (req.method === 'POST') {
    return await loginUser(req, res);
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }
}