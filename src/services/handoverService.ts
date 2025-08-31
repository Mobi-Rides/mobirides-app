// src/services/handoverService.ts
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "@/utils/toast-utils";

// Types for handover process
export interface HandoverLocation {
  latitude: number;
  longitude: number;
  address: string;
  timestamp: number;
}

export type HandoverType = 'pickup' | 'return';

// Specific types for pickup and return handovers
export interface PickupHandoverData {
  booking_id: string;
  host_id: string;
  renter_id: string;
  location_request_sent?: boolean;
}

export interface ReturnHandoverData {
  booking_id: string;
  host_id: string;
  renter_id: string;
  early_return_check?: boolean;
}

export interface HandoverStatus {
  id: string;
  booking_id: string;
  host_id: string;
  renter_id: string;
  host_ready: boolean;
  renter_ready: boolean;
  host_location?: HandoverLocation | null;
  renter_location?: HandoverLocation | null;
  handover_completed: boolean;
  handover_type: HandoverType;
  status?: string;
  created_at: string;
  updated_at: string;
}

// Create a pickup handover session with pickup-specific logic
export const createPickupHandoverSession = async (
  data: PickupHandoverData
): Promise<HandoverStatus> => {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    if (!user) {
      console.error('No user found in authentication');
      throw new Error('User not authenticated - no user object returned');
    }

    // Check if pickup handover session already exists
    const { data: existingSession, error: fetchError } = await supabase
      .from('handover_sessions')
      .select('*')
      .eq('booking_id', data.booking_id)
      .eq('handover_type', 'pickup')
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking existing pickup handover session:', fetchError);
      throw new Error(`Failed to check existing pickup session: ${fetchError.message}`);
    }

    if (existingSession) {
      return existingSession;
    }

    // Create new pickup handover session
    const sessionData = {
      booking_id: data.booking_id,
      host_id: data.host_id,
      renter_id: data.renter_id,
      host_ready: false,
      renter_ready: false,
      handover_completed: false,
      handover_type: 'pickup' as HandoverType,
    };
    
    const { data: sessionResult, error } = await supabase
      .from("handover_sessions")
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating pickup handover session:', error);
      
      if (error.code === '23503') {
        throw new Error('Invalid booking, host, or renter ID - record not found');
      } else if (error.code === "42501") {
        console.error("RLS policy violation:", error);
        toast.error(
          "Permission denied: You don't have access to create a pickup handover session",
        );
        throw new Error('Permission denied - check RLS policies for handover_sessions');
      } else {
        throw new Error(`Failed to create pickup handover session: ${error.message}`);
      }
    }

    if (!sessionResult) {
      throw new Error('Failed to create pickup handover session - no data returned');
    }
    
    // Send pickup-specific notification to renter
    if (user.id === data.host_id) {
      try {
        // Get host name for the notification
        const { data: hostData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.host_id)
          .single();

        const hostName = hostData?.full_name || "The host";

        // Get car details for the notification
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("car_id")
          .eq("id", data.booking_id)
          .single();

        const carId = bookingData?.car_id;

        if (carId) {
          // Create pickup-specific notification for the renter
          const notificationContent = `${hostName} is ready to hand over the car keys. Please share your location to coordinate the pickup.`;

          const { error: notificationError } = await supabase
            .from("notifications")
            .insert({
              user_id: data.renter_id,
              type: "pickup_location_request",
              title: "Car Pickup Ready",
              content: notificationContent,
              related_car_id: carId,
              related_booking_id: data.booking_id,
              role_target: "renter_only",
            });

          if (notificationError) {
            console.error(
              "Error creating pickup notification:",
              notificationError.message ||
                JSON.stringify(notificationError, null, 2),
            );
          }
        }
      } catch (notificationError) {
        console.error(
          "Error sending pickup notification:",
          notificationError instanceof Error
            ? notificationError.message
            : JSON.stringify(notificationError, null, 2),
        );
        // Don't throw here, we still want to return the handover session
      }
    }

    return sessionResult;
  } catch (error) {
    console.error('Pickup handover session creation failed:', error);
    throw error;
  }
};

