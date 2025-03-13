import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import CustomMapbox from "@/components/map/CustomMapbox";
import { getMapboxToken } from "../utils/mapbox";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchOnlineHosts } from "@/services/hostService";
import { set } from "date-fns";

const Map = () => {
  const [mapToken, setMapToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [onlineHosts, setOnlineHosts] = useState([]);
  const { theme } = useTheme();

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
    const onlineHosts = await fetchOnlineHosts();
    if (!onlineHosts.length) {
      toast.info("No hosts are currently online");
    }

    console.log("Host locations", onlineHosts);

    setOnlineHosts(onlineHosts);
  };

  useEffect(() => {
    fetchHostLocations();
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <main className="pb-16">
        <div className="h-[calc(100vh-4rem)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full w-full bg-muted/20 dark:bg-gray-800/20">
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">
                Loading map...
              </p>
              <BarLoader color="#7c3aed" width={100} />
            </div>
          ) : mapToken ? (
            <CustomMapbox
              mapbox_token={mapToken}
              longitude={25.90859}
              latitude={-24.65451}
              onlineHosts={onlineHosts}
              mapStyle={
                theme === "dark"
                  ? "mapbox://styles/mapbox/dark-v11"
                  : "mapbox://styles/mapbox/light-v11"
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full bg-muted/20 dark:bg-gray-800/20">
              <p className="text-sm text-destructive font-medium">
                Could not load the map
              </p>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                Please check your connection
              </p>
            </div>
          )}
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Map;
