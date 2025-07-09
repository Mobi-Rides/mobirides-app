
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Calendar, ShieldAlert } from "lucide-react";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { saveCar, unsaveCar, isCarSaved } from "@/services/savedCarService";
import type { Car } from "@/types/car";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthContextModal } from "@/components/auth/AuthContextModal";
import AuthTriggerService from "@/services/authTriggerService";

interface CarActionsProps {
  car: Car;
}

export const CarActions = ({ car }: CarActionsProps) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authContext, setAuthContext] = useState<{
    action: 'booking' | 'save_car' | 'contact_host';
    title?: string;
    description?: string;
  } | undefined>();
  const queryClient = useQueryClient();

  // Check if user is authenticated and if they're the owner
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const isLoggedIn = !!data.session;
      setIsAuthenticated(isLoggedIn);
      
      if (isLoggedIn && data.session?.user) {
        const userId = data.session.user.id;
        setIsOwner(userId === car.owner_id);
      }
    };
    
    checkAuth();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const isLoggedIn = !!session;
      setIsAuthenticated(isLoggedIn);
      
      if (isLoggedIn && session) {
        const userId = session.user.id;
        setIsOwner(userId === car.owner_id);
      } else {
        setIsOwner(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [car.owner_id]);

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

  // Listen for pending action execution events
  useEffect(() => {
    const handleExecuteBooking = (event: CustomEvent) => {
      if (event.detail.carId === car.id) {
        setIsBookingOpen(true);
      }
    };

    const handleExecuteSaveCar = async (event: CustomEvent) => {
      if (event.detail.carId === car.id && isAuthenticated) {
        setIsSaving(true);
        try {
          const success = await saveCar(car.id);
          if (success) {
            setIsSaved(true);
            toast.success("Vehicle added to saved list");
            queryClient.invalidateQueries({ queryKey: ["saved-cars-full"] });
            queryClient.invalidateQueries({ queryKey: ["saved-car-ids"] });
          }
        } finally {
          setIsSaving(false);
        }
      }
    };

    window.addEventListener('execute-booking', handleExecuteBooking as EventListener);
    window.addEventListener('execute-save-car', handleExecuteSaveCar as EventListener);

    return () => {
      window.removeEventListener('execute-booking', handleExecuteBooking as EventListener);
      window.removeEventListener('execute-save-car', handleExecuteSaveCar as EventListener);
    };
  }, [car.id, isAuthenticated, queryClient]);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      AuthTriggerService.storePendingAction({
        type: 'booking',
        payload: { carId: car.id },
        context: `${car.brand} ${car.model}`
      });
      
      setAuthContext({
        action: 'booking',
        title: `Sign up to book ${car.brand} ${car.model}`,
        description: 'Create an account to complete your booking and connect with the host.'
      });
      setIsAuthModalOpen(true);
      return;
    }
    
    if (isOwner) {
      toast.error("You cannot book your own vehicle");
      return;
    }
    
    setIsBookingOpen(true);
  };

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      AuthTriggerService.storePendingAction({
        type: 'save_car',
        payload: { carId: car.id },
        context: `${car.brand} ${car.model}`
      });
      
      setAuthContext({
        action: 'save_car',
        title: 'Sign up to save cars',
        description: 'Create an account to save your favorite cars and access them anytime.'
      });
      setIsAuthModalOpen(true);
      return;
    }
    
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      if (isSaved) {
        const success = await unsaveCar(car.id);
        if (success) {
          setIsSaved(false);
          toast.success("Vehicle removed from saved list");
          // Invalidate saved cars queries
          queryClient.invalidateQueries({ queryKey: ["saved-cars-full"] });
          queryClient.invalidateQueries({ queryKey: ["saved-car-ids"] });
        }
      } else {
        const success = await saveCar(car.id);
        if (success) {
          setIsSaved(true);
          toast.success("Vehicle added to saved list");
          // Invalidate saved cars queries
          queryClient.invalidateQueries({ queryKey: ["saved-cars-full"] });
          queryClient.invalidateQueries({ queryKey: ["saved-car-ids"] });
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="sticky bottom-[72px] bg-background dark:bg-gray-800 p-4 rounded-t-lg border-t border-gray-200 dark:border-gray-700 shadow-lg">
      {isOwner ? (
        <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
          <ShieldAlert className="h-5 w-5 mr-2 text-amber-500" />
          <p className="text-sm text-muted-foreground">You own this vehicle</p>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="w-12 flex-shrink-0"
            onClick={handleSaveToggle}
            disabled={isSaving}
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
          >
            <Calendar className="w-5 h-5" />
            Book Now
          </Button>
        </div>
      )}
      
      {isBookingOpen && (
        <BookingDialog
          car={car}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}

      <AuthContextModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        context={authContext}
        defaultTab="signup"
      />
    </div>
  );
};
