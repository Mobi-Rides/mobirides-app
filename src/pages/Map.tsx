import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { VehicleMarker } from "@/components/VehicleMarker";
import { Navigation } from "@/components/Navigation";

// TODO: Replace with your Mapbox token
const MAPBOX_TOKEN = "YOUR_MAPBOX_TOKEN";

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [filters, setFilters] = useState<FilterType>();

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [25.9231, -24.6282], // Gaborone coordinates
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Get user location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (map.current) {
          map.current.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 14
          });
        }
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );

    return () => {
      map.current?.remove();
    };
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
    console.log("Filters updated:", newFilters);
    // TODO: Fetch and update vehicles based on filters
  };

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