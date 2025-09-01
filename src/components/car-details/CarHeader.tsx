import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Info, Edit, MapPin, Calendar, Share2, CalendarCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOptimizedConversations } from '@/hooks/useOptimizedConversations';

interface CarHeaderProps {
  brand: string;
  model: string;
  year: number;
  location: string;
  pricePerDay: number;
  ownerId?: string;
}

export const CarHeader = ({ brand, model, year, location, pricePerDay, ownerId }: CarHeaderProps) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { createConversation, isCreatingConversation } = useOptimizedConversations();
  
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        
        if (!userId || !id) {
          setIsOwner(false);
          return;
        }
        
        // Get car to check ownership
        const { data: carData } = await supabase
          .from("cars")
          .select("owner_id")
          .eq("id", id)
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
  }, [id]);
  
  // Handle share functionality
  const handleShare = async () => {
    if (!id) return;
    
    // Create the full URL to the car listing
    const shareUrl = `${window.location.origin}/cars/${id}`;
    
    try {
      if (navigator.share) {
        // Use Web Share API if available (mobile devices)
        await navigator.share({
          title: `${brand} ${model} (${year})`,
          text: `Let's rent this ${brand} ${model} on Mobi Rides`,
          url: shareUrl,
        });
        toast.success("Shared successfully");
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard");
        
        // Reset copied state after 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share. Please try again.");
    }
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
              <Link to={`/edit-car/${id}`}>
                <Edit className="h-4 w-4 text-[#581CFA] dark:text-white" />
                <span className="hidden md:inline-block">
                  <p className="text-[#581CFA] dark:text-white text-xs md:text-sm lg:text-base font-semibold">
                    Edit Car
                  </p>
                </span>
              </Link>
            </Button>
          )}
  
          <Popover open={copied} onOpenChange={setCopied}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl md:size-auto md:px-4 md:py-2 md:flex md:items-center md:gap-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 text-[#581CFA] dark:text-white" />
                <span className="hidden md:inline-block">
                  <p className="text-[#581CFA] dark:text-white text-xs md:text-sm lg:text-base font-semibold">
                    Share
                  </p>
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 text-sm">
              Link copied!
            </PopoverContent>
          </Popover>
  
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
