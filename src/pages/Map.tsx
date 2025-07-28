import { useCallback, useEffect, useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";

const Map = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const bookingId = searchParams.get("bookingId");
  const { user } = useAuth();

  const [mapToken, setMapToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [onlineHosts, setOnlineHosts] = useState([]);
  const [isHandoverSheetOpen, setIsHandoverSheetOpen] = useState(false);
  const [destination, setDestination] = useState({
    latitude: null,
    longitude: null,
  });
  const { theme } = useTheme();

  const isHandoverMode = Boolean(mode === "handover" && bookingId);
  const [hostId, setHostId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const getDestination = useCallback((latitude: number, longitude: number) => {
    console.log("Setting destination", latitude, longitude);
    setDestination({ latitude, longitude });
  }, []);

  const getHostID = useCallback((hostId: string) => {
    console.log("Handover host", hostId);
    setHostId(hostId);
  }, []);

  const toggleIsOwner = useCallback((isHost: boolean) => {
    console.log("Is user host?", isHost);
    setIsHost(isHost);
  }, []);

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
      const getHandoverHost = hostId ? await fetchHostById(hostId) : null;
      if (!onlineHosts.length) {
        toast.info("No hosts are currently online");
      }

      if (hostId && getHandoverHost) {
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
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-muted/20 dark:bg-gray-800/20">
          <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">
            Loading map...
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

  // Only load handover functionality for authenticated users
  const shouldLoadHandover = !!user;

  const content = (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 relative overflow-hidden">
        {renderContent()}
        {shouldLoadHandover && (
          <ErrorBoundary fallback={null}>
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
          </ErrorBoundary>
        )}
      </main>
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