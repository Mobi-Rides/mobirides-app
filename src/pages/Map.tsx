
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { MapboxConfig } from "@/components/MapboxConfig";
import { HandoverSheet } from "@/components/handover/HandoverSheet";
import { MapMarkers } from "@/components/map/MapMarkers";
import { useMap } from "@/hooks/useMap";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useHostLocation } from "@/hooks/useHostLocation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMapboxToken } from "@/components/MapboxConfig";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { SearchFilters } from "@/components/SearchFilters";

const MapPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await getMapboxToken();
      setHasToken(!!token);
    };
    checkToken();
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "price",
    sortOrder: "asc",
  });

  const handleSearchChange = useCallback((query: string) => {
    console.log("Search query updated:", query);
    setSearchQuery(query);
  }, []);

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    try {
      const serializedFilters = JSON.parse(JSON.stringify(newFilters));
      console.log("Filters updated:", serializedFilters);
      setFilters(serializedFilters);
    } catch (error) {
      console.error("Error serializing filters:", error);
    }
  }, []);

  const [renterDetails] = useState({
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
  const [isRenterSharingLocation] = useState(false);

  const bookingId = searchParams.get('bookingId');
  const hostId = searchParams.get('hostId');
  const mode = searchParams.get('mode');

  const { data: handoverStatus } = useQuery({
    queryKey: ['handover-status', bookingId],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !bookingId) return null;

        const { data: booking, error } = await supabase
          .from('bookings')
          .select(`
            *,
            cars (
              owner_id
            ),
            renter:profiles!renter_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('id', bookingId)
          .single();

        if (error) throw error;

        const isHost = booking.cars.owner_id === user.id;
        const isRenter = booking.renter_id === user.id;
        const isHandoverMode = mode === 'handover';

        return {
          shouldShowSheet: (isHost || isRenter) && isHandoverMode,
          booking,
          currentUserRole: isHost ? 'host' : isRenter ? 'renter' : null
        };
      } catch (error) {
        console.error('Error fetching handover status:', error);
        return null;
      }
    },
    enabled: !!bookingId
  });

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

  // Ensure map is properly initialized and sized
  useEffect(() => {
    if (!map || !isLoaded) return;

    const initializeMap = () => {
      try {
        console.log("Initializing map with resize");
        map.resize();
        setMapInitialized(true);
      } catch (error) {
        console.error("Error during map initialization:", error);
      }
    };

    // Initial initialization
    const timeoutId = setTimeout(initializeMap, 100);

    // Handle window resize
    window.addEventListener('resize', initializeMap);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', initializeMap);
      setMapInitialized(false);
    };
  }, [map, isLoaded]);

  // Handle sheet visibility changes
  useEffect(() => {
    if (map && isLoaded && mapInitialized) {
      console.log("Handling sheet visibility change");
      map.resize();
    }
  }, [map, isLoaded, mapInitialized, handoverStatus?.shouldShowSheet]);

  if (!hasToken || error) {
    return <MapboxConfig />;
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
      />
      
      <main className="flex-1 relative w-full overflow-hidden" style={{ height: 'calc(100% - 64px)' }}>
        <div 
          ref={mapContainer} 
          className="absolute inset-0 w-full h-full"
          style={{
            visibility: isLoaded && mapInitialized ? 'visible' : 'hidden',
            zIndex: 0
          }}
        />

        {isLoaded && mapInitialized && (
          <MapMarkers
            map={map}
            isLoaded={isLoaded}
            hostLocation={hostLocation}
            renterDetails={renterDetails}
          />
        )}

        {handoverStatus?.shouldShowSheet && (
          <HandoverSheet
            isOpen={true}
            onClose={() => navigate(-1)}
            bookingDetails={{
              renterName: handoverStatus.booking.renter.full_name,
              renterAvatar: handoverStatus.booking.renter.avatar_url || "/placeholder.svg",
              startLocation: renterDetails.startLocation,
              destination: renterDetails.destination
            }}
            isRenterSharingLocation={isRenterSharingLocation}
          />
        )}
      </main>

      <Navigation />
    </div>
  );
};

export default MapPage;
