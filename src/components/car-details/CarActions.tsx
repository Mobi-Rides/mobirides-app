import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Calendar, ShieldAlert, Loader2, Pencil } from "lucide-react";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { VerificationRequiredDialog } from "@/components/verification/VerificationRequiredDialog";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { saveCar, unsaveCar, isCarSaved } from "@/services/savedCarService";
import type { Car } from "@/types/car";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TouchTarget } from "@/components/ui/TouchTarget";
import { cn } from "@/lib/utils";

interface CarActionsProps {
  car: Car;
}

export const CarActions = ({ car }: CarActionsProps) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Verification status
  const { isVerified, isLoading: isVerificationLoading } =
    useVerificationStatus();
  const navigate = useNavigate();
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
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

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isOwner) {
      toast.error("You cannot book your own vehicle");
      return;
    }

    // Check verification status before allowing booking
    if (!isVerified && !isVerificationLoading) {
      setIsVerificationDialogOpen(true);
      return;
    }

    setIsBookingOpen(true);
  };

  const handleEditListing = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate(`/edit-car/${car.id}`);
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
    <div
      className="sticky bottom-[72px] md:bottom-0 bg-background dark:bg-gray-800 p-4 rounded-t-2xl border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-pb"
      role="region"
      aria-label="Car booking actions"
    >
      {isOwner ? (
        <div className="space-y-3">
          <div
            className="flex items-center justify-center p-3 bg-muted rounded-xl"
            role="status"
          >
            <ShieldAlert className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">You own this vehicle</p>
          </div>
          <Button
            onClick={handleEditListing}
            className={cn(
              "w-full h-12 min-h-[48px] rounded-xl",
              "flex items-center justify-center gap-2 text-base font-medium",
              "active:scale-[0.98] transition-transform duration-150"
            )}
            aria-label="Edit listing"
          >
            <Pencil className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>Edit Listing</span>
          </Button>
        </div>
      ) : (
        <div className="flex gap-3 items-center">
          {/* Save Button - Ensures 44x44px touch target */}
          <TouchTarget minWidth={48} minHeight={48}>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex-shrink-0",
                "active:scale-95 transition-transform duration-150",
                "touch-manipulation"
              )}
              onClick={handleSaveToggle}
              disabled={isSaving}
              aria-label={isSaved ? "Remove from saved cars" : "Save this car"}
              aria-pressed={isSaved}
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
              ) : (
                <Heart
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isSaved
                      ? "fill-red-500 text-red-500"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                  aria-hidden="true"
                />
              )}
            </Button>
          </TouchTarget>

          {/* Book Now Button - Full height for easy tapping */}
          <Button
            className={cn(
              "flex-1 h-12 min-h-[48px] rounded-xl",
              "flex items-center justify-center gap-2 text-base font-medium",
              "active:scale-[0.98] transition-transform duration-150",
              "touch-manipulation"
            )}
            onClick={handleBookNow}
            aria-label={`Book ${car.brand} ${car.model} now`}
          >
            <Calendar className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>Book Now</span>
          </Button>
        </div>
      )}

      <BookingDialog
        car={car}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      <VerificationRequiredDialog
        isOpen={isVerificationDialogOpen}
        onClose={() => setIsVerificationDialogOpen(false)}
        action="booking"
        carData={car}
      />
    </div>
  );
};

export default CarActions;
