import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { BookingWithRelations } from "@/types/booking";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Calendar, MapPin, User, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface HandoverBookingButtonsProps {
  onBookingClick: (bookingId: string, handoverType: 'pickup' | 'return') => void;
}

export const HandoverBookingButtons = ({ onBookingClick }: HandoverBookingButtonsProps) => {
  const { userId, userRole } = useAuthStatus();

  // Fetch active handover bookings for the current user
  const { data: handoverBookings = [] } = useQuery<BookingWithRelations[]>({
    queryKey: ["handover-bookings", userId, userRole],
    queryFn: async () => {
      try {
        if (!userId || !userRole) {
          console.log("HandoverBookingButtons: No userId or userRole");
          return [];
        }

        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        console.log("HandoverBookingButtons: Fetching bookings", { userId, userRole, today, tomorrow });

        let query = supabase
          .from("bookings")
          .select(`
            *,
            cars (
              brand,
              model,
              location,
              image_url,
              owner_id,
              price_per_day
            ),
            renter:profiles!renter_id (
              full_name,
              avatar_url,
              phone_number
            ),
            handover_sessions (
              handover_completed
            )
          `)
          .eq("status", "confirmed")
          .gte("start_date", today)
          .lte("start_date", tomorrow);

        // Filter based on user role
        if (userRole === "renter") {
          query = query.eq("renter_id", userId);
        } else if (userRole === "host") {
          query = query.eq("cars.owner_id", userId);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error("HandoverBookingButtons: Error fetching bookings:", error);
          throw new Error(`Failed to fetch handover bookings: ${error.message}`);
        }

        if (!data) {
          console.log("HandoverBookingButtons: No data returned");
          return [];
        }

        console.log("HandoverBookingButtons: Raw bookings data", data);

        // Filter out bookings where handover is already completed
        const filteredData = data.filter(booking => {
          const handoverSession = booking.handover_sessions?.[0];
          return !handoverSession || !handoverSession.handover_completed;
        });

        console.log("HandoverBookingButtons: Filtered bookings", filteredData);
        return filteredData;
      } catch (error) {
        console.error('HandoverBookingButtons: Query failed:', error);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: (failureCount, error) => {
      console.warn("HandoverBookingButtons: Query failed, retry attempt", { failureCount, error });
      return failureCount < 2; // Only retry twice
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const BookingButton = ({ booking, index }: { booking: BookingWithRelations; index: number }) => {
    const carImage = booking.cars?.image_url || "/placeholder.svg";
    
    // Determine handover type based on date and handover session
    const today = new Date();
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const handoverSession = booking.handover_sessions?.[0];
    
    // If no handover session exists, it's a pickup
    // If handover session exists but not completed, and we're past start date, it's likely a return
    const isReturnHandover = handoverSession && !handoverSession.handover_completed && today >= startDate;
    const handoverType: 'pickup' | 'return' = isReturnHandover ? 'return' : 'pickup';
    
    return (
      <TooltipProvider key={booking.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log("Handover button clicked for booking:", booking.id, "type:", handoverType);
                onBookingClick(booking.id, handoverType);
              }}
              className={`
                w-16 h-16 rounded-full border-4 border-primary/30 
                overflow-hidden shadow-lg hover:shadow-xl
                transition-all duration-300 hover:scale-110
                animate-pulse bg-background
                mb-3
              `}
              style={{
                animationDuration: `${2 + (index * 0.5)}s`,
              }}
            >
              <img 
                src={carImage}
                alt={`${booking.cars?.brand} ${booking.cars?.model}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs p-4">
            <div className="space-y-2">
              <div className="font-semibold text-sm">
                {booking.cars?.brand} {booking.cars?.model}
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd")}
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                {booking.cars?.location}
              </div>
              
              {userRole === "host" && booking.renter && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <User className="h-3 w-3 mr-1" />
                  {booking.renter.full_name}
                </div>
              )}
              
              <div className="flex items-center text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3 mr-1" />
                BWP {booking.total_price}
              </div>
              
              <div className="text-xs text-primary font-medium mt-2">
                Click for handover details
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (!handoverBookings.length) {
    console.log("No handover bookings found for user:", userId, "role:", userRole);
    return null;
  }

  console.log("Rendering handover buttons for bookings:", handoverBookings.map(b => b.id));

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col">
      {handoverBookings.map((booking, index) => (
        <BookingButton key={booking.id} booking={booking} index={index} />
      ))}
    </div>
  );
};