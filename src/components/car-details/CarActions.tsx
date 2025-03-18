
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { useToast } from "@/components/ui/use-toast";
import { Edit } from "lucide-react";
import type { Car } from "@/types/car";

interface CarActionsProps {
  car: Car;
}

export const CarActions = ({ car }: CarActionsProps) => {
  const navigate = useNavigate();
  const user = useUser();
  const [isOwner, setIsOwner] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        setIsLoading(true);
        
        // First check if user is logged in
        if (!user) {
          setIsOwner(false);
          return;
        }
        
        // Directly compare user ID with car owner ID
        setIsOwner(user.id === car.owner_id);
        
        // If that doesn't match, double-check with the database
        if (!isOwner && user.id) {
          const { data, error } = await supabase
            .from("cars")
            .select("owner_id")
            .eq("id", car.id)
            .single();
            
          if (!error && data) {
            setIsOwner(user.id === data.owner_id);
          }
        }
      } catch (error) {
        console.error("Error checking car ownership:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOwnership();
  }, [user, car.id, car.owner_id, isOwner]);

  const handleEditCar = () => {
    navigate(`/cars/${car.id}/edit`);
    toast({
      title: "Edit mode",
      description: "You can now edit your car details",
    });
  };

  return (
    <div className="w-full p-4 bg-background/80 backdrop-blur-sm border-t">
      <div className="max-w-2xl mx-auto flex gap-4">
        {isLoading ? (
          <Button className="w-full" disabled variant="outline">
            Loading...
          </Button>
        ) : isOwner ? (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={handleEditCar}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Car
          </Button>
        ) : (
          <>
            <Button 
              className="w-full" 
              onClick={() => setIsBookingOpen(true)}
            >
              Book Now
            </Button>
            <BookingDialog 
              car={car} 
              isOpen={isBookingOpen} 
              onClose={() => setIsBookingOpen(false)} 
            />
          </>
        )}
      </div>
    </div>
  );
};
