
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { MapboxConfig } from "@/components/MapboxConfig";
import { VehicleMarker } from "@/components/VehicleMarker";
import { useMap } from "@/hooks/useMap";
import { useUserLocation } from "@/hooks/useUserLocation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Car } from "@/types/car";
import type { SearchFilters } from "@/components/SearchFilters";

const MapPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [hostLocation, setHostLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "distance",
    sortOrder: "asc"
  });

  // Get URL parameters
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

  // Subscribe to host's car location updates if in handover mode
  useEffect(() => {
    if (!map || !mode || mode !== 'handover' || !hostId || !bookingId) return;

    console.log("Setting up location subscription for host:", hostId);

    const subscription = supabase
      .from('cars')
      .select('latitude, longitude')
      .eq('owner_id', hostId)
      .subscribe((payload) => {
        console.log("Received host location update:", payload);
        if (payload.new && payload.new.latitude && payload.new.longitude) {
          setHostLocation({
            lat: payload.new.latitude,
            lng: payload.new.longitude
          });

          // Center map on host location
          map.flyTo({
            center: [payload.new.longitude, payload.new.latitude],
            zoom: 14
          });
        }
      });

    return () => {
      console.log("Cleaning up host location subscription");
      subscription.unsubscribe();
    };
  }, [map, mode, hostId, bookingId]);

  // Update map view when locations change
  useEffect(() => {
    if (!map || !isLoaded) return;

    if (hostLocation) {
      console.log("Updating host marker position:", hostLocation);
      // Add or update host marker
      const hostMarker = document.createElement('div');
      hostMarker.className = 'host-marker';
      hostMarker.innerHTML = `
        <div class="bg-primary text-white p-2 rounded-full shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.7 0-1.4.3-1.8.8L2 9.1V15c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
      `;

      new mapboxgl.Marker({ element: hostMarker })
        .setLngLat([hostLocation.lng, hostLocation.lat])
        .addTo(map);
    }

    if (userLocation) {
      console.log("Updating user marker position:", userLocation);
      // Add or update user marker
      const userMarker = document.createElement('div');
      userMarker.className = 'user-marker';
      userMarker.innerHTML = `
        <div class="bg-blue-500 text-white p-2 rounded-full shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
        </div>
      `;

      new mapboxgl.Marker({ element: userMarker })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);

      // Fit bounds to include both markers if both exist
      if (hostLocation) {
        const bounds = new mapboxgl.LngLatBounds()
          .extend([hostLocation.lng, hostLocation.lat])
          .extend([userLocation.longitude, userLocation.latitude]);

        map.fitBounds(bounds, {
          padding: 100,
          maxZoom: 15
        });
      }
    }
  }, [map, isLoaded, hostLocation, userLocation]);

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
      </div>

      <Navigation />
    </div>
  );
};

export default MapPage;
