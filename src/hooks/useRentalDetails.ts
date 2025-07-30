
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { differenceInDays, isWithinInterval, addDays } from "date-fns";
import { createHandoverSession } from "@/services/handoverService";
import { toast } from "sonner";
import { BookingStatus, HandoverType } from "@/types/booking";

export const useRentalDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const shouldPrint = location.search.includes("print=true");
  const [isInitiatingHandover, setIsInitiatingHandover] = useState(false);

  // Fetch booking details with handover sessions
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
          ),
          handover_sessions (
            id,
            handover_completed,
            created_at,
            handover_step_completion (
              step_name,
              is_completed,
              step_order
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
  
  // Determine handover session states
  const handoverSessions = booking?.handover_sessions || [];
  const sortedSessions = handoverSessions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  // Check if pickup handover has been completed
  const pickupSession = sortedSessions.find(session => {
    const steps = session.handover_step_completion || [];
    const allStepsCompleted = steps.length > 0 && steps.every(step => step.is_completed);
    return session.handover_completed || allStepsCompleted;
  });
  
  // Check if there's a return handover session
  const returnSession = sortedSessions.length > 1 ? sortedSessions[1] : null;
  const returnCompleted = returnSession && (returnSession.handover_completed || 
    (returnSession.handover_step_completion?.length > 0 && 
     returnSession.handover_step_completion.every(step => step.is_completed)));

  // Determine rental state based on booking status and handover completion
  const today = new Date();
  const startDate = booking ? new Date(booking.start_date) : null;
  const endDate = booking ? new Date(booking.end_date) : null;
  
  const isWithinRentalPeriod = booking && isWithinInterval(today, {
    start: new Date(booking.start_date),
    end: addDays(new Date(booking.end_date), 1),
  });

  // Rental state logic:
  // 1. Pending pickup: confirmed booking, within/on start date, no pickup completed
  // 2. In progress: pickup completed, within rental period, no return completed  
  // 3. Pending return: in progress, on/after end date, no return completed
  // 4. Completed: return handover completed OR booking status is completed
  
  const isPendingPickup = booking && 
    booking.status === 'confirmed' && 
    !pickupSession && 
    startDate && today >= startDate;
    
  const isInProgress = booking && 
    booking.status === 'confirmed' && 
    pickupSession && 
    !returnCompleted &&
    isWithinRentalPeriod;
    
  const isPendingReturn = booking && 
    booking.status === 'confirmed' && 
    pickupSession && 
    !returnCompleted &&
    endDate && today >= endDate;
    
  const isCompleted = booking && (booking.status === 'completed' || returnCompleted);

  // Legacy properties for backward compatibility
  const isActiveRental = isInProgress;
  const isCompletedRental = isCompleted;

  // Determine handover availability
  const isStartHandoverDay = startDate &&
    today.getDate() === startDate.getDate() &&
    today.getMonth() === startDate.getMonth() &&
    today.getFullYear() === startDate.getFullYear();

  const isEndHandoverDay = endDate &&
    today.getDate() === endDate.getDate() &&
    today.getMonth() === endDate.getMonth() &&
    today.getFullYear() === endDate.getFullYear();

  // Can initiate pickup if pending pickup
  const canInitiatePickup = isPendingPickup;
  
  // Can initiate return if in progress or pending return
  const canInitiateReturn = (isInProgress || isPendingReturn) && !returnCompleted;

  const canHandover = canInitiatePickup || canInitiateReturn;
  const handoverType: HandoverType = canInitiatePickup ? HandoverType.PICKUP : HandoverType.RETURN;

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
    isPendingPickup,
    isInProgress,
    isPendingReturn,
    isCompleted,
    canHandover,
    canInitiatePickup,
    canInitiateReturn,
    handoverType,
    rentalDurationDays,
    isInitiatingHandover,
    handleInitiateHandover,
    id
  };
};
