
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const PROJECT_ID = 'putjowciegpzdheideaf';
const supabaseUrl = `https://${PROJECT_ID}.supabase.co`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error(
    'Missing Supabase anonymous key. Please add VITE_SUPABASE_ANON_KEY to your environment variables.\n' +
    'You can find this in your Supabase project settings under Project Settings -> API'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Type helper for database tables
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

// Type helper for database enums
export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];
