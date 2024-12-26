import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { VehicleMarker } from "@/components/VehicleMarker";
import { Navigation } from "@/components/Navigation";
import { MapboxConfig, useMapboxToken } from "@/components/MapboxConfig";

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [filters, setFilters] = useState<FilterType>();
  const mapboxToken = useMapboxToken();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    let mapInstance: mapboxgl.Map | null = null;

    try {
      console.log("Initializing map with token:", mapboxToken.slice(0, 8) + "...");
      mapboxgl.accessToken = mapboxToken;
      
      mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [25.9231, -24.6282], // Gaborone coordinates
        zoom: 12
      });

      map.current = mapInstance;

      // Add navigation controls
      const navControl = new mapboxgl.NavigationControl();
      mapInstance.addControl(navControl, "top-right");

      // Get user location
      const getUserLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log("Got user location:", { latitude, longitude });
            
            if (mapInstance) {
              mapInstance.flyTo({
                center: [longitude, latitude],
                zoom: 14
              });
            }
          },
          (error) => {
            console.error("Error getting location:", error.message);
          }
        );
      };

      getUserLocation();
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    // Cleanup function
    return () => {
      try {
        if (mapInstance) {
          console.log("Cleaning up map instance");
          mapInstance.remove();
          map.current = null;
        }
      } catch (error) {
        console.error("Error cleaning up map:", error);
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