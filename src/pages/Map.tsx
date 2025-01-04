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

  const { token, isLoading: isTokenLoading, error: tokenError } = useMapboxToken();
  
  const { map, isMapReady, containerRef } = useMapInitialization({
    container: mapContainerRef.current,
    initialCenter: [25.9692, -24.6282],
    zoom: 12,
    mapboxToken: token || ""
  });

  // Initialize user location tracking when map is ready
  const { userLocation, error: locationError } = useUserLocation(isMapReady ? map : null);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    console.log("Filters updated:", newFilters);
    setFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    console.log("Search query updated:", query);
    setSearchQuery(query);
  };

  const handleCarClick = (car: Car) => {
    navigate(`/cars/${car.id}`);
  };

  // Handle loading and error states
  if (isTokenLoading) {
    return <div>Loading map configuration...</div>;
  }

  if (tokenError || locationError) {
    return <div>Error: {tokenError || locationError}</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
      />
      
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0">
          {!token && <MapboxConfig />}
          {isMapReady && map && userLocation && (
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