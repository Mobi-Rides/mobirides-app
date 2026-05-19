import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateRentalAgreementPDF } from "@/utils/generateRentalAgreementPDF";
import { toast } from "sonner";
import type { BookingWithRelations } from "@/types/booking";

export const useRentalAgreement = (bookingId: string) => {
  const { data: booking, isLoading, error, refetch } = useQuery({
    queryKey: ["rental-agreement", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      console.log("[useRentalAgreement] Fetching agreement details for booking:", bookingId);
      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select(`
          *,
          renter:profiles!renter_id (
            id,
            full_name,
            avatar_url,
            phone_number
          ),
          cars (
            *,
            owner:profiles!owner_id (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq("id", bookingId)
        .single();

      if (fetchError) {
        console.error("[useRentalAgreement] Error fetching booking for agreement:", fetchError);
        throw fetchError;
      }

      return data as unknown as BookingWithRelations;
    }
  });

  const downloadAgreement = async () => {
    if (!booking) {
      toast.error("Agreement data is still loading. Please try again in a moment.");
      return;
    }

    try {
      toast.info("Preparing your rental agreement PDF...");
      generateRentalAgreementPDF(booking);
      toast.success("Rental agreement downloaded successfully!");
    } catch (err) {
      console.error("[useRentalAgreement] Failed to generate PDF agreement:", err);
      toast.error("Failed to generate PDF agreement. Please contact support.");
    }
  };

  return {
    booking,
    isLoading,
    error,
    downloadAgreement,
    refetch
  };
};
