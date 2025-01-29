import { useState } from "react";
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

  const handleSearchChange = (query: string) => {
    console.log("Search query updated:", query);
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    try {
      const serializedFilters = JSON.parse(JSON.stringify(newFilters));
      console.log("Filters updated:", serializedFilters);
      setFilters(serializedFilters);
    } catch (error) {
      console.error("Error serializing filters:", error);
    }
  };

  const handleCarClick = (carId: string) => {
    try {
      console.log("Car clicked, navigating to:", carId);
      navigate(`/cars/${carId}`);
    } catch (error) {
      console.error("Error handling car click:", error);
    }
  };

  const { mapContainer, map, isLoaded, error } = useMap({
    onMapClick: (e) => {
      try {
        const coordinates = {
          lat: e.lat,
          lng: e.lng
        };
        console.log("Map clicked at:", coordinates);
      } catch (error) {
        console.error("Error handling map click:", error);
      }
    }
  });

  const { userLocation } = useUserLocation(map);

  if (error) {
    return <MapboxConfig />;
  }

  const exampleCar: Car = {
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
  };

  return (
    <div className="h-screen flex flex-col pb-[50px]">
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
              price={exampleCar.price_per_day}
              brand={exampleCar.brand}
              model={exampleCar.model}
              type={exampleCar.vehicle_type}
              rating={4.5}
              distance="2km"
              latitude={exampleCar.latitude}
              longitude={exampleCar.longitude}
              onClick={() => handleCarClick(exampleCar.id)}
            />
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default MapPage;