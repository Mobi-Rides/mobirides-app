import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { BookingDialog } from "@/components/booking/BookingDialog";
import type { Car } from "@/types/car";

interface CarActionsProps {
  car: Car;
}

export const CarActions = ({ car }: CarActionsProps) => {
  const navigate = useNavigate();
  const user = useUser();
  const isOwner = user?.id === car.owner_id;
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleEditCar = () => {
    navigate(`/cars/${car.id}/edit`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t z-50">
      <div className="max-w-2xl mx-auto flex gap-4">
        {isOwner ? (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={handleEditCar}
          >
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