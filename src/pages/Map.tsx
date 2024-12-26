import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { VehicleMarker } from "@/components/VehicleMarker";
import { Navigation } from "@/components/Navigation";
import { MapboxConfig, useMapboxToken } from "@/components/MapboxConfig";

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [filters, setFilters] = useState<FilterType>();
  const mapboxToken = useMapboxToken();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    const initializeMap = () => {
      try {
        console.log("Initializing map with token:", mapboxToken.slice(0, 8) + "...");
        mapboxgl.accessToken = mapboxToken;
        
        const map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [25.9231, -24.6282], // Gaborone coordinates
          zoom: 12
        });

        mapInstance.current = map;

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Get user location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log("Got user location coordinates:", latitude, longitude);
            
            if (mapInstance.current) {
              mapInstance.current.flyTo({
                center: [longitude, latitude],
                zoom: 14
              });
            }
          },
          (error) => {
            console.error("Geolocation error:", error.message);
          }
        );

        return map;
      } catch (error) {
        console.error("Map initialization error:", error);
        return null;
      }
    };

    const map = initializeMap();

    // Cleanup function
    return () => {
      console.log("Running cleanup...");
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
          console.log("Map instance removed successfully");
        } catch (error) {
          console.error("Error during map cleanup:", error);
        } finally {
          mapInstance.current = null;
        }
      }
    };
  }, [mapboxToken]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    console.log("Filters updated:", newFilters);
    // TODO: Fetch and update vehicles based on filters
  };

  if (!mapboxToken) {
    return <MapboxConfig />;
  }

  return (
    <div className="h-screen relative">
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchFilters onFiltersChange={handleFiltersChange} />
      </div>
      <div ref={mapContainer} className="w-full h-full" />
      <Navigation />
    </div>
  );
};

export default MapPage;