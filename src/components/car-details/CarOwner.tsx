
import { Button } from "@/components/ui/button";
import { MessageCircle, Star } from "lucide-react";
import { useState } from "react";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface UserStats {
  host_rating: number;
  renter_rating: number;
  total_reviews: number;
  overall_rating: number;
}

interface CarOwnerProps {
  ownerName: string;
  avatarUrl: string;
  ownerId: string;
  carId: string;
}

export const CarOwner = ({ ownerName, avatarUrl, ownerId, carId }: CarOwnerProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch user rating stats
  const { data: userStats } = useQuery<UserStats | null>({
    queryKey: ["user-stats", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_review_stats", {
        user_uuid: ownerId,
      });

      if (error) {
        console.error("Error fetching user stats:", error);
        return null;
      }

      return data as unknown as UserStats;
    },
    enabled: !!ownerId,
  });

  return (
    <>
      <Card className="dark:bg-gray-800 dark:border-gray-700 border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 bg-muted/30">
          <CardTitle className="text-base text-left text-muted-foreground dark:text-white font-medium">
            Host
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  avatarUrl
                    ? supabase.storage.from("avatars").getPublicUrl(avatarUrl)
                        .data.publicUrl
                    : "/placeholder.svg"
                }
                alt={ownerName || "Car Owner"}
                className="w-8 h-8 rounded-full object-cover bg-muted"
              />
              <div className="flex flex-col gap-0.5 items-start">
                <p className="text-sm md:text-base text-gray-700 dark:text-white ">
                  {ownerName || "Car Owner"}
                </p>

                <div className="flex items-center gap-2">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Vehicle Host
                  </p>
                  {userStats?.overall_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-white">
                        {userStats.overall_rating.toFixed(1)}
                      </span>
                      {userStats.total_reviews > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({userStats.total_reviews} review{userStats.total_reviews !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                  )}
                </div>
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
