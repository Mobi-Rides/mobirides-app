import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import CustomMapbox from "@/components/map/CustomMapbox";
import { getMapboxToken } from "../utils/mapbox";
import { toast } from "sonner";

const Map = () => {
  const [mapToken, setMapToken] = useState<string>("");

  useEffect(() => {
    //subscribe to the map token
    
    const fetchToken = async () => {
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
      }
    };
    fetchToken();
  }, []);

  //ge active host & carlocation
  


  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="h-[calc(100vh-4rem)]">
          {mapToken ? (
            <CustomMapbox
              mapbox_token={mapToken}
              longitude={25.90859}
              latitude={-24.65451}
            />
          ) : (
            <div className="w-full h-full rounded-lg overflow-hidden" />
          )}
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Map;
