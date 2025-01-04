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
  
  const { map, isMapReady } = useMapInitialization({
    container: mapContainerRef.current,
    initialCenter: [25.9692, -24.6282], // Gaborone coordinates
    zoom: 12,
    mapboxToken: token || ""
  });

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

  if (isTokenLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading map configuration...</div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg text-red-500">Error loading map: {tokenError}</div>
      </div>
    );
  }

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
          style={{ minHeight: "400px" }} // Ensure minimum height
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