import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Flag, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  created_at: string;
  message_type: string;
  sender_id: string;
  conversation_id: string;
  related_car_id: string | null;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  conversation?: {
    id: string;
    type: string;
    participants: {
      user_id: string;
      profiles: {
        full_name: string | null;
      };
    }[];
  } | null;
  cars?: {
    brand: string;
    model: string;
  } | null;
}

const useAdminMessages = () => {
  return useQuery({
    queryKey: ["admin-messages"],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("conversation_messages")
        .select(`
          id, content, created_at, message_type, sender_id, conversation_id, related_car_id,
          sender:profiles!sender_id (
            id,
            full_name,
            avatar_url
          ),
          conversation:conversations!conversation_id (
            id,
            type,
            participants:conversation_participants (
              user_id,
              profiles!user_id (
                full_name
              )
            )
          ),
          cars:related_car_id (brand, model)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });
};

export const MessageManagementTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: messages, isLoading, error, refetch } = useAdminMessages();

  const filteredMessages = messages?.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.receiver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getMessageTypeBadgeVariant = (messageType: string) => {
    switch (messageType) {
      case "text": return "default";
      case "image": return "secondary";
      case "file": return "outline";
      default: return "outline";
    }
  };

  const getReceiverName = (message: Message) => {
    if (!message.conversation?.participants) return "Unknown";
    
    // Find the participant who is not the sender
    const receiver = message.conversation.participants.find(
      p => p.user_id !== message.sender_id
    );
    
    return receiver?.profiles?.full_name || "Unknown";
  };

  const flagMessage = async (messageId: string) => {
    try {
      // Add flagged status to metadata
      const { error } = await supabase
        .from("conversation_messages")
        .update({ 
          metadata: { flagged: true, flagged_at: new Date().toISOString() }
        })
        .eq("id", messageId);

      if (error) throw error;
      
      refetch();
      toast.success("Message flagged successfully");
    } catch (error) {
      console.error("Error flagging message:", error);
      toast.error("Failed to flag message");
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const { error } = await supabase
        .from("conversation_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      
      refetch();
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load messages</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Related Car</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium">
                      {message.sender?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {getReceiverName(message)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">
                        {message.content}
                      </div>
                    </TableCell>
                    <TableCell>
                      {message.cars ? 
                        `${message.cars.brand} ${message.cars.model}` 
                        : "N/A"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={getMessageTypeBadgeVariant(message.message_type)}>
                        {message.message_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(message.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => flagMessage(message.id)}
                          disabled={message.status === "flagged"}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};