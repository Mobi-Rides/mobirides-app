import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { User } from "@/types/message";
import { supabase } from "@/integrations/supabase/client";

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (participant: User) => void;
  currentUser: User;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onStartConversation,
  currentUser,
}: NewConversationModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .ilike("full_name", `%${query}%`)
        .neq("id", currentUser.id) // Exclude current user
        .limit(10);

      if (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
        return;
      }

      const formattedResults: User[] = data.map((profile) => ({
        id: profile.id,
        name: profile.full_name || "Unknown User",
        avatar: profile.avatar_url ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data.publicUrl : undefined,
        status: "offline", // Status is not available from profiles table, default to offline
      }));
      setSearchResults(formattedResults);
    } catch (err) {
      console.error("Error during user search:", err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogDescription>
            Search for users to start a new direct message.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[200px] w-full rounded-md border">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : searchResults.length === 0 && searchTerm.length > 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No users found.
              </div>
            ) : searchResults.length === 0 && searchTerm.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Start typing to search for users.
              </div>
            ) : (
              <div>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
                    onClick={() => onStartConversation(user)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}