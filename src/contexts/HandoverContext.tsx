
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
import { 
  HandoverStatus, 
  HandoverLocation, 
  updateHandoverLocation, 
  getHandoverSession,
  createHandoverSession
} from "@/services/handoverService";

interface HandoverContextType {
  updateLocation(arg0: {
    latitude: any;
    longitude: any;
    address: string;
  }): unknown;
  handoverStatus: HandoverStatus | null;
  handoverId: string | null;
  isLoading: boolean;
  isHandoverSessionLoading: boolean;
  isHost: boolean;
  bookingDetails: any;
  debugMode: boolean;
  toggleDebugMode: () => void;
  destination: { latitude: number; longitude: number } | null;
  ownerId: string | null;
  currentUserId: string | null;
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

// Helper function to safely convert database JSON to our typed format
const convertDatabaseLocationToHandoverLocation = (
  location: any
): HandoverLocation | null => {
  if (!location) return null;
  
  try {
    // If it's a string (JSON), parse it
    if (typeof location === 'string') {
      const parsed = JSON.parse(location);
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        address: parsed.address || '',
        timestamp: parsed.timestamp || Date.now(),
      };
    } 
    // If it's already an object
    else if (typeof location === 'object') {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
        timestamp: location.timestamp || Date.now(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error converting location data:", error);
    return null;
  }
};

// Helper function to convert database handover session to our HandoverStatus type
const convertDatabaseHandoverToHandoverStatus = (
  data: any
): HandoverStatus | null => {
  if (!data) return null;
  
  return {
    id: data.id,
    booking_id: data.booking_id,
    host_id: data.host_id,
    renter_id: data.renter_id,
    host_ready: !!data.host_ready,
    renter_ready: !!data.renter_ready,
    host_location: convertDatabaseLocationToHandoverLocation(data.host_location),
    renter_location: convertDatabaseLocationToHandoverLocation(data.renter_location),
    handover_completed: !!data.handover_completed,
    handover_type: data.handover_type || null,
    status: data.status || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

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
  const [handoverId, setHandoverId] = useState<string | null>(null);
  const [handoverStatus, setHandoverStatus] = useState<HandoverStatus | null>(null);
  const [isHandoverSessionLoading, setIsHandoverSessionLoading] = useState(false);

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

  // Fetch or create handover session after booking details are loaded
  useEffect(() => {
    const fetchOrCreateHandoverSession = async () => {
      if (!bookingId || !currentUserId || !ownerId || !bookingDetails) {
        console.log("Missing requirements for handover session fetch:", { bookingId, currentUserId, ownerId, hasBookingDetails: !!bookingDetails });
        return;
      }
      
      console.log("Fetching handover session for booking:", bookingId);
      setIsHandoverSessionLoading(true);
      
      try {
        let handoverData = await getHandoverSession(bookingId);
        
        if (!handoverData) {
          console.log("No handover session found, creating one...");
          
          // Get the renter ID from booking details
          if (bookingDetails?.renter?.id) {
            const renterId = bookingDetails.renter.id;
            console.log("Creating handover session with:", { bookingId, hostId: ownerId, renterId });
            
            handoverData = await createHandoverSession(bookingId, ownerId, renterId);
            
            if (handoverData) {
              console.log("Handover session created:", handoverData.id);
            } else {
              throw new Error("Failed to create handover session");
            }
          } else {
            throw new Error("Cannot create handover session: missing renter information");
          }
        }
        
        if (handoverData) {
          console.log("Handover session ready:", handoverData.id);
          setHandoverId(handoverData.id);
          
          // Use our conversion helper to ensure type safety
          const convertedHandoverStatus = convertDatabaseHandoverToHandoverStatus(handoverData);
          setHandoverStatus(convertedHandoverStatus);
        }
      } catch (error) {
        console.error("Error fetching/creating handover session:", error);
        toast.error("Failed to setup handover session");
      } finally {
        setIsHandoverSessionLoading(false);
      }
    };
    
    fetchOrCreateHandoverSession();
  }, [bookingId, currentUserId, ownerId, bookingDetails]);

  // Determine if current user is host or renter
  const isHost = currentUserId === ownerId;

  const [debugMode, setDebugMode] = useState(false);

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  // Implementation of updateLocation function
  const updateLocation = async ({ latitude, longitude, address }: { 
    latitude: number; 
    longitude: number; 
    address: string 
  }) => {
    console.log("updateLocation called with:", { handoverId, currentUserId, isHost, latitude, longitude });
    
    // Check if handover session is still loading
    if (isHandoverSessionLoading) {
      console.log("Handover session still loading, cannot update location");
      toast.error("Handover session is still loading, please wait...");
      return false;
    }
    
    if (!handoverId) {
      console.log("Missing handover session ID");
      toast.error("Handover session not found. Please refresh the page.");
      return false;
    }
    
    if (!currentUserId) {
      console.log("Missing current user ID");
      toast.error("User not authenticated. Please log in again.");
      return false;
    }

    const locationData: HandoverLocation = {
      latitude,
      longitude,
      address,
      timestamp: Date.now()
    };

    console.log("Updating location with data:", locationData);

    try {
      const success = await updateHandoverLocation(
        handoverId,
        currentUserId,
        isHost,
        locationData
      );
      
      if (success) {
        console.log("Location updated successfully");
        toast.success("Location updated successfully");
      } else {
        console.log("Location update failed");
      }
      
      return success;
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
      return false;
    }
  };

  return (
    <HandoverContext.Provider
      value={{
        isLoading: isBookingLoading,
        isHandoverSessionLoading,
        isHost,
        bookingDetails,
        debugMode,
        toggleDebugMode,
        currentUserId,
        destination,
        ownerId,
        updateLocation,
        handoverStatus,
        handoverId,
      }}
    >
      {children}
    </HandoverContext.Provider>
  );
};
