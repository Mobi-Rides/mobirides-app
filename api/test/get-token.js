import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get the latest confirmation token for testing purposes
 */
export default async function handler(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }

    // Get the latest token for the email
    const { data, error } = await supabase
      .from('pending_confirmations')
      .select('token, email, full_name, expires_at, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No confirmation token found for this email'
      });
    }

    return res.status(200).json({
      success: true,
      data: data[0]
    });

  } catch (error) {
    console.error('Error getting token:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}