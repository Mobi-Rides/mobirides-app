import { useRef, useEffect } from "react";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { VehicleMarker } from "@/components/VehicleMarker";
import { Navigation } from "@/components/Navigation";
import { MapboxConfig } from "@/components/MapboxConfig";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useMapInitialization } from "@/hooks/useMapInitialization";
import { useUserLocation } from "@/hooks/useUserLocation";
import { toast } from "sonner";
import "mapbox-gl/dist/mapbox-gl.css";

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { token, isLoading } = useMapboxToken();
  const mapInstanceRef = useMapInitialization(mapContainer, token);

  // Request user location permission when component mounts
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Initial position obtained:", position.coords);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
              essential: true
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get your location. Please enable location services.");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.log("Geolocation not supported");
      toast.error("Location services are not supported by your browser");
    }
  }, [mapInstanceRef.current]);

  // Initialize continuous user location tracking
  useUserLocation(mapInstanceRef.current);

  const handleFiltersChange = (newFilters: FilterType) => {
    console.log("Filters updated:", newFilters);
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
        className="w-full h-full"
        style={{ position: 'relative' }}
      />
      <Navigation />
    </div>
  );
};

export default MapPage;