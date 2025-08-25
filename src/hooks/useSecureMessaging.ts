import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from './useEnhancedAuth';
import { toast } from 'sonner';

interface SendMessageParams {
  conversationId: string;
  content: string;
  messageType?: string;
  relatedCarId?: string;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  message?: string;
}

export const useSecureMessaging = () => {
  const { ensureAuthenticatedOperation, validateConversationAccess } = useEnhancedAuth();
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async (params: SendMessageParams): Promise<SendMessageResult> => {
      console.log('[useSecureMessaging] Starting secure message send:', params);

      // Step 1: Validate authentication
      const authResult = await ensureAuthenticatedOperation();
      if (!authResult.isValid) {
        throw new Error(authResult.error || 'Authentication required');
      }

      // Step 2: Validate conversation access
      const accessResult = await validateConversationAccess(params.conversationId);
      if (!accessResult.hasAccess) {
        throw new Error(accessResult.error || 'Access denied to conversation');
      }

      // Step 3: Send message via secure RPC
      try {
        const { data, error } = await supabase.rpc('send_conversation_message', {
          p_conversation_id: params.conversationId,
          p_content: params.content,
          p_message_type: params.messageType || 'text',
          p_related_car_id: params.relatedCarId || null
        });

        if (error) {
          console.error('[useSecureMessaging] RPC error:', error);
          throw new Error(`Message send failed: ${error.message}`);
        }

        if (!data) {
          throw new Error('No response from message send operation');
        }

        // Parse RPC response
        const result = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (!result.success) {
          console.error('[useSecureMessaging] RPC operation failed:', result);
          throw new Error(result.message || 'Message send operation failed');
        }

        console.log('[useSecureMessaging] Message sent successfully:', result);
        return result;

      } catch (error) {
        console.error('[useSecureMessaging] Send operation exception:', error);
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      // Invalidate queries to trigger refresh
      queryClient.invalidateQueries({ 
        queryKey: ['conversation-messages', variables.conversationId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['conversations'] 
      });
      
      console.log('[useSecureMessaging] Message sent successfully, queries invalidated');
    },
    onError: (error: Error, variables) => {
      console.error('[useSecureMessaging] Send message failed:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to send message';
      if (error.message.includes('authentication')) {
        userMessage = 'Please sign in to send messages';
      } else if (error.message.includes('access')) {
        userMessage = 'You do not have permission to send messages in this conversation';
      } else if (error.message.includes('participant')) {
        userMessage = 'You are not a participant in this conversation';
      }
      
      toast.error(userMessage);
    }
  });

  const sendMessage = useCallback(
    (params: SendMessageParams) => sendMessageMutation.mutate(params),
    [sendMessageMutation]
  );

  return {
    sendMessage,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
    isSuccess: sendMessageMutation.isSuccess
  };
};