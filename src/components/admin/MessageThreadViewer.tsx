import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  conversationId: string | null;
  onClose: () => void;
}

const useMessageThread = (id: string | null) =>
  useQuery({
    queryKey: ["admin-message-thread", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_messages")
        .select(`
          id, content, created_at, message_type,
          sender:profiles!sender_id (full_name)
        `)
        .eq("conversation_id", id!)
        .order("created_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

export const MessageThreadViewer = ({ conversationId, onClose }: Props) => {
  const { data: messages, isLoading } = useMessageThread(conversationId);

  return (
    <Dialog open={!!conversationId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Message Thread</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {isLoading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          ) : messages?.length ? (
            messages.map((msg: any) => (
              <div key={msg.id} className="border rounded p-2 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{msg.sender?.full_name || "Unknown"}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{msg.message_type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-muted-foreground break-words">{msg.content}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">No messages in this thread.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
