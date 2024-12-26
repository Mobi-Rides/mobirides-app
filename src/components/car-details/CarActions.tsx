import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookingDialog } from "@/components/booking/BookingDialog";
import type { Car } from "@/types/car";

interface CarActionsProps {
  car: Car;
}

export const CarActions = ({ car }: CarActionsProps) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to check if the car is saved
  const { data: isSaved, isLoading: isCheckingSaved } = useQuery({
    queryKey: ["saved-car", car.id],
    queryFn: async () => {
      console.log("Checking if car is saved:", car.id);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

      const { data, error } = await supabase
        .from("saved_cars")
        .select()
        .eq("car_id", car.id)
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error checking saved status:", error);
        return false;
      }

      return data && data.length > 0;
    },
  });

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

      if (isSaved) {
        // Remove from saved cars
        const { error } = await supabase
          .from("saved_cars")
          .delete()
          .eq("car_id", car.id)
          .eq("user_id", session.user.id);

        if (error) throw error;

        toast({
          title: "Car removed",
          description: "Car removed from your saved list",
        });
      } else {
        // Add to saved cars
        const { error } = await supabase
          .from("saved_cars")
          .insert({ 
            car_id: car.id,
            user_id: session.user.id
          });

        if (error) throw error;

        toast({
          title: "Car saved",
          description: "Car added to your saved list",
        });
      }

      // Invalidate both the specific car's saved status and the general saved cars list
      queryClient.invalidateQueries({ queryKey: ["saved-car", car.id] });
      queryClient.invalidateQueries({ queryKey: ["saved-cars"] });
    } catch (error) {
      console.error("Error saving car:", error);
      toast({
        title: "Error",
        description: "Could not update saved status. Please try again.",
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
            disabled={isCheckingSaved}
          >
            <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
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