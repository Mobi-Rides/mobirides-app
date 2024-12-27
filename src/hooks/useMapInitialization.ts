import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';

interface MapConfig {
  container: HTMLDivElement;
  initialLongitude: number;
  initialLatitude: number;
  mapboxToken: string;
  zoom?: number;
}

export const useMapInitialization = ({
  container,
  initialLongitude,
  initialLatitude,
  mapboxToken,
  zoom = 15
}: MapConfig) => {
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapboxToken || !container) {
      console.log("Missing map initialization requirements:", {
        hasToken: !!mapboxToken,
        hasContainer: !!container
      });
      return;
    }

    console.log("Initializing map with:", {
      initialLatitude,
      initialLongitude,
      hasToken: !!mapboxToken
    });

    try {
      mapboxgl.accessToken = mapboxToken;

      const newMap = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [initialLongitude, initialLatitude],
        zoom,
      });

      map.current = newMap;

      newMap.on('load', () => {
        console.log("Map loaded successfully");
        setIsMapLoaded(true);
      });

      newMap.on('error', (e) => {
        console.error("Map error:", e);
        toast.error("Error loading map. Please try again.");
      });

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), "top-right");

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
  }, [container, mapboxToken, initialLatitude, initialLongitude, zoom]);

  return { map: map.current, isMapLoaded };
};