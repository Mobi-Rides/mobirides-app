
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { differenceInDays, isWithinInterval, addDays } from "date-fns";
import { createHandoverSession } from "@/services/handoverService";
import { toast } from "sonner";
import { BookingStatus } from "@/types/booking";

export const useRentalDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const shouldPrint = location.search.includes("print=true");
  const [isInitiatingHandover, setIsInitiatingHandover] = useState(false);

  // Fetch booking details
  const { data: booking, isLoading: isBookingLoading } = useQuery({
    queryKey: ["rental-details", id],
    queryFn: async () => {
      console.log("Fetching rental details for ID:", id);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          renter:profiles!renter_id (
            id,
            full_name,
            avatar_url
          ),
          car:cars (
            *,
            owner:profiles!owner_id (
              id,
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Get current user
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  // Auto-print when print parameter is present
  useEffect(() => {
    if (shouldPrint && booking && !isBookingLoading) {
      const timer = setTimeout(() => {
        window.print();
      }, 500); // Short delay to ensure content is rendered
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, booking, isBookingLoading]);

  // Calculate rental details
  const isRenter = booking && currentUser && booking.renter_id === currentUser.id;
  const isOwner = booking && currentUser && booking.car.owner_id === currentUser.id;
  
  const isActiveRental = booking && 
    booking.status === 'confirmed' && // Use string literal for DB consistency
    isWithinInterval(new Date(), {
      start: new Date(booking.start_date),
      end: addDays(new Date(booking.end_date), 1), // Include the end date
    });
  
  const isCompletedRental = booking && booking.status === 'completed'; // Use string literal for DB consistency

  // Check if handover is possible
  const today = new Date();
  const startDate = booking ? new Date(booking.start_date) : null;
  const endDate = booking ? new Date(booking.end_date) : null;

  const isStartHandoverDay = startDate &&
    today.getDate() === startDate.getDate() &&
    today.getMonth() === startDate.getMonth() &&
    today.getFullYear() === startDate.getFullYear();

  const isEndHandoverDay = endDate &&
    today.getDate() === endDate.getDate() &&
    today.getMonth() === endDate.getMonth() &&
    today.getFullYear() === endDate.getFullYear();

  const canHandover = booking &&
    booking.status === 'confirmed' && // Use string literal for DB consistency
    (isStartHandoverDay || isEndHandoverDay);
    
  const handoverType = isStartHandoverDay ? "pickup" : "return";

  // Calculate duration
  const rentalDurationDays = booking
    ? differenceInDays(new Date(booking.end_date), new Date(booking.start_date)) + 1
    : 0;

  // Handover initiation handler
  const handleInitiateHandover = async () => {
    if (!booking || !currentUser) return null;

    setIsInitiatingHandover(true);
    try {
      // Create or get existing handover session
      const session = await createHandoverSession(
        booking.id,
        booking.car.owner_id,
        booking.renter_id
      );

      return session; // Return session for navigation in the main component
    } catch (error) {
      console.error("Error initiating handover:", error);
      toast.error("Failed to initiate handover process");
      return null;
    } finally {
      setIsInitiatingHandover(false);
    }
  };

  return {
    booking,
    isBookingLoading,
    isUserLoading,
    currentUser,
    isRenter,
    isOwner,
    isActiveRental,
    isCompletedRental,
    canHandover,
    handoverType,
    rentalDurationDays,
    isInitiatingHandover,
    handleInitiateHandover,
    id
  };
};
