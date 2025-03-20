// src/contexts/HandoverContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  HandoverStatus,
  HandoverLocation,
  getHandoverSession,
  updateHandoverLocation,
  markUserReady,
  completeHandover,
  subscribeToHandoverUpdates,
} from "@/services/handoverService";
import { toast } from "@/utils/toast-utils";

interface HandoverContextType {
  handoverStatus: HandoverStatus | null;
  isLoading: boolean;
  isHost: boolean;
  updateLocation: (
    location: Omit<HandoverLocation, "timestamp">
  ) => Promise<boolean>;
  markReady: () => Promise<boolean>;
  completeHandoverProcess: () => Promise<boolean>;
  bookingDetails: any;
  debugMode: boolean;
  toggleDebugMode: () => void;
}

const HandoverContext = createContext<HandoverContextType | undefined>(
  undefined
);

export const useHandover = () => {
  const context = useContext(HandoverContext);
  if (!context) {
    throw new Error("useHandover must be used within a HandoverProvider");
  }
  return context;
};

interface HandoverProviderProps {
  children: ReactNode;
}

export const HandoverProvider: React.FC<HandoverProviderProps> = ({
  children,
}) => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [handoverStatus, setHandoverStatus] = useState<HandoverStatus | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch booking details
  const { data: bookingDetails, isLoading: isBookingLoading } = useQuery({
    queryKey: ["handover-booking", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

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
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  // Determine if current user is host or renter
  const isHost = currentUserId === bookingDetails?.car?.owner_id;

  // Fetch handover session
  const { data: handoverData, isLoading: isHandoverLoading } = useQuery({
    queryKey: ["handover-session", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      return await getHandoverSession(bookingId);
    },
    enabled: !!bookingId,
  });

  // Set handover status when data is loaded
  useEffect(() => {
    if (handoverData) {
      // Convert JSON location data to HandoverLocation type safely
      const convertedData = {
        ...handoverData,
        host_location: handoverData.host_location
          ? (handoverData.host_location as unknown as HandoverLocation)
          : null,
        renter_location: handoverData.renter_location
          ? (handoverData.renter_location as unknown as HandoverLocation)
          : null,
      };
      setHandoverStatus(convertedData);
    }
  }, [handoverData]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!handoverStatus?.id) return;

    const unsubscribe = subscribeToHandoverUpdates(
      handoverStatus.id,
      (updatedHandover) => {
        // Convert JSON location data to HandoverLocation type safely
        const convertedData = {
          ...updatedHandover,
          host_location: updatedHandover.host_location
            ? (updatedHandover.host_location as unknown as HandoverLocation)
            : null,
          renter_location: updatedHandover.renter_location
            ? (updatedHandover.renter_location as unknown as HandoverLocation)
            : null,
        };
        setHandoverStatus(convertedData);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [handoverStatus?.id]);

  // Update location
  const updateLocation = async (
    location: Omit<HandoverLocation, "timestamp">
  ) => {
    if (!handoverStatus?.id) {
      console.error("No handover session ID available");
      toast.error("Cannot update location: Handover session not found");
      return false;
    }

    if (!currentUserId) {
      console.error("No user ID available");
      toast.error("Cannot update location: User not authenticated");
      return false;
    }

    const locationData: HandoverLocation = {
      ...location,
      timestamp: Date.now(),
    };

    return await updateHandoverLocation(
      handoverStatus.id,
      currentUserId,
      isHost,
      locationData
    );
  };

  // Mark user as ready
  const markReady = async () => {
    if (!handoverStatus?.id || !currentUserId) return false;
    return await markUserReady(handoverStatus.id, currentUserId, isHost);
  };

  // Complete handover
  const completeHandoverProcess = async () => {
    if (!handoverStatus?.id) return false;
    return await completeHandover(handoverStatus.id);
  };

  const [debugMode, setDebugMode] = useState(false);

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <HandoverContext.Provider
      value={{
        handoverStatus,
        isLoading: isHandoverLoading || isBookingLoading,
        isHost,
        updateLocation,
        markReady,
        completeHandoverProcess,
        bookingDetails,
        debugMode,
        toggleDebugMode,
      }}
    >
      {children}
    </HandoverContext.Provider>
  );
};
