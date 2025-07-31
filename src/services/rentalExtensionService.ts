import { supabase } from "@/integrations/supabase/client";
import { format, addDays, differenceInDays, parseISO } from "date-fns";
import { 
  RentalExtensionRequest, 
  ExtensionStatus, 
  ExtensionRequestData, 
  ExtensionApprovalData,
  ExtensionCalculation 
} from "@/types/extension";
import { checkCarAvailability } from "./availabilityService";
import { toast } from "sonner";

export class RentalExtensionService {
  /**
   * Calculate the cost and availability for a rental extension
   */
  static async calculateExtension(
    bookingId: string, 
    newEndDate: Date
  ): Promise<ExtensionCalculation> {
    try {
      // Get current booking details
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          id,
          end_date,
          car_id,
          cars (
            price_per_day
          )
        `)
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error("Booking not found");
      }

      const currentEndDate = parseISO(booking.end_date);
      const additionalDays = differenceInDays(newEndDate, currentEndDate);

      if (additionalDays <= 0) {
        return {
          additionalDays: 0,
          pricePerDay: booking.cars.price_per_day,
          additionalCost: 0,
          totalNewCost: 0,
          available: false
        };
      }

      // Check if car is available for the extended period
      const isAvailable = await checkCarAvailability(
        booking.car_id,
        addDays(currentEndDate, 1), // Start checking from day after current end
        newEndDate,
        bookingId // Exclude current booking from availability check
      );

      const additionalCost = additionalDays * booking.cars.price_per_day;

      // Get current booking total for new total calculation
      const { data: currentBooking } = await supabase
        .from("bookings")
        .select("total_price")
        .eq("id", bookingId)
        .single();

      const totalNewCost = (currentBooking?.total_price || 0) + additionalCost;

      return {
        additionalDays,
        pricePerDay: booking.cars.price_per_day,
        additionalCost,
        totalNewCost,
        available: isAvailable
      };
    } catch (error) {
      console.error("Error calculating extension:", error);
      throw error;
    }
  }

  /**
   * Submit a rental extension request
   */
  static async requestExtension(
    bookingId: string,
    extensionData: ExtensionRequestData
  ): Promise<RentalExtensionRequest> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Calculate extension details
      const calculation = await this.calculateExtension(bookingId, extensionData.newEndDate);
      
      if (!calculation.available) {
        throw new Error("Car is not available for the requested extension period");
      }

      // Get current booking end date
      const { data: booking } = await supabase
        .from("bookings")
        .select("end_date, cars(owner_id, brand, model)")
        .eq("id", bookingId)
        .single();

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Create extension request
      const { data: extensionRequest, error: insertError } = await supabase
        .from("rental_extension_requests")
        .insert({
          booking_id: bookingId,
          current_end_date: booking.end_date,
          requested_end_date: format(extensionData.newEndDate, "yyyy-MM-dd"),
          additional_days: calculation.additionalDays,
          additional_cost: calculation.additionalCost,
          reason: extensionData.reason,
          status: ExtensionStatus.PENDING,
          requested_by: user.id,
          requested_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Create notification for car owner
      await supabase.from("notifications").insert({
        user_id: booking.cars.owner_id,
        type: "booking_request",
        content: `Extension requested for ${booking.cars.brand} ${booking.cars.model} - ${calculation.additionalDays} additional days for P${calculation.additionalCost.toFixed(2)}`,
        related_booking_id: bookingId
      });

      toast.success("Extension request submitted successfully!");
      return extensionRequest;
    } catch (error) {
      console.error("Error requesting extension:", error);
      toast.error(error instanceof Error ? error.message : "Failed to request extension");
      throw error;
    }
  }

  /**
   * Approve or reject an extension request (host action)
   */
  static async handleExtensionApproval(
    approvalData: ExtensionApprovalData
  ): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Get extension request details
      const { data: extension, error: extensionError } = await supabase
        .from("rental_extension_requests")
        .select(`
          *,
          bookings (
            id,
            renter_id,
            total_price,
            cars (
              brand,
              model,
              owner_id
            )
          )
        `)
        .eq("id", approvalData.extensionId)
        .single();

      if (extensionError || !extension) {
        throw new Error("Extension request not found");
      }

      // Verify user is the car owner
      if (extension.bookings.cars.owner_id !== user.id) {
        throw new Error("Not authorized to approve this extension");
      }

      const newStatus = approvalData.approved ? ExtensionStatus.APPROVED : ExtensionStatus.REJECTED;

      // Update extension request status
      const { error: updateError } = await supabase
        .from("rental_extension_requests")
        .update({
          status: newStatus,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejected_reason: approvalData.rejectionReason
        })
        .eq("id", approvalData.extensionId);

      if (updateError) {
        throw updateError;
      }

      if (approvalData.approved) {
        // Update the original booking with new end date and total price
        const { error: bookingUpdateError } = await supabase
          .from("bookings")
          .update({
            end_date: extension.requested_end_date,
            total_price: extension.bookings.total_price + extension.additional_cost
          })
          .eq("id", extension.booking_id);

        if (bookingUpdateError) {
          console.error("Error updating booking:", bookingUpdateError);
          // Don't throw here, as the extension was approved but booking update failed
        }

        // Create notification for renter
        await supabase.from("notifications").insert({
          user_id: extension.bookings.renter_id,
          type: "booking_confirmed",
          content: `Your extension request has been approved! Your ${extension.bookings.cars.brand} ${extension.bookings.cars.model} rental has been extended until ${format(parseISO(extension.requested_end_date), "MMM dd, yyyy")}`,
          related_booking_id: extension.booking_id
        });

        toast.success("Extension request approved!");
      } else {
        // Create notification for renter about rejection
        await supabase.from("notifications").insert({
          user_id: extension.bookings.renter_id,
          type: "booking_cancelled",
          content: `Your extension request has been declined. ${approvalData.rejectionReason || "No reason provided."}`,
          related_booking_id: extension.booking_id
        });

        toast.success("Extension request rejected.");
      }

      return true;
    } catch (error) {
      console.error("Error handling extension approval:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process extension request");
      return false;
    }
  }

  /**
   * Get pending extension requests for a host
   */
  static async getPendingExtensions(hostId: string): Promise<RentalExtensionRequest[]> {
    try {
      const { data: extensions, error } = await supabase
        .from("rental_extension_requests")
        .select(`
          *,
          bookings (
            id,
            start_date,
            renter_id,
            cars!inner (
              owner_id,
              brand,
              model
            ),
            renter:profiles!bookings_renter_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq("bookings.cars.owner_id", hostId)
        .eq("status", ExtensionStatus.PENDING)
        .order("requested_at", { ascending: false });

      if (error) {
        throw error;
      }

      return extensions || [];
    } catch (error) {
      console.error("Error fetching pending extensions:", error);
      return [];
    }
  }

  /**
   * Get extension requests for a specific booking
   */
  static async getBookingExtensions(bookingId: string): Promise<RentalExtensionRequest[]> {
    try {
      const { data: extensions, error } = await supabase
        .from("rental_extension_requests")
        .select("*")
        .eq("booking_id", bookingId)
        .order("requested_at", { ascending: false });

      if (error) {
        throw error;
      }

      return extensions || [];
    } catch (error) {
      console.error("Error fetching booking extensions:", error);
      return [];
    }
  }

  /**
   * Cancel a pending extension request
   */
  static async cancelExtensionRequest(extensionId: string): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Verify user owns the extension request
      const { data: extension, error: extensionError } = await supabase
        .from("rental_extension_requests")
        .select("requested_by, status")
        .eq("id", extensionId)
        .single();

      if (extensionError || !extension) {
        throw new Error("Extension request not found");
      }

      if (extension.requested_by !== user.id) {
        throw new Error("Not authorized to cancel this extension request");
      }

      if (extension.status !== ExtensionStatus.PENDING) {
        throw new Error("Can only cancel pending extension requests");
      }

      // Update status to cancelled
      const { error: updateError } = await supabase
        .from("rental_extension_requests")
        .update({ status: ExtensionStatus.CANCELLED })
        .eq("id", extensionId);

      if (updateError) {
        throw updateError;
      }

      toast.success("Extension request cancelled");
      return true;
    } catch (error) {
      console.error("Error cancelling extension request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel extension request");
      return false;
    }
  }
} 