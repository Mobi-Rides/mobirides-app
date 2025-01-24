import { useState } from "react";
import { Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Car } from "@/types/car";

interface CarActionsProps {
  car: Car;
}

export const CarActions = ({ car }: CarActionsProps) => {
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(car.isSaved || false);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${car.brand} ${car.model}`,
        text: `Check out this ${car.year} ${car.brand} ${car.model}`,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Please log in to save cars");
        return;
      }

      if (isSaved) {
        await supabase
          .from("saved_cars")
          .delete()
          .eq("user_id", session.user.id)
          .eq("car_id", car.id);
        toast.success("Car removed from saved list");
      } else {
        await supabase
          .from("saved_cars")
          .insert({ user_id: session.user.id, car_id: car.id });
        toast.success("Car saved to your list");
      }

      setIsSaved(!isSaved);
    } catch (error) {
      toast.error("Failed to update saved cars");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleShare}
            className="rounded-full"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleSave}
            className={`rounded-full ${isSaved ? 'text-red-500 hover:text-red-600' : ''}`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>
        <Button 
          onClick={() => setIsBookingDialogOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
        >
          Book Now
        </Button>
      </div>

      <BookingDialog
        car={car}
        isOpen={isBookingDialogOpen}
        onClose={() => setIsBookingDialogOpen(false)}
      />
    </div>
  );
};