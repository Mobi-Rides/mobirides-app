import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookingDialog } from "@/components/booking/BookingDialog";
import type { Car } from "@/types/car";

interface CarActionsProps {
  car: Car;
}

export const CarActions = ({ car }: CarActionsProps) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveCar = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to save cars.",
          variant: "destructive",
        });
        return;
      }

      // First check if the car is already saved
      const { data: existingSave } = await supabase
        .from("saved_cars")
        .select()
        .eq('car_id', car.id)
        .eq('user_id', session.user.id)
        .single();

      if (existingSave) {
        toast({
          title: "Already saved",
          description: "This car is already in your saved list.",
        });
        return;
      }

      // If not saved, proceed with saving
      const { error } = await supabase
        .from("saved_cars")
        .insert({ 
          car_id: car.id,
          user_id: session.user.id
        });

      if (error) throw error;

      toast({
        title: "Car saved!",
        description: "You can find it in your saved cars list.",
      });
    } catch (error) {
      console.error("Error saving car:", error);
      toast({
        title: "Error",
        description: "Could not save the car. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    navigator.share?.({
      title: `${car.brand} ${car.model}`,
      url: window.location.href,
    }).catch((error) => {
      console.error("Error sharing:", error);
      toast({
        title: "Error",
        description: "Could not share the car details.",
        variant: "destructive",
      });
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={handleSaveCar}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        <Button className="w-32" onClick={() => setIsBookingOpen(true)}>
          Book Now
        </Button>
      </div>
      <BookingDialog 
        car={car}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </>
  );
};