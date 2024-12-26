import { useRef } from "react";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { VehicleMarker } from "@/components/VehicleMarker";
import { Navigation } from "@/components/Navigation";
import { MapboxConfig, useMapboxToken } from "@/components/MapboxConfig";
import { useMapInitialization } from "@/hooks/useMapInitialization";
import { useUserLocation } from "@/hooks/useUserLocation";
import "mapbox-gl/dist/mapbox-gl.css";

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapboxToken = useMapboxToken();
  const mapInstanceRef = useMapInitialization(mapContainer, mapboxToken);

  // Initialize user location after map is ready
  useUserLocation(mapInstanceRef.current);

  const handleFiltersChange = (newFilters: FilterType) => {
    console.log("Filters updated:", newFilters);
  };

  if (!mapboxToken) {
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
        style={{ position: 'relative' }} // This can help with certain rendering issues
      />
      <Navigation />
    </div>
  );
};

export default MapPage;