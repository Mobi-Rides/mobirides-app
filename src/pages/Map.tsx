import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { MapboxConfig } from "@/components/MapboxConfig";
import { VehicleMarker } from "@/components/VehicleMarker";
import { useMap } from "@/hooks/useMap";
import { useUserLocation } from "@/hooks/useUserLocation";
import type { SearchFilters } from "@/components/SearchFilters";

const Map = () => {
  console.log("MapPage rendering");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "distance",
    sortOrder: "asc"
  });

  const { mapContainer, map, isLoaded, error } = useMap();
  const { userLocation } = useUserLocation(map);

  console.log("User location state:", userLocation);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    console.log("Filters updated:", newFilters);
    setFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    console.log("Search query updated:", query);
    setSearchQuery(query);
  };

  if (error) {
    return <MapboxConfig />;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
      />
      
      <div className="flex-1 relative">
        <div 
          ref={mapContainer} 
          className="absolute inset-0"
          style={{ minHeight: "400px" }}
        >
          {isLoaded && (
            <VehicleMarker
              price={100}
              brand="Example"
              model="Car"
              type="Basic"
              rating={4.5}
              distance="2km"
              latitude={-24.6282}
              longitude={25.9692}
              onClick={() => {}}
            />
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Map;