
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { MapContainer } from "@/components/map/MapContainer";
import { useUserLocation } from "@/hooks/useUserLocation";
import { toast } from "sonner";

const Map = () => {
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const { userLocation } = useUserLocation(mapInstance);

  const handleMapLoad = (map: mapboxgl.Map) => {
    setMapInstance(map);
  };

  const handleMapError = (error: Error) => {
    console.error('Map error:', error);
    toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <MapContainer
          initialLatitude={userLocation?.latitude}
          initialLongitude={userLocation?.longitude}
          height="h-[calc(100vh-4rem)]"
          onMapLoad={handleMapLoad}
          onMapError={handleMapError}
        />
      </main>
      <Navigation />
    </div>
  );
};

export default Map;
