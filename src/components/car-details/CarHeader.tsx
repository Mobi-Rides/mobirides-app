import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Info, Edit, MapPin, Calendar, CalendarCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ShareDropdown } from '@/components/shared/ShareDropdown';
import { useOptimizedConversations } from '@/hooks/useOptimizedConversations';
import { toast } from "sonner";



interface CarHeaderProps {
  brand: string;
  model: string;
  year: number;
  location: string;
  pricePerDay: number;
  ownerId?: string;
}

export const CarHeader = ({ brand, model, year, location, pricePerDay, ownerId }: CarHeaderProps) => {
  const { carId } = useParams<{ carId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { createConversation, isCreatingConversation } = useOptimizedConversations();
  
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        
        if (!userId || !carId) {
          setIsOwner(false);
          return;
        }
        
        // Get car to check ownership
        const { data: carData } = await supabase
          .from("cars")
          .select("owner_id")
          .eq("id", carId)
          .single();
          
        setIsOwner(carData?.owner_id === userId || ownerId === userId);
      } catch (error) {
        console.error("Error checking car ownership:", error);
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOwnership();
  }, [carId]);
  
  // Prepare share data for the ShareDropdown component
  const getShareData = () => {
    if (!carId) {
      console.error('No car ID available for sharing');
      return null;
    }

    return {
      title: `${brand} ${model} (${year})`,
      text: `Let's rent this ${brand} ${model} on Mobi Rides`,
      url: `${window.location.origin}/cars/${carId}`,
    };
  };

  const handleContactOwner = async () => {
    if (!user) {
      toast.error("Please log in to contact the owner.");
      return;
    }
    
    if (!ownerId) {
      toast.error("Owner information not available.");
      return;
    }
    
    try {
      const conversationParams = {
        type: 'direct' as const,
        participantIds: [ownerId],
        title: `Chat about ${brand} ${model}`
      };
      
      createConversation(conversationParams);
      
      // Navigate to messages page with recipient info
      navigate('/messages', { 
        state: { 
          recipientId: ownerId, 
          recipientName: `${brand} ${model} Owner` 
        } 
      });
      toast.success("Starting conversation...");
    } catch (error) {
      console.error("Error in handleStartConversation:", error);
      toast.error("Failed to start conversation. Please try again.");
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex flex-col md:flex-row justify-between md:items-start">
        <div>
          <h1 className="text-2xl md:text-3xl text-left text-gray-700 dark:text-white font-bold">
            {brand} {model} 
          </h1>
          <div className="flex items-center gap-1 mt-1 text-sm md:text-base text-muted-foreground dark:text-white">
            <CalendarCheck size={16} className="h-4 w-4 mr-1 text-blue-500" />
                     <span className="text-sm md:text-base text-muted-foreground">

              {year}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-1 ">
            <MapPin size={16} className="h-4 w-4 mr-1 text-red-500" />
            <span className="text-sm md:text-base text-muted-foreground">
              {location}
            </span>
          </div>
          <div className="mt-8 flex items-center gap-1">
            <h2 className="font-bold text-lg md:text-xl  text-primary">
              BWP {pricePerDay}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground dark:text-white">
              /day
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {isOwner && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl md:size-auto md:px-4 md:py-2 md:flex md:items-center md:gap-2"
              asChild
            >
              <Link to={`/edit-car/${carId}`}>
                <Edit className="h-4 w-4 text-[#581CFA] dark:text-white" />
                <span className="hidden md:inline-block">
                  <p className="text-[#581CFA] dark:text-white text-xs md:text-sm lg:text-base font-semibold">
                    Edit Car
                  </p>
                </span>
              </Link>
            </Button>
          )}
  
          {getShareData() && (
            <ShareDropdown
              shareData={getShareData()!}
              variant="outline"
              size="icon"
              showLabel={true}
            />
          )}
  
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl md:size-auto md:px-4 md:py-2 md:flex md:items-center md:gap-2"
            asChild
          >
            <Link to="/bookings">
              <Calendar className="h-4 w-4 text-[#581CFA] dark:text-white" />
              <span className="hidden md:inline-block">
                <p className="text-[#581CFA] dark:text-white text-xs md:text-sm lg:text-base font-semibold">
                  Bookings
                </p>
              </span>
            </Link>
          </Button>
          
          {!isOwner && ownerId && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl md:size-auto md:px-4 md:py-2 md:flex md:items-center md:gap-2"
              onClick={handleContactOwner}
              disabled={isCreatingConversation}
            >
              <MessageSquare className="h-4 w-4 text-[#581CFA] dark:text-white" />
              <span className="hidden md:inline-block">
                <p className="text-[#581CFA] dark:text-white text-xs md:text-sm lg:text-base font-semibold">
                  {isCreatingConversation ? 'Connecting...' : 'Contact'}
                </p>
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
