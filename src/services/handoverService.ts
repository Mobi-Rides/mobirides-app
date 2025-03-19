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
  handover_type?: string | null;
  created_at: string;
  updated_at: string;
}

// Create a new handover session when a booking is confirmed
export const createHandoverSession = async (
  bookingId: string,
  hostId: string,
  renterId: string,
  handoverType?: string
) => {
  try {
    const { data, error } = await supabase
      .from("handover_sessions")
      .insert({
        booking_id: bookingId,
        host_id: hostId,
        renter_id: renterId,
        host_ready: false,
        renter_ready: false,
        handover_completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating handover session:", error);
    toast.error("Failed to create handover session");
    return null;
  }
};

// Get handover session by booking ID
export const getHandoverSession = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from("handover_sessions")
      .select("*")
      .eq("booking_id", bookingId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching handover session:", error);
    return null;
  }
};

// Update user location for handover
export const updateHandoverLocation = async (
  handoverId: string,
  userId: string,
  isHost: boolean,
  location: HandoverLocation
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
  isHost: boolean
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
  onUpdate: (handover: HandoverStatus) => void
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
      }
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
