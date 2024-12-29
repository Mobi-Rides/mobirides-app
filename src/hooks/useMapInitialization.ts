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
    if (!mapboxToken || !container) {
      console.log("Missing map initialization requirements:", {
        hasToken: !!mapboxToken,
        hasContainer: !!container
      });
      return;
    }

    console.log("Initializing map with:", {
      center: initialCenter,
      hasToken: !!mapboxToken,
      container: !!container
    });

    try {
      if (map.current) {
        console.log("Removing existing map instance");
        map.current.remove();
      }

      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/streets-v12",
        center: initialCenter,
        zoom,
      });

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

    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to initialize map. Please check your connection and try again.");
    }

    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        map.current.remove();
        map.current = null;
      }
    };
  }, [container, mapboxToken, initialCenter, zoom]);

  return { map: map.current, isMapReady };
};