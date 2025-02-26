
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { MapContainer } from "@/components/map/MapContainer";
import { useUserLocation } from "@/hooks/useUserLocation";
import { toast } from "sonner";

const Map = () => {
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const { userLocation } = useUserLocation(mapInstance);

  // Default coordinates for initial map render
  const defaultCoords = {
    latitude: -24.6282,
    longitude: 25.9692
  };

  const handleMapLoad = (map: mapboxgl.Map) => {
    console.log('[Map] Map loaded, setting map instance');
    setMapInstance(map);
  };

  const handleMapError = (error: Error) => {
    console.error('[Map] Map error:', error);
    toast.error(error.message);
  };

  // Effect to update map center when user location is available
  useEffect(() => {
    if (mapInstance && userLocation) {
      console.log('[Map] User location available, updating map center');
      mapInstance.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
        essential: true
      });
    }
  }, [mapInstance, userLocation]);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <MapContainer
          initialLatitude={defaultCoords.latitude}
          initialLongitude={defaultCoords.longitude}
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
