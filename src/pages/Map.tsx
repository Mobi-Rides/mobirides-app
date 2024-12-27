import { useRef, useState } from "react";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { VehicleMarker } from "@/components/VehicleMarker";
import { Navigation } from "@/components/Navigation";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useMapInitialization } from "@/hooks/useMapInitialization";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { toast } from "sonner";
import { MapboxConfig } from "@/components/MapboxConfig";
import "mapbox-gl/dist/mapbox-gl.css";

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { token, isLoading: isTokenLoading } = useMapboxToken();
  const [isMapReady, setIsMapReady] = useState(false);

  const handleFiltersChange = (newFilters: FilterType) => {
    console.log("Filters updated:", newFilters);
  };

  const handleGeolocate = () => {
    console.log("Manual location refresh requested");
    toast.info("Updating your location...");
  };

  // Initialize map only after we have the container and token
  const { isMapLoaded } = token && mapContainer.current ? useMapInitialization({
    container: mapContainer.current,
    mapboxToken: token,
    initialLatitude: -24.6282,
    initialLongitude: 25.9231,
    zoom: 12
  }) : { isMapLoaded: false };

  // Update map ready state
  useEffect(() => {
    if (isMapLoaded) {
      setIsMapReady(true);
    }
  }, [isMapLoaded]);

  if (isTokenLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading map configuration...</div>
      </div>
    );
  }

  if (!token) {
    return <MapboxConfig />;
  }

  if (!isMapReady) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Initializing map...</div>
      </div>
    );
  }

  return (
    <div className="h-screen relative">
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchFilters onFiltersChange={handleFiltersChange} />
      </div>
      <div 
        ref={mapContainer} 
        className="w-full h-full"
      />
      <Button
        onClick={handleGeolocate}
        className="absolute bottom-24 right-4 z-10"
        size="icon"
        variant="secondary"
      >
        <Locate className="h-4 w-4" />
      </Button>
      <Navigation />
    </div>
  );
};

export default MapPage;