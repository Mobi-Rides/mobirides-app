import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInHours } from "date-fns";
import { 
  BookingModificationRequest, 
  ModificationStatus, 
  ModificationType,
  ModificationRequestData, 
  ModificationApprovalData,
  TimeChangeValidation,
  LocationChangeValidation
} from "@/types/modification";
import { toast } from "sonner";

export class BookingModificationService {
  /**
   * Validate time change request
   */
  static async validateTimeChange(
    bookingId: string,
    newStartTime?: string,
    newEndTime?: string
  ): Promise<TimeChangeValidation> {
    try {
      // Get current booking details
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("start_date, end_date, start_time, end_time, car_id")
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        return {
          isValid: false,
          message: "Booking not found"
        };
      }

      // Basic validation - ensure we have at least one time change
      if (!newStartTime && !newEndTime) {
        return {
          isValid: false,
          message: "At least one time must be changed"
        };
      }

      // Validate time format and logic
      const currentStartTime = booking.start_time || "09:00";
      const currentEndTime = booking.end_time || "17:00";
      const requestedStartTime = newStartTime || currentStartTime;
      const requestedEndTime = newEndTime || currentEndTime;

      // Check if end time is after start time
      const startHour = parseInt(requestedStartTime.split(':')[0]);
      const endHour = parseInt(requestedEndTime.split(':')[0]);
      
      if (endHour <= startHour) {
        return {
          isValid: false,
          message: "End time must be after start time"
        };
      }

      // Check for reasonable rental duration (at least 2 hours, max 12 hours per day)
      const duration = endHour - startHour;
      if (duration < 2) {
        return {
          isValid: false,
          message: "Minimum rental duration is 2 hours"
        };
      }

      if (duration > 12) {
        return {
          isValid: false,
          message: "Maximum rental duration is 12 hours per day"
        };
      }

      // Check for business hours (6 AM to 10 PM)
      if (startHour < 6 || startHour > 22 || endHour < 6 || endHour > 22) {
        return {
          isValid: false,
          message: "Pickup and return times must be between 6:00 AM and 10:00 PM"
        };
      }

      return {
        isValid: true
      };
    } catch (error) {
      console.error("Error validating time change:", error);
      return {
        isValid: false,
        message: "Error validating time change"
      };
    }
  }

  /**
   * Validate location change request
   */
  static validateLocationChange(
    originalLocation: { latitude: number; longitude: number },
    newLocation: { latitude: number; longitude: number }
  ): LocationChangeValidation {
    // Calculate distance between original and new location using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (newLocation.latitude - originalLocation.latitude) * Math.PI / 180;
    const dLon = (newLocation.longitude - originalLocation.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(originalLocation.latitude * Math.PI / 180) * Math.cos(newLocation.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers

    // Allow up to 50km change in pickup location
    const maxAllowedDistance = 50;
    
    if (distance > maxAllowedDistance) {
      return {
        isValid: false,
        message: `New location is ${distance.toFixed(1)}km away. Maximum allowed distance is ${maxAllowedDistance}km`,
        distanceFromOriginal: distance,
        isReasonableDistance: false
      };
    }

    return {
      isValid: true,
      distanceFromOriginal: distance,
      isReasonableDistance: distance <= 10 // Within 10km is considered reasonable
    };
  }

  /**
   * Submit a booking modification request
   */
  static async requestModification(
    bookingId: string,
    modificationData: ModificationRequestData
  ): Promise<BookingModificationRequest> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Get current booking details
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          start_time,
          end_time,
          latitude,
          longitude,
          cars (
            owner_id,
            brand,
            model
          )
        `)
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error("Booking not found");
      }

      // Validate based on modification type
      if (modificationData.modificationType === ModificationType.TIME_CHANGE || 
          modificationData.modificationType === ModificationType.BOTH) {
        const timeValidation = await this.validateTimeChange(
          bookingId,
          modificationData.newStartTime,
          modificationData.newEndTime
        );
        if (!timeValidation.isValid) {
          throw new Error(timeValidation.message);
        }
      }

      if (modificationData.modificationType === ModificationType.LOCATION_CHANGE || 
          modificationData.modificationType === ModificationType.BOTH) {
        if (!modificationData.newLocation) {
          throw new Error("New location is required for location change");
        }
        
        const locationValidation = this.validateLocationChange(
          { latitude: booking.latitude || 0, longitude: booking.longitude || 0 },
          modificationData.newLocation
        );
        
        if (!locationValidation.isValid) {
          throw new Error(locationValidation.message);
        }
      }

      // Create modification request
      const modificationRequest = {
        booking_id: bookingId,
        modification_type: modificationData.modificationType,
        original_start_time: booking.start_time,
        original_end_time: booking.end_time,
        requested_start_time: modificationData.newStartTime,
        requested_end_time: modificationData.newEndTime,
        original_pickup_latitude: booking.latitude,
        original_pickup_longitude: booking.longitude,
        requested_pickup_latitude: modificationData.newLocation?.latitude,
        requested_pickup_longitude: modificationData.newLocation?.longitude,
        requested_pickup_address: modificationData.newLocation?.address,
        reason: modificationData.reason,
        status: ModificationStatus.PENDING,
        requested_by: user.id,
        requested_at: new Date().toISOString()
      };

      const { data: result, error: insertError } = await supabase
        .from("booking_modification_requests")
        .insert(modificationRequest)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Create notification for car owner
      const modificationType = modificationData.modificationType;
      let notificationContent = `Modification requested for ${booking.cars.brand} ${booking.cars.model}`;
      
      if (modificationType === ModificationType.TIME_CHANGE) {
        notificationContent += ` - Time change requested`;
      } else if (modificationType === ModificationType.LOCATION_CHANGE) {
        notificationContent += ` - Pickup location change requested`;
      } else {
        notificationContent += ` - Time and location change requested`;
      }

      await supabase.from("notifications").insert({
        user_id: booking.cars.owner_id,
        type: "booking_request",
        content: notificationContent,
        related_booking_id: bookingId
      });

      toast.success("Modification request submitted successfully!");
      return result;
    } catch (error) {
      console.error("Error requesting modification:", error);
      toast.error(error instanceof Error ? error.message : "Failed to request modification");
      throw error;
    }
  }

  /**
   * Approve or reject a modification request (host action)
   */
  static async handleModificationApproval(
    approvalData: ModificationApprovalData
  ): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Get modification request details
      const { data: modification, error: modificationError } = await supabase
        .from("booking_modification_requests")
        .select(`
          *,
          bookings (
            id,
            renter_id,
            cars (
              brand,
              model,
              owner_id
            )
          )
        `)
        .eq("id", approvalData.modificationId)
        .single();

      if (modificationError || !modification) {
        throw new Error("Modification request not found");
      }

      // Verify user is the car owner
      if (modification.bookings.cars.owner_id !== user.id) {
        throw new Error("Not authorized to approve this modification");
      }

      const newStatus = approvalData.approved ? ModificationStatus.APPROVED : ModificationStatus.REJECTED;

      // Update modification request status
      const { error: updateError } = await supabase
        .from("booking_modification_requests")
        .update({
          status: newStatus,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejected_reason: approvalData.rejectionReason
        })
        .eq("id", approvalData.modificationId);

      if (updateError) {
        throw updateError;
      }

      if (approvalData.approved) {
        // Update the original booking with new details
        const updateData: any = {};
        
        if (modification.requested_start_time) {
          updateData.start_time = modification.requested_start_time;
        }
        if (modification.requested_end_time) {
          updateData.end_time = modification.requested_end_time;
        }
        if (modification.requested_pickup_latitude) {
          updateData.latitude = modification.requested_pickup_latitude;
        }
        if (modification.requested_pickup_longitude) {
          updateData.longitude = modification.requested_pickup_longitude;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: bookingUpdateError } = await supabase
            .from("bookings")
            .update(updateData)
            .eq("id", modification.booking_id);

          if (bookingUpdateError) {
            console.error("Error updating booking:", bookingUpdateError);
          }
        }

        // Create notification for renter
        await supabase.from("notifications").insert({
          user_id: modification.bookings.renter_id,
          type: "booking_confirmed",
          content: `Your modification request has been approved for ${modification.bookings.cars.brand} ${modification.bookings.cars.model}!`,
          related_booking_id: modification.booking_id
        });

        toast.success("Modification request approved!");
      } else {
        // Create notification for renter about rejection
        await supabase.from("notifications").insert({
          user_id: modification.bookings.renter_id,
          type: "booking_cancelled",
          content: `Your modification request has been declined. ${approvalData.rejectionReason || "No reason provided."}`,
          related_booking_id: modification.booking_id
        });

        toast.success("Modification request rejected.");
      }

      return true;
    } catch (error) {
      console.error("Error handling modification approval:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process modification request");
      return false;
    }
  }

  /**
   * Get modification requests for a specific booking
   */
  static async getBookingModifications(bookingId: string): Promise<BookingModificationRequest[]> {
    try {
      const { data: modifications, error } = await supabase
        .from("booking_modification_requests")
        .select("*")
        .eq("booking_id", bookingId)
        .order("requested_at", { ascending: false });

      if (error) {
        throw error;
      }

      return modifications || [];
    } catch (error) {
      console.error("Error fetching booking modifications:", error);
      return [];
    }
  }

  /**
   * Cancel a pending modification request
   */
  static async cancelModificationRequest(modificationId: string): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Verify user owns the modification request
      const { data: modification, error: modificationError } = await supabase
        .from("booking_modification_requests")
        .select("requested_by, status")
        .eq("id", modificationId)
        .single();

      if (modificationError || !modification) {
        throw new Error("Modification request not found");
      }

      if (modification.requested_by !== user.id) {
        throw new Error("Not authorized to cancel this modification request");
      }

      if (modification.status !== ModificationStatus.PENDING) {
        throw new Error("Can only cancel pending modification requests");
      }

      // Update status to cancelled
      const { error: updateError } = await supabase
        .from("booking_modification_requests")
        .update({ status: ModificationStatus.CANCELLED })
        .eq("id", modificationId);

      if (updateError) {
        throw updateError;
      }

      toast.success("Modification request cancelled");
      return true;
    } catch (error) {
      console.error("Error cancelling modification request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel modification request");
      return false;
    }
  }
} 