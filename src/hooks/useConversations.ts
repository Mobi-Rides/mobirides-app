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

      const { data: conversations, error } = await supabase
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
            profiles!conversation_participants_user_id_fkey (
              id,
              full_name,
              avatar_url
            )
          ),
          conversation_messages (
            id,
            content,
            sender_id,
            created_at,
            message_type
          )
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        return [];
      }

      console.log("Raw conversations fetched:", conversations);
      
      // Transform to UI format
      const transformedConversations: Conversation[] = (conversations as any[]).map((conv: any) => {
        const participants: User[] = conv.conversation_participants.map(p => ({
          id: p.profiles.id,
          name: p.profiles.full_name || 'Unknown User',
          avatar: p.profiles.avatar_url ? 
            supabase.storage.from('avatars').getPublicUrl(p.profiles.avatar_url).data.publicUrl : 
            undefined,
          status: 'offline' as const
        }));

        const lastMessage = conv.conversation_messages.length > 0 ? 
          conv.conversation_messages[conv.conversation_messages.length - 1] : undefined;

        return {
          id: conv.id,
          title: conv.title,
          participants,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderId: lastMessage.sender_id,
            conversationId: conv.id,
            timestamp: new Date(lastMessage.created_at),
            type: lastMessage.message_type as 'text' | 'image' | 'file'
          } : undefined,
          unreadCount: 0, // TODO: Implement unread count
          type: conv.type,
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at)
        };
      });

      console.log("Transformed conversations:", transformedConversations);
      return transformedConversations;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
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