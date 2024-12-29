import { useRef, useState } from "react";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { Navigation } from "@/components/Navigation";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { MapboxConfig } from "@/components/MapboxConfig";
import { useMapInitialization } from "@/hooks/useMapInitialization";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { toast } from "sonner";
import "mapbox-gl/dist/mapbox-gl.css";

// Gaborone coordinates
const GABORONE_COORDINATES: [number, number] = [25.9231, -24.6282];

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { token, isLoading: isTokenLoading } = useMapboxToken();
  const [isContainerReady, setIsContainerReady] = useState(false);
  
  const { map, isMapReady } = useMapInitialization({
    container: mapContainer.current!,
    initialCenter: GABORONE_COORDINATES,
    mapboxToken: token || '',
    zoom: 12
  });

  // Initialize user location tracking
  useUserLocation(map);

  const handleFiltersChange = (newFilters: FilterType) => {
    console.log("Filters updated:", newFilters);
  };

  const handleGeolocate = () => {
    if (!map) return;
    
    if ("geolocation" in navigator) {
      toast.info("Updating your location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 14,
            essential: true
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Could not get your location. Please check your settings.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

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

  return (
    <div className="h-screen relative">
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchFilters onFiltersChange={handleFiltersChange} />
      </div>
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        onLoad={() => {
          console.log("Map container mounted");
          setIsContainerReady(true);
        }}
      >
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="animate-pulse text-primary">Initializing map...</div>
          </div>
        )}
      </div>
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