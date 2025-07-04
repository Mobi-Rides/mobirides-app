import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fuel, GaugeCircle, Users, Heart } from "lucide-react";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { saveCar, unsaveCar } from "@/services/savedCarService";
import type { Car } from "@/types/car";
import { Separator } from "./ui/separator";
import { AuthModal } from "@/components/auth/AuthModal";
import { toast } from "sonner";
import { AuthTriggerService } from "@/services/authTriggerService";
import { debugAuthModal } from "@/utils/debugAuthModal";
import { SignUpRequiredModal } from "@/components/auth/SignUpRequiredModal";

interface CarCardProps {
  id: string;
  brand: string;
  model: string;
  price_per_day: number;
  image_url: string;
  transmission: string;
  fuel: string;
  seats: number;
  location: string;
  year: number;
  isSaved?: boolean;
  isAuthenticated?: boolean;
  onRestrictedAction?: (carId?: string) => void;
}

// Component instance counter
let carCardInstanceCount = 0;

export const CarCard = ({
  id,
  brand,
  model,
  price_per_day,
  image_url,
  transmission,
  fuel,
  seats,
  location,
  year,
  isSaved: initialIsSaved = false,
  isAuthenticated = true,
  onRestrictedAction,
}: CarCardProps) => {
  const instanceId = ++carCardInstanceCount;
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  // Log component mount
  React.useEffect(() => {
    console.log(`🏗️ CarCard instance ${instanceId} mounted for car: ${id}`);
    return () => {
      console.log(`🏗️ CarCard instance ${instanceId} unmounted`);
    };
  }, [instanceId, id]);

  const { data: carDetails, isLoading: isLoadingCarDetails } = useQuery({
    queryKey: ['car', id],
    queryFn: async () => {
      console.log("Fetching complete car details for booking");
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching car details:", error);
        throw error;
      }

      console.log("Car details fetched:", data);
      return data as Car;
    },
    enabled: isBookingOpen
  });

  const handleCardClick = () => {
    // Always navigate to car details, regardless of authentication status
    navigate(`/cars/${id}`);
  };

  const handleBookNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      sessionStorage.setItem(
        "postAuthIntent",
        JSON.stringify({
          action: "book",
          carId: id,
          page: window.location.pathname + window.location.search,
          timestamp: Date.now(),
        })
      );
      setShowSignUpModal(true);
      return;
    }
    setIsBookingOpen(true);
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      // Store the save intent and current page for post-auth
      sessionStorage.setItem(
        "postAuthIntent",
        JSON.stringify({
          action: "save",
          carId: id,
          page: window.location.pathname + window.location.search,
          timestamp: Date.now(),
        })
      );
      setShowSignUpModal(true);
      return;
    }
    
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      if (isSaved) {
        const success = await unsaveCar(id);
        if (success) {
          setIsSaved(false);
          toast.success("Vehicle removed from saved list");
          queryClient.invalidateQueries({ queryKey: ["saved-cars-full"] });
          queryClient.invalidateQueries({ queryKey: ["saved-car-ids"] });
        }
      } else {
        const success = await saveCar(id);
        if (success) {
          setIsSaved(true);
          toast.success("Vehicle added to saved list");
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

  const handleAuthModalClose = () => {
    debugAuthModal.close(`CarCard-${instanceId}`);
    setIsAuthModalOpen(false);
  };

  const handleSignUpNow = () => {
    setShowSignUpModal(false);
    navigate("/signup");
  };

  const handleCancelSignUp = () => {
    setShowSignUpModal(false);
  };

  // Determine car type based on seats
  const getCarType = (seats: number) => {
    if (seats <= 2) return "Sports";
    if (seats <= 5) return "Sedan";
    if (seats <= 7) return "SUV";
    return "Van";
  };

  return (
    <>
      <Card
        className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] h-auto min-h-[20rem] sm:h-[24rem] dark:bg-gray-800 dark:border-gray-700"
        onClick={handleCardClick}
      >
        <div className="relative h-40 sm:h-48">
          <img
            src={image_url}
            alt={`${brand} ${model}`}
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleSaveToggle}
            className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={isSaving}
          >
            <Heart
              className={`w-5 h-5 ${
                isSaving ? "text-gray-400" : isSaved ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>
        </div>
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <span className="px-3 py-1 rounded-md text-xs md:text-sm bg-[#F1F0FB] dark:bg-[#352a63] text-[#7C3AED] dark:text-[#a87df8] w-fit mb-2">
            {getCarType(seats)}
          </span>
          <div className="flex justify-between items-start mb-2 min-h-[3rem]">
            <div className="flex-1">
              <h3 className="font-semibold text-left break-words line-clamp-2 text-sm md:text-base dark:text-white">{brand} {model}</h3>
            </div>
            <div className="text-right ml-2">
              <div className="flex items-center gap-1 justify-end">
                <p className="font-semibold whitespace-nowrap text-primary dark:text-primary-foreground">BWP {price_per_day}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">/day</p>
              </div>
            </div>
          </div>
          <Separator className="w-full my-2 sm:my-3 dark:bg-gray-700" />
          <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3 sm:mb-4 text-[0.7rem] sm:text-sm">
            <div className="flex items-center justify-left gap-1 text-sm text-gray-400 dark:text-gray-300">
              <GaugeCircle className="w-4 h-4 text-primary dark:text-primary-foreground" />
              {transmission}
            </div>
            <div className="flex items-center justify-left gap-1 text-sm text-gray-400 dark:text-gray-300">
              <Fuel className="w-4 h-4 text-primary dark:text-primary-foreground" />
              {fuel}
            </div>
            <div className="flex items-center justify-left gap-1 text-sm text-gray-400 dark:text-gray-300">
              <Users className="w-4 h-4 text-primary dark:text-primary-foreground" />
              {seats} Seats
            </div>
          </div>
        </div>
      </Card>

      {isBookingOpen && carDetails && (
        <BookingDialog
          car={carDetails}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
      <SignUpRequiredModal
        open={showSignUpModal}
        onSignUp={handleSignUpNow}
        onCancel={handleCancelSignUp}
      />
    </>
  );
};
