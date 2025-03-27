import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import CustomMapbox from "@/components/map/CustomMapbox";
import { getMapboxToken } from "../utils/mapbox";
import { toast } from "@/utils/toast-utils";
import { BarLoader } from "react-spinners";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchOnlineHosts } from "@/services/hostService";
import { HandoverProvider } from "@/contexts/HandoverContext";
import { HandoverSheet } from "@/components/handover/HandoverSheet";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const Map = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const bookingId = searchParams.get("bookingId");

  const [mapToken, setMapToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [onlineHosts, setOnlineHosts] = useState([]);
  const [isHandoverSheetOpen, setIsHandoverSheetOpen] = useState(false);
  const { theme } = useTheme();

  const isHandoverMode = Boolean(mode === "handover" && bookingId);

  useEffect(() => {
    // Open handover sheet automatically in handover mode
    if (isHandoverMode) {
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
      if (!onlineHosts.length) {
        toast.info("No hosts are currently online");
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
        locationToggle={true }
      />
    );
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      {isHandoverMode ? (
        <HandoverProvider>
          <main className="pb-16">
            <div className="h-[calc(100vh-4rem)]">{renderContent()}</div>
            <div className="fixed bottom-20 left-0 right-0 z-10 flex justify-center">
              <Button
                className="shadow-lg"
                onClick={() => setIsHandoverSheetOpen(true)}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Handover Details
              </Button>
            </div>
          </main>
          <HandoverSheet
            isOpen={isHandoverSheetOpen}
            onClose={() => setIsHandoverSheetOpen(false)}
          />
          <Navigation />
        </HandoverProvider>
      ) : (
        <>
          <main className="pb-16">
            <div className="h-[calc(100vh-4rem)]">{renderContent()}</div>
          </main>
          <Navigation />
        </>
      )}
    </div>
  );
};

export default Map;
