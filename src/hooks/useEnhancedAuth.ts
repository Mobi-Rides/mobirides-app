import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuthValidationResult {
  isValid: boolean;
  error?: string;
  session?: any;
}

export const useEnhancedAuth = () => {
  const { user, session, isAuthenticated, isLoading } = useAuth();

  const ensureAuthenticatedOperation = useCallback(async (): Promise<AuthValidationResult> => {
    // Quick check for obvious auth issues
    if (isLoading) {
      return { isValid: false, error: 'Authentication still loading' };
    }

    if (!isAuthenticated || !user) {
      return { isValid: false, error: 'User not authenticated' };
    }

    // Validate current session with Supabase
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[useEnhancedAuth] Session validation error:', error);
        return { isValid: false, error: `Session validation failed: ${error.message}` };
      }

      if (!currentSession || !currentSession.user) {
        console.warn('[useEnhancedAuth] No valid session found');
        return { isValid: false, error: 'No valid session found' };
      }

      // Log auth context for debugging
      console.log('[useEnhancedAuth] Session validation successful:', {
        userId: currentSession.user.id,
        sessionId: currentSession.access_token.substring(0, 10) + '...',
        expiresAt: currentSession.expires_at
      });

      return { 
        isValid: true, 
        session: currentSession 
      };
    } catch (error) {
      console.error('[useEnhancedAuth] Session validation exception:', error);
      return { 
        isValid: false, 
        error: `Session validation exception: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }, [isAuthenticated, user, isLoading]);

  const validateConversationAccess = useCallback(async (conversationId: string) => {
    const authResult = await ensureAuthenticatedOperation();
    if (!authResult.isValid) {
      return { hasAccess: false, error: authResult.error };
    }

    try {
      const { data, error } = await supabase.rpc('validate_conversation_access', {
        p_conversation_id: conversationId
      });

      if (error) {
        console.error('[useEnhancedAuth] Access validation error:', error);
        return { hasAccess: false, error: error.message };
      }

      return {
        hasAccess: (data as any)?.has_access || false,
        isParticipant: (data as any)?.is_participant || false,
        isCreator: (data as any)?.is_creator || false
      };
    } catch (error) {
      console.error('[useEnhancedAuth] Access validation exception:', error);
      return { 
        hasAccess: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, [ensureAuthenticatedOperation]);

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    ensureAuthenticatedOperation,
    validateConversationAccess
  };
};