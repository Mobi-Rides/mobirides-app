import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';

interface MapConfig {
  container: HTMLDivElement;
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
    if (!mapboxToken) {
      console.error("No Mapbox token provided");
      return;
    }

    if (!container) {
      console.error("No container element provided");
      return;
    }

    console.log("Starting map initialization with:", {
      hasToken: !!mapboxToken,
      container: container,
      center: initialCenter,
      zoom
    });

    try {
      // Clean up existing map instance if it exists
      if (map.current) {
        console.log("Cleaning up existing map instance");
        map.current.remove();
        map.current = null;
      }

      // Set the Mapbox access token
      mapboxgl.accessToken = mapboxToken;

      // Create new map instance
      console.log("Creating new map instance");
      const newMap = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/streets-v12",
        center: initialCenter,
        zoom,
      });

      // Set up event listeners
      newMap.on('load', () => {
        console.log("Map loaded successfully");
        setIsMapReady(true);
      });

      newMap.on('error', (e) => {
        console.error("Map error:", e);
        toast.error("Error loading map. Please try again.");
      });

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Store the map instance
      map.current = newMap;

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