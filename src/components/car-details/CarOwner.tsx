
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";
import { useState } from "react";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface CarOwnerProps {
  ownerName: string;
  avatarUrl: string;
  ownerId: string;
  carId: string;
}

export const CarOwner = ({ ownerName, avatarUrl, ownerId, carId }: CarOwnerProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <Card className="dark:bg-gray-800 dark:border-gray-700 border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 bg-muted/30">
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <User className="h-5 w-5 text-primary dark:text-primary-foreground" />
            Host
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl
                  ? supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl
                  : "/placeholder.svg"}
                alt={ownerName || "Car Owner"}
                className="w-12 h-12 rounded-full object-cover bg-muted"
              />
              <div>
                <p className="font-semibold">{ownerName || "Car Owner"}</p>
                <p className="text-sm text-muted-foreground">Vehicle Host</p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="gap-2" onClick={() => setIsChatOpen(true)}>
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Contact</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Message the vehicle owner</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        receiverId={ownerId}
        receiverName={ownerName}
        carId={carId}
      />
    </>
  );
};
