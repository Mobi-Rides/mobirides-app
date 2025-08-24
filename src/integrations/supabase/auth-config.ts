// Enhanced Supabase client configuration with proper auth settings
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://putjowciegpzdheideaf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o";

// Enhanced client with proper auth configuration
export const supabaseAuthClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Ensure auth persistence
    persistSession: true,
    // Auto refresh tokens
    autoRefreshToken: true,
    // Detect session in URL
    detectSessionInUrl: true,
    // Storage key for session
    storageKey: 'mobirides-auth-token',
    // Debug mode for auth issues
    debug: process.env.NODE_ENV === 'development',
    // Flow type
    flowType: 'pkce'
  },
  // Ensure auth headers are always included
  global: {
    headers: {
      'x-client-info': 'mobirides-web-app'
    }
  },
  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Authentication context verifier
export class AuthContextVerifier {
  private static instance: AuthContextVerifier;
  private isVerifying = false;
  private lastVerification: Date | null = null;

  static getInstance(): AuthContextVerifier {
    if (!AuthContextVerifier.instance) {
      AuthContextVerifier.instance = new AuthContextVerifier();
    }
    return AuthContextVerifier.instance;
  }

  // Verify that auth context is properly passed to database
  async verifyAuthContext(): Promise<{ isValid: boolean; error?: string; userId?: string }> {
    if (this.isVerifying) {
      return { isValid: false, error: 'Verification already in progress' };
    }

    try {
      this.isVerifying = true;
      console.log('🔍 [AUTH VERIFIER] Testing auth context...');

      // Test 1: Check local session
      const { data: { session }, error: sessionError } = await supabaseAuthClient.auth.getSession();
      if (sessionError || !session?.user) {
        return { isValid: false, error: `Session invalid: ${sessionError?.message || 'No user'}` };
      }

      console.log('✅ [AUTH VERIFIER] Local session valid:', session.user.id);

      // Test 2: Verify auth context reaches database
      const { data: authTest, error: authError } = await supabaseAuthClient
        .rpc('auth_uid_test') // We'll create this function
        .single();

      if (authError) {
        console.error('❌ [AUTH VERIFIER] Database auth test failed:', authError);
        return { isValid: false, error: `Database auth test failed: ${authError.message}` };
      }

      console.log('✅ [AUTH VERIFIER] Database auth context test:', authTest);
      this.lastVerification = new Date();

      return { 
        isValid: true, 
        userId: session.user.id
      };

    } catch (error) {
      console.error('❌ [AUTH VERIFIER] Verification failed:', error);
      return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      this.isVerifying = false;
    }
  }

  // Force token refresh
  async refreshAuthContext(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [AUTH VERIFIER] Refreshing auth context...');
      
      const { data, error } = await supabaseAuthClient.auth.refreshSession();
      if (error) {
        console.error('❌ [AUTH VERIFIER] Token refresh failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [AUTH VERIFIER] Token refreshed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [AUTH VERIFIER] Token refresh error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get verification status
  getLastVerificationTime(): Date | null {
    return this.lastVerification;
  }
}

// Session recovery utility
export class SessionRecovery {
  private static maxRetries = 3;
  private static retryDelay = 1000;

  static async withAuthRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 [SESSION RECOVERY] ${context} - Attempt ${attempt}/${this.maxRetries}`);
        
        // Verify auth context before operation
        const verifier = AuthContextVerifier.getInstance();
        const authCheck = await verifier.verifyAuthContext();
        
        if (!authCheck.isValid) {
          console.log('🔄 [SESSION RECOVERY] Auth context invalid, attempting refresh...');
          const refreshResult = await verifier.refreshAuthContext();
          
          if (!refreshResult.success) {
            throw new Error(`Auth refresh failed: ${refreshResult.error}`);
          }
        }

        // Execute operation
        const result = await operation();
        console.log(`✅ [SESSION RECOVERY] ${context} - Success on attempt ${attempt}`);
        return result;

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ [SESSION RECOVERY] ${context} - Attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ [SESSION RECOVERY] Waiting ${this.retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          this.retryDelay *= 2; // Exponential backoff
        }
      }
    }

    throw new Error(`${context} failed after ${this.maxRetries} attempts. Last error: ${lastError?.message}`);
  }
}