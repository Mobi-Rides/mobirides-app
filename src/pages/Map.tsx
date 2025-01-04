import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { MapboxConfig } from "@/components/MapboxConfig";
import { VehicleMarker } from "@/components/VehicleMarker";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useMapInitialization } from "@/hooks/useMapInitialization";
import { useUserLocation } from "@/hooks/useUserLocation";
import type { Car } from "@/types/car";
import type { SearchFilters } from "@/components/SearchFilters";

const MapPage = () => {
  console.log("MapPage rendering");
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "distance",
    sortOrder: "asc"
  });

  console.log("MapPage container dimensions:", {
    width: mapContainerRef.current?.offsetWidth,
    height: mapContainerRef.current?.offsetHeight
  });

  const { token, isLoading: isTokenLoading, error: tokenError } = useMapboxToken();
  console.log("Mapbox token status:", { 
    hasToken: !!token, 
    isLoading: isTokenLoading, 
    error: tokenError 
  });
  
  const { map, isMapReady } = useMapInitialization({
    container: mapContainerRef.current,
    initialCenter: [25.9692, -24.6282], // Gaborone coordinates
    zoom: 12,
    mapboxToken: token || ""
  });

  console.log("Map initialization status:", { 
    hasMap: !!map, 
    isMapReady 
  });

  const { userLocation, error: locationError } = useUserLocation(isMapReady ? map : null);
  console.log("User location status:", { 
    hasLocation: !!userLocation, 
    error: locationError 
  });

  const handleFiltersChange = (newFilters: SearchFilters) => {
    console.log("Filters updated:", newFilters);
    setFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    console.log("Search query updated:", query);
    setSearchQuery(query);
  };

  const handleCarClick = (car: Car) => {
    console.log("Car clicked:", car.id);
    navigate(`/cars/${car.id}`);
  };

  if (isTokenLoading) {
    console.log("Showing loading state");
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading map configuration...</div>
      </div>
    );
  }

  if (tokenError) {
    console.error("Token error:", tokenError);
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg text-red-500">Error loading map: {tokenError}</div>
      </div>
    );
  }

  console.log("Rendering map page with container");
  return (
    <div className="h-screen flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
      />
      
      {!token && <MapboxConfig />}
      
      <div className="flex-1 relative">
        <div 
          ref={mapContainerRef} 
          className="absolute inset-0"
          style={{ minHeight: "400px" }}
        >
          {isMapReady && userLocation && (
            <VehicleMarker
              price={100}
              brand="Example"
              model="Car"
              type="Basic"
              rating={4.5}
              distance="2km"
              latitude={userLocation.latitude}
              longitude={userLocation.longitude}
              onClick={() => {}}
            />
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default MapPage;