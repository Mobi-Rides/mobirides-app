
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
}

export const CarOwner = ({ ownerName, avatarUrl, ownerId }: CarOwnerProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleContactClick = () => {
    console.log("Contact button clicked! Owner ID:", ownerId, "Owner Name:", ownerName);
    console.log("Current user authenticated:", isAuthenticated, "User ID:", user?.id);
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log("User not authenticated, showing toast");
      toast.error("Please sign in to message the car owner");
      return;
    }
    
    // Check if trying to message themselves
    if (user?.id === ownerId) {
      console.log("User trying to message themselves");
      toast.error("You cannot message yourself");
      return;
    }
    
    if (!ownerId) {
      console.error("No owner ID provided");
      toast.error("Unable to contact car owner");
      return;
    }
    
    console.log("Navigating to messages with recipient data");
    navigate("/messages", { 
      state: { 
        recipientId: ownerId, 
        recipientName: ownerName 
      } 
    });
  };

  // Fetch user rating stats
  const { data: userStats, isLoading: statsLoading, error: statsError } = useQuery<UserStats | null>({
    queryKey: ["user-stats", ownerId],
    queryFn: async () => {
      console.log("Fetching user stats for owner ID:", ownerId);
      const { data, error } = await supabase.rpc("get_user_review_stats", {
        user_uuid: ownerId,
      });

      if (error) {
        console.error("Error fetching user stats:", error);
        return null;
      }

      console.log("User stats response:", data);
      return data as unknown as UserStats;
    },
    enabled: !!ownerId,
  });

  console.log("User stats state:", { userStats, statsLoading, statsError });

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
                    ? avatarUrl
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
                  {/* Debug info */}
                  {statsLoading && (
                    <span className="text-xs text-blue-500">Loading rating...</span>
                  )}
                  {userStats && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-white">
                        {userStats.overall_rating?.toFixed(1) || "0.0"}
                      </span>
                      {userStats.total_reviews > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({userStats.total_reviews} review{userStats.total_reviews !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                  )}
                  {!userStats && !statsLoading && (
                    <span className="text-xs text-gray-500">No rating yet</span>
                  )}
                </div>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="gap-2" onClick={handleContactClick}>
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
    </>
  );
};
