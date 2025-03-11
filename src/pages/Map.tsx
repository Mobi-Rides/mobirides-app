import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import CustomMapbox from "@/components/map/CustomMapbox";
import { getMapboxToken } from "../utils/mapbox";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";

const Map = () => {
  const [mapToken, setMapToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="h-[calc(100vh-4rem)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full w-full bg-muted/20">
              <p className="text-sm text-muted-foreground mb-3">
                Loading map...
              </p>
              <BarLoader color="#7c3aed" width={100} />
            </div>
          ) : mapToken ? (
            <CustomMapbox
              mapbox_token={mapToken}
              longitude={25.90859}
              latitude={-24.65451}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full bg-muted/20">
              <p className="text-sm text-destructive font-medium">
                Could not load the map
              </p>
              <p className="text-xs text-muted-foreground mt-1">
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
