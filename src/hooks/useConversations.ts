import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      console.log("Fetching conversations");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      try {
        // Step 1: Get conversation IDs where user is a participant
        const { data: participantData, error: partError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (partError) {
          console.error("Error fetching participants:", partError);
          return [];
        }

        const conversationIds = participantData?.map(p => p.conversation_id) || [];
        
        if (!conversationIds.length) {
          console.log("User is not participant in any conversations");
          return [];
        }

        // Step 2: Get conversations
        const { data: userConversations, error: convError } = await supabase
          .from('conversations')
          .select('id, title, type, created_at, updated_at, last_message_at, created_by')
          .in('id', conversationIds)
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

        // Step 3: Transform conversations
        const transformedConversations: Conversation[] = await Promise.all(
          userConversations.map(async (conv) => {
            console.log("Processing conversation:", conv.id);

            // Get participants for this conversation
            const { data: participants } = await supabase
              .from('conversation_participants')
              .select('user_id, joined_at')
              .eq('conversation_id', conv.id);

            // Get participant profiles
            const participantIds = participants?.map(p => p.user_id) || [];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', participantIds);

            // Get latest messages for this conversation
            const { data: messages } = await supabase
              .from('conversation_messages')
              .select('id, content, sender_id, created_at, message_type')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1);

            const participantUsers: User[] = (participants || []).map(p => {
              const profile = profiles?.find(prof => prof.id === p.user_id);
              return {
                id: p.user_id,
                name: profile?.full_name || 'Unknown User',
                avatar: profile?.avatar_url ? 
                  supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl : 
                  undefined,
                status: 'offline' as const
              };
            });

            const lastMessage = messages?.[0];

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
          })
        );

        console.log("Transformed conversations:", transformedConversations);
        return transformedConversations;

      } catch (error) {
        console.error("Error in conversation fetch:", error);
        return [];
      }
    },
    refetchInterval: 10000,
  });

  const createConversationMutation = useMutation({
    mutationFn: async ({ participantIds, title }: { participantIds: string[], title?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create conversation
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