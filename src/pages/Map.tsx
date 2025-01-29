import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { MapboxConfig } from "@/components/MapboxConfig";
import { VehicleMarker } from "@/components/VehicleMarker";
import { useMap } from "@/hooks/useMap";
import { useUserLocation } from "@/hooks/useUserLocation";
import type { Car } from "@/types/car";
import type { SearchFilters } from "@/components/SearchFilters";

const MapPage = () => {
  console.log("MapPage rendering");
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "distance",
    sortOrder: "asc"
  });

  // Create serializable versions of handlers
  const handleFiltersChange = (newFilters: SearchFilters) => {
    console.log("Filters updated:", JSON.parse(JSON.stringify(newFilters)));
    setFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    console.log("Search query updated:", query);
    setSearchQuery(query);
  };

  const handleCarClick = (car: Car) => {
    const carId = car.id;
    console.log("Car clicked:", carId);
    navigate(`/cars/${carId}`);
  };

  // Initialize map with error handling
  const { mapContainer, map, isLoaded, error } = useMap({
    onMapClick: (e) => {
      console.log("Map clicked at:", {
        lat: e.lat,
        lng: e.lng
      });
    }
  });

  // Get user location with serializable data handling
  const { userLocation } = useUserLocation(map);

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
              onClick={() => {
                handleCarClick({
                  id: "example-car",
                  brand: "Example",
                  model: "Car",
                  owner_id: "example-owner",
                  price_per_day: 100,
                  vehicle_type: "Basic",
                  year: 2024,
                  transmission: "automatic",
                  fuel: "petrol",
                  seats: 5,
                  location: "Example Location",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  description: null,
                  image_url: null,
                  is_available: true,
                  latitude: -24.6282,
                  longitude: 25.9692,
                  registration_url: null,
                  insurance_url: null,
                  additional_docs_urls: null
                });
              }}
            />
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default MapPage;