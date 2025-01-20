import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/types/database/message";

export const useMessages = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: messages, ...queryRest } = useQuery({
    queryKey: ["messages", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!userId,
  });

  const markMessageAsRead = async (senderId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from("messages")
      .update({ status: "read" })
      .eq("sender_id", senderId)
      .eq("receiver_id", userId);

    if (error) throw error;
    
    // Invalidate messages query to refresh the data
    queryClient.invalidateQueries({ queryKey: ["messages", userId] });
  };

  return {
    messages,
    markMessageAsRead,
    ...queryRest
  };
};