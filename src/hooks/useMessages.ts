import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/types/database/message";

export const useMessages = (userId: string) => {
  return useQuery({
    queryKey: ["messages", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match the Message type
      const messages = data.map((message): Message => ({
        ...message,
        sender: message.sender[0], // Take first sender since it's returned as an array
      }));

      return messages;
    },
    enabled: !!userId,
  });
};