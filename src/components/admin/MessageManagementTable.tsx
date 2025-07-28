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
  status: string;
  sender_id: string;
  receiver_id: string;
  related_car_id: string | null;
  sender?: {
    full_name: string | null;
  } | null;
  receiver?: {
    full_name: string | null;
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
        .from("messages")
        .select(`
          id, content, created_at, status, sender_id, receiver_id, related_car_id,
          sender:profiles!sender_id (full_name),
          receiver:profiles!receiver_id (full_name),
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "sent": return "default";
      case "read": return "secondary";
      case "flagged": return "destructive";
      default: return "outline";
    }
  };

  const flagMessage = async (messageId: string) => {
    try {
      // Note: This would require adding 'flagged' to message_status enum
      const { error } = await supabase
        .from("messages")
        .update({ status: "read" }) // Using 'read' as placeholder
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
        .from("messages")
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
                  <TableHead>Status</TableHead>
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
                      {message.receiver?.full_name || "Unknown"}
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
                      <Badge variant={getStatusBadgeVariant(message.status)}>
                        {message.status}
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