// Create a return handover session with return-specific logic
export const createReturnHandoverSession = async (
  data: ReturnHandoverData
): Promise<HandoverStatus> => {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    if (!user) {
      console.error('No user found in authentication');
      throw new Error('User not authenticated - no user object returned');
    }

    // Check if return handover session already exists
    const { data: existingSession, error: fetchError } = await supabase
      .from('handover_sessions')
      .select('*')
      .eq('booking_id', data.booking_id)
      .eq('handover_type', 'return')
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking existing return handover session:', fetchError);
      throw new Error(`Failed to check existing return session: ${fetchError.message}`);
    }

    if (existingSession) {
      return existingSession;
    }

    // Create new return handover session
    const sessionData = {
      booking_id: data.booking_id,
      host_id: data.host_id,
      renter_id: data.renter_id,
      host_ready: false,
      renter_ready: false,
      handover_completed: false,
      handover_type: 'return' as HandoverType,
    };
    
    const { data: sessionResult, error } = await supabase
      .from("handover_sessions")
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating return handover session:', error);
      
      if (error.code === '23503') {
        throw new Error('Invalid booking, host, or renter ID - record not found');
      } else if (error.code === "42501") {
        console.error("RLS policy violation:", error);
        toast.error(
          "Permission denied: You don't have access to create a return handover session",
        );
        throw new Error('Permission denied - check RLS policies for handover_sessions');
      } else {
        throw new Error(`Failed to create return handover session: ${error.message}`);
      }
    }

    if (!sessionResult) {
      throw new Error('Failed to create return handover session - no data returned');
    }
    
    // Send return-specific notification to host
    if (user.id === data.renter_id) {
      try {
        // Get renter name for the notification
        const { data: renterData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.renter_id)
          .single();

        const renterName = renterData?.full_name || "The renter";

        // Get car details for the notification
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("car_id")
          .eq("id", data.booking_id)
          .single();

        const carId = bookingData?.car_id;

        if (carId) {
          // Create return-specific notification for the host
          const notificationContent = `${renterName} is ready to return your car. Please coordinate the return location and time.`;

          const { error: notificationError } = await supabase
            .from("notifications")
            .insert({
              user_id: data.host_id,
              type: "return_coordination_request",
              title: "Car Return Ready",
              content: notificationContent,
              related_car_id: carId,
              related_booking_id: data.booking_id,
              role_target: "host_only",
            });

          if (notificationError) {
            console.error(
              "Error creating return notification:",
              notificationError.message ||
                JSON.stringify(notificationError, null, 2),
            );
          }
        }
      } catch (notificationError) {
        console.error(
          "Error sending return notification:",
          notificationError instanceof Error
            ? notificationError.message
            : JSON.stringify(notificationError, null, 2),
        );
        // Don't throw here, we still want to return the handover session
      }
    }

    return sessionResult;
  } catch (error) {
    console.error('Return handover session creation failed:', error);
    throw error;
  }
};

// Create a new handover session when a booking is confirmed (backward compatibility)
export const createHandoverSession = async (
  bookingId: string,
  handoverType: HandoverType = 'pickup',
  hostId?: string,
  renterId?: string
): Promise<HandoverStatus> => {
  // Validate required parameters
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }
  
  if (!hostId) {
    throw new Error('Host ID is required');
  }
  
  if (!renterId) {
    throw new Error('Renter ID is required');
  }

  // Use specific functions based on handover type
  if (handoverType === 'pickup') {
    return createPickupHandoverSession({
      booking_id: bookingId,
      host_id: hostId,
      renter_id: renterId,
    });
  } else if (handoverType === 'return') {
    return createReturnHandoverSession({
      booking_id: bookingId,
      host_id: hostId,
      renter_id: renterId,
    });
  } else {
    throw new Error(`Invalid handover type: ${handoverType}`);
  }
};

// Get handover session by booking ID and type
export const getHandoverSession = async (bookingId: string, handoverType?: HandoverType) => {
  try {
    let query = supabase
      .from("handover_sessions")
      .select("*")
      .eq("booking_id", bookingId);
    
    if (handoverType) {
      query = query.eq("handover_type", handoverType);
    }
    
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(
      "Error fetching handover session:",
      error instanceof Error ? error.message : JSON.stringify(error, null, 2),
    );
    return null;
  }
};

// Get the most recent handover session for a booking (pickup or return)
export const getLatestHandoverSession = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from("handover_sessions")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(
      "Error fetching latest handover session:",
      error instanceof Error ? error.message : JSON.stringify(error, null, 2),
    );
    return null;
  }
};

// Check if a pickup handover session exists and is completed
export const hasCompletedPickupHandover = async (bookingId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("handover_sessions")
      .select("handover_completed")
      .eq("booking_id", bookingId)
      .eq("handover_type", "pickup")
      .eq("handover_completed", true)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error(
      "Error checking pickup handover completion:",
      error instanceof Error ? error.message : JSON.stringify(error, null, 2),
    );
    return false;
  }
};

// Update user location for handover
export const updateHandoverLocation = async (
  handoverId: string,
  userId: string,
  isHost: boolean,
  location: HandoverLocation,
) => {
  try {
    const field = isHost ? "host_location" : "renter_location";
    const { error } = await supabase
      .from("handover_sessions")
      .update({
        [field]: location,
        updated_at: new Date().toISOString(),
      })
      .eq("id", handoverId)
      .eq(isHost ? "host_id" : "renter_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating location:", error);
    toast.error("Failed to update your location");
    return false;
  }
};

// Mark user as ready for handover
export const markUserReady = async (
  handoverId: string,
  userId: string,
  isHost: boolean,
) => {
  try {
    const field = isHost ? "host_ready" : "renter_ready";
    const { error } = await supabase
      .from("handover_sessions")
      .update({
        [field]: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", handoverId)
      .eq(isHost ? "host_id" : "renter_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking user ready:", error);
    toast.error("Failed to update your status");
    return false;
  }
};

// Complete the handover process
export const completeHandover = async (handoverId: string) => {
  try {
    const { error } = await supabase
      .from("handover_sessions")
      .update({
        handover_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", handoverId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error completing handover:", error);
    toast.error("Failed to complete handover");
    return false;
  }
};

// Subscribe to handover session changes
let handoverChannel: RealtimeChannel | null = null;

export const subscribeToHandoverUpdates = (
  handoverId: string,
  onUpdate: (handover: HandoverStatus) => void,
) => {
  if (handoverChannel) handoverChannel.unsubscribe();

  handoverChannel = supabase
    .channel(`handover:${handoverId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "handover_sessions",
        filter: `id=eq.${handoverId}`,
      },
      (payload) => {
        onUpdate(payload.new as HandoverStatus);
      },
    )
    .subscribe((status) => {
      if (status !== "SUBSCRIBED") {
        console.error("Failed to subscribe to handover updates");
      }
    });

  return () => {
    if (handoverChannel) handoverChannel.unsubscribe();
  };
};
