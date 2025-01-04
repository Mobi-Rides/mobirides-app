import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { MapboxConfig } from "@/components/MapboxConfig";
import { VehicleMarker } from "@/components/VehicleMarker";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useMapInitialization } from "@/hooks/useMapInitialization";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useMarkerManagement } from "@/hooks/useMarkerManagement";
import type { Car } from "@/types/car";
import type { SearchFilters as FilterType } from "@/components/SearchFilters";

const MapPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterType>({
    priceRange: [0, 1000],
    brands: [],
    vehicleTypes: [],
    transmission: "all",
    fuel: "all",
  });

  const { token, isLoading: isTokenLoading, error: tokenError } = useMapboxToken();
  
  const {
    map,
    mapContainer,
    isMapReady,
    error: mapError,
  } = useMapInitialization({
    token,
    initialState: {
      lng: 25.9692,
      lat: -24.6282,
      zoom: 12
    }
  });

  // Initialize user location tracking when map is ready
  const { userLocation, locationError } = useUserLocation(isMapReady ? map : null);

  const handleFiltersChange = (newFilters: FilterType) => {
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

  if (tokenError || mapError || locationError) {
    return <div>Error: {tokenError || mapError || locationError}</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
      />
      
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0">
          <MapboxConfig />
          {isMapReady && map && (
            <VehicleMarker
              map={map}
              filters={filters}
              searchQuery={searchQuery}
              onCarClick={handleCarClick}
            />
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default MapPage;