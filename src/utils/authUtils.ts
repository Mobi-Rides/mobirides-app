import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Authentication utility functions for secure operations
 */

export interface AuthenticatedOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  user?: User;
}

export interface ConversationAccessResult {
  hasAccess: boolean;
  error?: string;
  participantId?: string;
}

/**
 * Ensures the user is authenticated before performing an operation
 * @param operation - The operation to perform if authenticated
 * @param requireStableSession - Whether to wait for a stable session
 * @returns Promise with operation result
 */
export async function ensureAuthenticatedOperation<T>(
  operation: (user: User) => Promise<T>,
  requireStableSession: boolean = true
): Promise<AuthenticatedOperationResult<T>> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return {
        success: false,
        error: 'Failed to get session: ' + sessionError.message
      };
    }
    
    if (!session?.user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    // If stable session is required, wait for it
    if (requireStableSession) {
      const stableSession = await waitForStableSession();
      if (!stableSession) {
        return {
          success: false,
          error: 'Failed to establish stable session'
        };
      }
    }
    
    // Perform the operation
    const result = await operation(session.user);
    
    return {
      success: true,
      data: result,
      user: session.user
    };
    
  } catch (error) {
    console.error('Error in ensureAuthenticatedOperation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validates if the current user has access to a specific conversation
 * @param conversationId - The conversation ID to check access for
 * @param userId - Optional user ID (if not provided, will get from current session)
 * @returns Promise with access validation result
 */
export async function validateConversationAccess(
  conversationId: string,
  userId?: string
): Promise<ConversationAccessResult> {
  try {
    let currentUserId = userId;
    
    // If no userId provided, get from current session
    if (!currentUserId) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        return {
          hasAccess: false,
          error: 'User not authenticated'
        };
      }
      
      currentUserId = session.user.id;
    }
    
    // Check if user is a participant in the conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('id, user_id, conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId)
      .single();
    
    if (participantError) {
      // If no participant found, user doesn't have access
      if (participantError.code === 'PGRST116') {
        return {
          hasAccess: false,
          error: 'User is not a participant in this conversation'
        };
      }
      
      console.error('Error checking conversation access:', participantError);
      return {
        hasAccess: false,
        error: 'Failed to verify conversation access: ' + participantError.message
      };
    }
    
    return {
      hasAccess: true,
      participantId: participant.id
    };
    
  } catch (error) {
    console.error('Error in validateConversationAccess:', error);
    return {
      hasAccess: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Waits for a stable authentication session with retry logic
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay between retries in milliseconds
 * @returns Promise<boolean> - true if stable session achieved
 */
export async function waitForStableSession(
  maxRetries: number = 5,
  baseDelay: number = 500
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn(`Session check failed (attempt ${i + 1}):`, sessionError);
        
        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn(`Session refresh failed (attempt ${i + 1}):`, refreshError);
        }
      } else if (session?.user) {
        // Test the session with a simple database query
        const { error: testError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .limit(1);
        
        if (!testError) {
          console.log('Stable session achieved');
          return true;
        }
        
        console.warn(`Session test failed (attempt ${i + 1}):`, testError);
      }
      
      // Wait before next retry with exponential backoff
      if (i < maxRetries - 1) {
        const delay = baseDelay * (i + 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      console.error(`Session stability check failed (attempt ${i + 1}):`, error);
    }
  }
  
  console.error('Failed to achieve stable session after', maxRetries, 'attempts');
  return false;
}

/**
 * Validates if a user ID is valid and authenticated
 * @param userId - The user ID to validate
 * @returns Promise<boolean> - true if valid and authenticated
 */
export async function validateUserId(userId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id === userId;
  } catch (error) {
    console.error('Error validating user ID:', error);
    return false;
  }
}

/**
 * Gets the current authenticated user with error handling
 * @returns Promise with user or null
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}