
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { MapboxConfig } from "@/components/MapboxConfig";
import { HandoverSheet } from "@/components/handover/HandoverSheet";
import { MapMarkers } from "@/components/map/MapMarkers";
import { useMap } from "@/hooks/useMap";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useHostLocation } from "@/hooks/useHostLocation";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { SearchFilters } from "@/components/SearchFilters";

const MapPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "price",
    sortOrder: "asc",
  });
  const [isHandoverSheetOpen, setIsHandoverSheetOpen] = useState(true);
  const [renterDetails, setRenterDetails] = useState({
    renterName: "John Doe",
    renterAvatar: "/placeholder.svg",
    startLocation: {
      address: "123 Main St, City",
      coordinates: { lat: -24.6527, lng: 25.9088 }
    },
    destination: {
      address: "456 Park Ave, City",
      coordinates: { lat: -24.6627, lng: 25.9188 }
    }
  });
  const [isRenterSharingLocation, setIsRenterSharingLocation] = useState(false);

  const bookingId = searchParams.get('bookingId');
  const hostId = searchParams.get('hostId');
  const mode = searchParams.get('mode');

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
  const hostLocation = useHostLocation(map, mode, hostId, bookingId);

  // Handle sheet state changes
  useEffect(() => {
    if (map && isLoaded) {
      setTimeout(() => {
        map.resize();
      }, 300);
    }
  }, [isHandoverSheetOpen, map, isLoaded]);

  if (error) {
    return <MapboxConfig />;
  }

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
        />

        <MapMarkers
          map={map}
          isLoaded={isLoaded}
          hostLocation={hostLocation}
          renterDetails={renterDetails}
        />
      </div>

      <HandoverSheet
        isOpen={isHandoverSheetOpen}
        onClose={() => setIsHandoverSheetOpen(false)}
        bookingDetails={renterDetails}
        isRenterSharingLocation={isRenterSharingLocation}
      />

      <Navigation />
    </div>
  );
};

export default MapPage;
