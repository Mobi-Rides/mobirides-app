
import { Link } from "react-router-dom";
import { CalendarDays, Info, Edit, MapPin, Calendar, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CarHeaderProps {
  brand: string;
  model: string;
  year: number;
  location: string;
}

export const CarHeader = ({ brand, model, year, location }: CarHeaderProps) => {
  const { id } = useParams<{ id: string }>();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
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
          
        setIsOwner(carData?.owner_id === userId);
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
    const shareUrl = `${window.location.origin}/car/${id}`;
    
    try {
      if (navigator.share) {
        // Use Web Share API if available (mobile devices)
        await navigator.share({
          title: `${brand} ${model} (${year})`,
          text: `Check out this ${brand} ${model} on DriveShare`,
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
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{brand} {model}</h1>
          <div className="flex items-center mt-1 text-muted-foreground">
            <Badge variant="outline" className="mr-2">{year}</Badge>
            <MapPin className="h-4 w-4 mr-1" />
            <span>{location}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
            >
              <Link to={`/edit-car/${id}`}>
                <Edit className="h-4 w-4 text-primary" />
                <span className="sr-only">Edit Car Details</span>
              </Link>
            </Button>
          )}
          
          <Popover open={copied} onOpenChange={setCopied}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 text-primary" />
                <span className="sr-only">Share</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 text-sm">
              Link copied!
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
            asChild
          >
            <Link to="/bookings">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="sr-only">View Bookings</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
