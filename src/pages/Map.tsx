import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import CustomMapbox from "@/components/map/CustomMapbox";
import { getMapboxToken } from "../utils/mapbox";
import { toast } from "@/utils/toast-utils";
import { BarLoader } from "react-spinners";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchHostById, fetchOnlineHosts } from "@/services/hostService";
import { HandoverProvider } from "@/contexts/HandoverContext";
import { EnhancedHandoverSheet } from "@/components/handover/EnhancedHandoverSheet";
import { HandoverBookingButtons } from "@/components/map/HandoverBookingButtons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HandoverErrorBoundary } from "@/components/handover/HandoverErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Map = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const bookingId = searchParams.get("bookingId");
  const { user } = useAuth();

  const [mapToken, setMapToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [onlineHosts, setOnlineHosts] = useState([]);
  const [isHandoverSheetOpen, setIsHandoverSheetOpen] = useState(false);
  const [destination] = useState({
    latitude: null,
    longitude: null,
  });
  const { theme } = useTheme();

  const [isHandoverMode, setIsHandoverMode] = useState(false);
  const [isValidatingHandover, setIsValidatingHandover] = useState(false);
  const [hostId] = useState<string | null>(null);

  // Validate booking for handover mode
  const validateBooking = async (bookingId: string) => {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          id, 
          status, 
          start_date, 
          end_date, 
          renter_id,
          cars!inner (
            owner_id
          )
        `)
        .eq('id', bookingId)
        .eq('status', 'confirmed')
        .single();

      if (error || !booking) {
        console.log('Booking not found or not confirmed:', bookingId);
        return false;
      }

      // Check if user has permission to access this booking
      const hostId = booking.cars?.owner_id;
      if (!user || (user.id !== booking.renter_id && user.id !== hostId)) {
        console.log('User does not have permission to access booking:', bookingId);
        return false;
      }

      // Check if booking is eligible for handover today
      const today = new Date().toISOString().split('T')[0];
      const isStartDate = booking.start_date === today;
      const isEndDate = booking.end_date === today;

      if (!isStartDate && !isEndDate) {
        console.log('Booking is not eligible for handover today:', bookingId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating booking:', error);
      return false;
    }
  };

  // Handle handover mode detection and validation
  useEffect(() => {
    const handleHandoverMode = async () => {
      const hasHandoverParams = mode === "handover" && bookingId;
      
      if (!hasHandoverParams) {
        setIsHandoverMode(false);
        return;
      }

      if (!user) {
        // Wait for user to be loaded
        return;
      }

      setIsValidatingHandover(true);
      
      const isValid = await validateBooking(bookingId);
      
      if (!isValid) {
        // Clear URL parameters and fall back to standard map mode
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('mode');
        currentUrl.searchParams.delete('bookingId');
        window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
        
        toast.info("Invalid handover request - showing standard map");
        setIsHandoverMode(false);
      } else {
        setIsHandoverMode(true);
      }
      
      setIsValidatingHandover(false);
    };

    handleHandoverMode();
  }, [mode, bookingId, user]);

  useEffect(() => {
    // Open handover sheet automatically in handover mode, but only once
    if (isHandoverMode && !isHandoverSheetOpen) {
      setIsHandoverSheetOpen(true);
    }
  }, [isHandoverMode]);

  useEffect(() => {
    //subscribe to the map token
    const fetchToken = async () => {
      setIsLoading(true);
      try {
        const token = await getMapboxToken();
        if (!token) {
          toast.error("Failed to get the map token");
          console.error("Failed to get the map token");
          return;
        }
        setMapToken(token);
      } catch (error) {
        console.error("Error getting the map token:", error);
        toast.error("Failed to get the map token");
      } finally {
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

  // get host locations
  const fetchHostLocations = async () => {
    console.log("Fetching host locations...");

    try {
      const onlineHosts = await fetchOnlineHosts();
      const getHandoverHost = await fetchHostById(hostId);
      if (!onlineHosts.length) {
        toast.info("No hosts are currently online");
      }

      if (hostId) {
        return setOnlineHosts([getHandoverHost]);
      }

      console.log("Host locations", onlineHosts);
      setOnlineHosts(onlineHosts);
    } catch (error) {
      console.error("Error fetching host locations:", error);
      toast.error("Failed to fetch host locations");
    }
  };

  useEffect(() => {
    if (!isHandoverMode) {
      fetchHostLocations();
      console.log("Location", destination);
    }
  }, [isHandoverMode]);

  // Map style based on theme
  const getMapStyle = () => {
    if (theme === "dark") {
      return "mapbox://styles/mapbox/navigation-night-v1";
    }
    return "mapbox://styles/mapbox/navigation-day-v1";
  };

  const renderContent = () => {
    if (isLoading || isValidatingHandover) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-muted/20 dark:bg-gray-800/20">
          <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">
            {isValidatingHandover ? "Validating handover..." : "Loading map..."}
          </p>
          <BarLoader color="#7c3aed" width={100} />
        </div>
      );
    }

    if (!mapToken) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-muted/20 dark:bg-gray-800/20">
          <p className="text-sm text-destructive font-medium">
            Could not load the map
          </p>
          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
            Please check your connection
          </p>
        </div>
      );
    }

    return (
      <CustomMapbox
        mapbox_token={mapToken}
        longitude={25.90859}
        latitude={-24.65451}
        onlineHosts={isHandoverMode ? [] : onlineHosts}
        mapStyle={getMapStyle()}
        isHandoverMode={isHandoverMode}
        bookingId={bookingId}
        dpad={true}
        locationToggle={true}
        destination={destination}
      />
    );
  };

  // Only load handover functionality when actually in handover mode
  const shouldLoadHandover = !!user && isHandoverMode;

  const content = (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 relative overflow-hidden">
        {renderContent()}
        {shouldLoadHandover && (
          <HandoverErrorBoundary>
            <HandoverBookingButtons 
              onBookingClick={(clickedBookingId, handoverType) => {
                console.log("Map received booking click for:", clickedBookingId, "type:", handoverType);
                console.log("Current booking ID from URL:", bookingId);
                console.log("Current handover sheet state:", isHandoverSheetOpen);
                
                if (handoverType === 'return') {
                  // Navigate to rental details page for return handovers
                  window.location.href = `/rental-details/${clickedBookingId}`;
                  return;
                }
                
                // For pickup handovers, open the handover sheet
                // Update the current booking ID if different from URL
                if (clickedBookingId !== bookingId) {
                  console.log("Updating URL with new booking ID");
                  window.history.replaceState(
                    {}, 
                    '', 
                    `/map?mode=handover&bookingId=${clickedBookingId}`
                  );
                }
                console.log("Opening handover sheet");
                setIsHandoverSheetOpen(true);
              }}
            />
            <EnhancedHandoverSheet
              isOpen={isHandoverSheetOpen}
              onClose={() => {
                setIsHandoverSheetOpen(false);
                // Clear URL parameters when closing
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.delete('mode');
                currentUrl.searchParams.delete('bookingId');
                window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
              }}
              bookingId={bookingId || ""}
            />
          </HandoverErrorBoundary>
        )}
      </main>
      <Navigation />
    </div>
  );

  return (
    <ErrorBoundary>
      {shouldLoadHandover ? (
        <HandoverProvider>
          {content}
        </HandoverProvider>
      ) : (
        content
      )}
    </ErrorBoundary>
  );
};

export default Map;