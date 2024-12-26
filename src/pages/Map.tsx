import { useRef } from "react";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { VehicleMarker } from "@/components/VehicleMarker";
import { Navigation } from "@/components/Navigation";
import { MapboxConfig } from "@/components/MapboxConfig";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useMapInitialization } from "@/hooks/useMapInitialization";
import { useUserLocation } from "@/hooks/useUserLocation";
import "mapbox-gl/dist/mapbox-gl.css";

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { token, isLoading } = useMapboxToken();
  const mapInstanceRef = useMapInitialization(mapContainer, token);

  // Initialize user location after map is ready
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