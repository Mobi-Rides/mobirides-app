
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Calendar } from "lucide-react";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { saveCar, unsaveCar, isCarSaved } from "@/services/savedCarService";
import type { Car } from "@/types/car";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CarActionsProps {
  car: Car;
}

export const CarActions = ({ car }: CarActionsProps) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Check if car is saved
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!isAuthenticated) return;
      
      try {
        const saved = await isCarSaved(car.id);
        setIsSaved(saved);
      } catch (error) {
        console.error("Failed to check if car is saved:", error);
      }
    };
    
    checkIfSaved();
  }, [car.id, isAuthenticated]);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setIsBookingOpen(true);
  };

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      if (isSaved) {
        const success = await unsaveCar(car.id);
        if (success) {
          setIsSaved(false);
          // Invalidate saved cars queries
          queryClient.invalidateQueries({ queryKey: ["saved-cars-full"] });
          queryClient.invalidateQueries({ queryKey: ["saved-car-ids"] });
        }
      } else {
        const success = await saveCar(car.id);
        if (success) {
          setIsSaved(true);
          // Invalidate saved cars queries
          queryClient.invalidateQueries({ queryKey: ["saved-cars-full"] });
          queryClient.invalidateQueries({ queryKey: ["saved-car-ids"] });
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Determine if current user is the car owner
  const isOwner = car.owner_id === (supabase.auth.getUser() as any)?.data?.user?.id;

  return (
    <div className="sticky bottom-[72px] bg-background dark:bg-gray-800 p-4 rounded-t-lg border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="w-12 flex-shrink-0"
          onClick={handleSaveToggle}
          disabled={isSaving || isOwner}
        >
          <Heart
            className={`${
              isSaved ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-400"
            }`}
          />
        </Button>
        
        <Button
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleBookNow}
          disabled={isOwner}
        >
          <Calendar className="w-5 h-5" />
          Book Now
        </Button>
      </div>
      
      {isBookingOpen && (
        <BookingDialog
          car={car}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
    </div>
  );
};
