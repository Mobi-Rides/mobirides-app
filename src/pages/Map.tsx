
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import CustomMapbox from "@/components/map/CustomMapbox";
import { getMapboxToken } from "../utils/mapbox";
import { toast } from "sonner";
import { locationStateManager } from "@/utils/mapbox/location/LocationStateManager";
import { getNearbyLocations } from "@/services/locationService";
import { Button } from "@/components/ui/button";
import { MapIcon, UserIcon } from "lucide-react";

interface NearbyUser {
  userId: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

const Map = () => {
  const [mapToken, setMapToken] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);

  useEffect(() => {
    // Subscribe to location updates
    const handleLocationUpdate = (event: any) => {
      if (event.type === "locationUpdate" && event.payload.latitude) {
        setUserLocation({
          latitude: event.payload.latitude,
          longitude: event.payload.longitude
        });
        
        // Fetch nearby users when our location updates
        fetchNearbyUsers(event.payload.latitude, event.payload.longitude);
      }
    };
    
    const eventSubscriber = {
      onEvent: handleLocationUpdate
    };
    
    import("@/utils/mapbox/core/eventBus").then(({ eventBus }) => {
      eventBus.subscribe(eventSubscriber);
    });
    
    // Check current tracking state
    import("@/utils/mapbox/location/LocationStateManager").then(({ locationStateManager }) => {
      setIsTrackingEnabled(locationStateManager.getCurrentState() === 'enabled');
    });
    
    return () => {
      import("@/utils/mapbox/core/eventBus").then(({ eventBus }) => {
        eventBus.unsubscribe(eventSubscriber);
      });
    };
  }, []);

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
  
  const fetchNearbyUsers = async (latitude: number, longitude: number) => {
    try {
      const nearby = await getNearbyLocations(latitude, longitude, 5);
      setNearbyUsers(nearby);
    } catch (error) {
      console.error("Error fetching nearby users:", error);
    }
  };
  
  const toggleLocationTracking = async () => {
    if (isTrackingEnabled) {
      locationStateManager.disableTracking();
      setIsTrackingEnabled(false);
    } else {
      const success = await locationStateManager.enableTracking();
      setIsTrackingEnabled(success);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="h-[calc(100vh-4rem)] relative">
          {mapToken ? (
            <CustomMapbox
              mapbox_token={mapToken}
              longitude={userLocation?.longitude || 25.90859}
              latitude={userLocation?.latitude || -24.65451}
              nearbyUsers={nearbyUsers}
            />
          ) : (
            <div className="w-full h-full rounded-lg overflow-hidden" />
          )}
          
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            <Button 
              onClick={toggleLocationTracking}
              variant={isTrackingEnabled ? "destructive" : "default"}
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
            >
              {isTrackingEnabled ? (
                <UserIcon className="h-6 w-6" />
              ) : (
                <MapIcon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Map;
