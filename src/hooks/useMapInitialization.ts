import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';

interface MapConfig {
  container: HTMLDivElement | null;
  initialCenter: [number, number];
  zoom?: number;
  mapboxToken: string;
}

export const useMapInitialization = ({
  container,
  initialCenter,
  mapboxToken,
  zoom = 12
}: MapConfig) => {
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    console.log("Map initialization triggered with:", {
      hasContainer: !!container,
      hasToken: !!mapboxToken,
      containerDimensions: container ? {
        width: container.offsetWidth,
        height: container.offsetHeight
      } : null
    });

    // Clear state when dependencies change
    setIsMapReady(false);

    // Clean up existing map instance if it exists
    if (map.current) {
      console.log("Cleaning up existing map instance");
      map.current.remove();
      map.current = null;
    }

    // Don't proceed if we don't have all required dependencies
    if (!mapboxToken || !container) {
      console.log("Missing required dependencies for map initialization");
      return;
    }

    try {
      console.log("Starting map initialization");
      
      // Set the Mapbox access token
      mapboxgl.accessToken = mapboxToken;

      // Create new map instance
      map.current = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/streets-v12",
        center: initialCenter,
        zoom,
      });

      // Set up event listeners
      map.current.on('load', () => {
        console.log("Map loaded successfully");
        setIsMapReady(true);
      });

      map.current.on('error', (e) => {
        console.error("Map error:", e);
        toast.error("Error loading map. Please try again.");
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      console.log("Map initialization completed");

    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to initialize map. Please check your connection and try again.");
    }

    // Cleanup function
    return () => {
      if (map.current) {
        console.log("Cleaning up map instance on unmount");
        map.current.remove();
        map.current = null;
      }
    };
  }, [container, mapboxToken, initialCenter, zoom]);

  return { map: map.current, isMapReady };
};