
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { useToast } from "@/components/ui/use-toast";
import { Edit } from "lucide-react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import type { Car } from "@/types/car";

interface CarActionsProps {
  car: Car;
}

export const CarActions = ({ car }: CarActionsProps) => {
  const navigate = useNavigate();
  const user = useUser();
  const { userRole } = useAuthStatus();
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
          console.log("User not logged in, not owner");
          setIsOwner(false);
          setIsLoading(false);
          return;
        }
        
        console.log("Checking ownership for user:", user.id, "car owner:", car.owner_id);
        // Direct comparison first
        const initialOwnerCheck = user.id === car.owner_id;
        console.log("Initial owner check:", initialOwnerCheck);
        
        // Always double-check with the database for security
        if (user.id) {
          const { data, error } = await supabase
            .from("cars")
            .select("owner_id")
            .eq("id", car.id)
            .single();
            
          if (!error && data) {
            const databaseOwnerMatch = user.id === data.owner_id;
            console.log("Database owner check:", databaseOwnerMatch, "DB owner_id:", data.owner_id);
            setIsOwner(databaseOwnerMatch);
          } else {
            console.error("Error checking car ownership from DB:", error);
            // Fallback to initial check if DB query fails
            setIsOwner(initialOwnerCheck);
          }
        }
      } catch (error) {
        console.error("Error checking car ownership:", error);
        // On error, assume not owner for security
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOwnership();
  }, [user, car.id, car.owner_id]);

  const handleEditCar = () => {
    navigate(`/cars/${car.id}/edit`);
    toast({
      title: "Edit mode",
      description: "You can now edit your car details",
    });
  };

  // Debug info
  console.log("CarActions rendering with:", {
    userId: user?.id,
    carOwnerId: car.owner_id,
    isOwner,
    userRole,
    isLoading
  });

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
