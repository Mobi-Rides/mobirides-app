// src/contexts/HandoverContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";

interface HandoverContextType {
  updateLocation(arg0: {
    latitude: any;
    longitude: any;
    address: string;
  }): unknown;
  handoverStatus: any;
  isLoading: boolean;
  isHost: boolean;
  bookingDetails: any;
  debugMode: boolean;
  toggleDebugMode: () => void;
  destination: { latitude: number; longitude: number } | null;
  ownerId: string;
  currentUserId: string;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [destination, setDestination] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [carId, setCarId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Fetch destination from bookings table
  const fetchDestination = async () => {
    if (!bookingId) return;
    const { data, error } = await supabase
      .from("bookings")
      .select("latitude, longitude, car_id")
      .eq("id", bookingId)
      .single();

    if (error) {
      toast.error("Failed to fetch destination");
      console.error(error);
      return;
    }

    setDestination({
      latitude: data.latitude,
      longitude: data.longitude,
    });

    setCarId(data.car_id);

    return;
  };

  const fetchHostId = async () => {
    if (!carId) return;
    try {
      const { data, error } = await supabase
        .from("cars")
        .select("owner_id")
        .eq("id", carId)
        .single();

      if (error) {
        console.error("Error getting ownerId", error);
      }

      setOwnerId(data.owner_id);

      return;
    } catch (error) {}
  };

  useEffect(() => {
    if (!bookingId) return;
    fetchDestination();
  }, [bookingId]);

  useEffect(() => {
    if (!carId) return;
    fetchHostId();
  }, [carId]);

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
  const isHost = currentUserId === ownerId;

  const [debugMode, setDebugMode] = useState(false);

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <HandoverContext.Provider
      value={{
        isLoading: isBookingLoading,
        isHost,
        bookingDetails,
        debugMode,
        toggleDebugMode,
        currentUserId,
        destination,
        ownerId,
      }}
    >
      {children}
    </HandoverContext.Provider>
  );
};
