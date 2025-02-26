
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
import { toast } from "sonner";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { SearchFilters } from "@/components/SearchFilters";

const MapPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isTokenLoading, setIsTokenLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        setIsTokenLoading(true);
        const token = await getMapboxToken();
        setHasToken(!!token);
      } catch (error) {
        console.error('Error checking token:', error);
        toast.error("Failed to initialize map configuration");
      } finally {
        setIsTokenLoading(false);
      }
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

  useEffect(() => {
    if (map && isLoaded && !mapInitialized) {
      try {
        console.log("Initializing map");
        map.resize();
        setMapInitialized(true);
      } catch (error) {
        console.error("Error during map initialization:", error);
        toast.error("Error initializing map display");
      }
    }
  }, [map, isLoaded, mapInitialized]);

  if (isTokenLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasToken || error) {
    return <MapboxConfig />;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
      />
      
      <main className="flex-1 relative w-full min-h-0" style={{ height: 'calc(100% - 64px)' }}>
        <div 
          ref={mapContainer} 
          className="absolute inset-0 w-full h-full bg-muted"
          style={{
            opacity: isLoaded && mapInitialized ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
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

        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
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
