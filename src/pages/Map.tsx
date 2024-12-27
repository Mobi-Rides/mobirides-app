import { useRef, useState, useEffect } from "react";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { VehicleMarker } from "@/components/VehicleMarker";
import { Navigation } from "@/components/Navigation";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { MapboxConfig } from "@/components/MapboxConfig";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { toast } from "sonner";
import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { token, isLoading: isTokenLoading } = useMapboxToken();
  const [isMapReady, setIsMapReady] = useState(false);

  const handleFiltersChange = (newFilters: FilterType) => {
    console.log("Filters updated:", newFilters);
  };

  const handleGeolocate = () => {
    if (!map.current) return;
    
    if ("geolocation" in navigator) {
      toast.info("Updating your location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 14,
            essential: true
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Could not get your location. Please check your settings.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  // Initialize map when token is available
  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

    console.log("Initializing map with token");
    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-24.6282, 25.9231],
        zoom: 12
      });

      map.current.on('load', () => {
        console.log("Map loaded successfully");
        setIsMapReady(true);
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to initialize map. Please try again.");
    }

    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        map.current.remove();
        map.current = null;
      }
    };
  }, [token]);

  if (isTokenLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading map configuration...</div>
      </div>
    );
  }

  if (!token) {
    return <MapboxConfig />;
  }

  return (
    <div className="h-screen relative">
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchFilters onFiltersChange={handleFiltersChange} />
      </div>
      <div ref={mapContainer} className="w-full h-full">
        {!isMapReady && (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse text-primary">Initializing map...</div>
          </div>
        )}
      </div>
      <Button
        onClick={handleGeolocate}
        className="absolute bottom-24 right-4 z-10"
        size="icon"
        variant="secondary"
      >
        <Locate className="h-4 w-4" />
      </Button>
      <Navigation />
    </div>
  );
};

export default MapPage;