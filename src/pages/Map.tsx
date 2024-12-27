import { useRef } from "react";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { VehicleMarker } from "@/components/VehicleMarker";
import { Navigation } from "@/components/Navigation";
import { MapboxConfig } from "@/components/MapboxConfig";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useMapLocation } from "@/hooks/useMapLocation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { toast } from "sonner";
import "mapbox-gl/dist/mapbox-gl.css";

// Default to a central location (can be adjusted as needed)
const DEFAULT_LATITUDE = 0;
const DEFAULT_LONGITUDE = 0;

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { token, isLoading } = useMapboxToken();
  
  const { map } = useMapLocation({ 
    initialLatitude: DEFAULT_LATITUDE,
    initialLongitude: DEFAULT_LONGITUDE,
    mapboxToken: token,
    isAdjusting: false
  });

  // Initialize continuous user location tracking
  const { refreshLocation } = useUserLocation(map, true);

  const handleFiltersChange = (newFilters: FilterType) => {
    console.log("Filters updated:", newFilters);
  };

  const handleGeolocate = () => {
    console.log("Manual location refresh requested with forced centering");
    refreshLocation(true);
    toast.info("Updating your location...");
  };

  if (isLoading) {
    return <div>Loading map configuration...</div>;
  }

  if (!token) {
    return <MapboxConfig />;
  }

  return (
    <div className="h-screen relative">
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchFilters onFiltersChange={handleFiltersChange} />
      </div>
      <div 
        ref={mapContainer} 
        id="map"
        className="w-full h-full"
        style={{ position: 'relative' }}
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