import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, User } from "@/types/message";

interface DatabaseConversation {
  id: string;
  title?: string;
  type: 'direct' | 'group';
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  created_by: string;
  conversation_participants: Array<{
    user_id: string;
    joined_at: string;
    profiles: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
  }>;
  conversation_messages: Array<{
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    message_type: 'text' | 'image' | 'file';
  }>;
}

export const useConversations = () => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for conversations
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_messages'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      console.log("Fetching conversations");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      try {
        // Use RLS-compliant approach - fetch conversations the user participates in
        const { data: userConversations, error: convError } = await supabase
          .from('conversations')
          .select(`
            id, 
            title, 
            type, 
            created_at, 
            updated_at, 
            last_message_at, 
            created_by,
            conversation_participants!inner (
              user_id,
              joined_at,
              profiles (
                id,
                full_name,
                avatar_url
              )
            )
          `)
          .order('updated_at', { ascending: false });

        if (convError) {
          console.error("Error fetching conversations:", convError);
          return [];
        }

        console.log("Fetched conversations:", userConversations);

        if (!userConversations?.length) {
          console.log("No conversations found");
          return [];
        }

        // Get latest messages for each conversation
        const conversationIds = userConversations.map(c => c.id);
        const { data: latestMessages } = await supabase
          .from('conversation_messages')
          .select('id, content, sender_id, created_at, message_type, conversation_id')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        // Transform conversations
        const transformedConversations: Conversation[] = userConversations.map((conv: any) => {
          const participantUsers: User[] = conv.conversation_participants?.map((p: any) => ({
            id: p.user_id,
            name: p.profiles?.full_name || 'Unknown User',
            avatar: p.profiles?.avatar_url ? 
              supabase.storage.from('avatars').getPublicUrl(p.profiles.avatar_url).data.publicUrl : 
              undefined,
            status: 'offline' as const
          })) || [];

          // Find the latest message for this conversation
          const lastMessage = latestMessages?.find(m => m.conversation_id === conv.id);

          return {
            id: conv.id,
            title: conv.title,
            participants: participantUsers,
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.sender_id,
              conversationId: conv.id,
              timestamp: new Date(lastMessage.created_at),
              type: lastMessage.message_type as 'text' | 'image' | 'file'
            } : undefined,
            unreadCount: 0,
            type: conv.type as 'direct' | 'group',
            createdAt: new Date(conv.created_at),
            updatedAt: new Date(conv.updated_at)
          };
        });

        console.log("Transformed conversations:", transformedConversations);
        return transformedConversations;

      } catch (error) {
        console.error("Error in conversation fetch:", error);
        return [];
      }
    },
    enabled: true,
  });

  const createConversationMutation = useMutation({
    mutationFn: async ({ participantIds, title }: { participantIds: string[], title?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if direct conversation already exists
      if (participantIds.length === 1) {
        const existingConversation = conversations.find(conv => 
          conv.type === 'direct' && 
          conv.participants.length === 2 &&
          conv.participants.some(p => p.id === participantIds[0]) &&
          conv.participants.some(p => p.id === user.id)
        );
        
        if (existingConversation) {
          console.log('Using existing conversation:', existingConversation.id);
          return existingConversation;
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          title,
          type: participantIds.length > 1 ? 'group' : 'direct',
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participantsToAdd = [user.id, ...participantIds.filter(id => id !== user.id)];
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(
          participantsToAdd.map(userId => ({
            conversation_id: conversation.id,
            user_id: userId
          }))
        );

      if (participantsError) throw participantsError;

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  return {
    conversations: conversations || [],
    isLoading,
    createConversation: createConversationMutation.mutate,
    isCreatingConversation: createConversationMutation.isPending
  };
};