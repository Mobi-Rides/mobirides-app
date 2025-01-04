import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const initializationAttempted = useRef(false);

  useEffect(() => {
    console.log("Map initialization starting with:", {
      hasContainer: !!container,
      hasToken: !!mapboxToken,
      containerDimensions: container ? {
        width: container.offsetWidth,
        height: container.offsetHeight
      } : null
    });

    // Reset state when dependencies change
    setIsMapReady(false);

    // Validate dependencies
    if (!mapboxToken || !container) {
      console.log("Missing required dependencies:", {
        hasToken: !!mapboxToken,
        hasContainer: !!container
      });
      return;
    }

    // Cleanup existing map instance
    const cleanup = () => {
      if (map.current) {
        console.log("Cleaning up existing map instance");
        map.current.remove();
        map.current = null;
        initializationAttempted.current = false;
      }
    };

    // Initialize map with a small delay to ensure container is ready
    const initTimeout = setTimeout(() => {
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn("Invalid container dimensions:", {
          width: container.offsetWidth,
          height: container.offsetHeight
        });
        return;
      }

      // Prevent multiple initialization attempts
      if (initializationAttempted.current || map.current) {
        console.log("Map already initialized or attempting initialization");
        return;
      }

      try {
        console.log("Starting map initialization");
        initializationAttempted.current = true;
        
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
          console.error("Map error:", e.error);
          toast.error("Error loading map. Please try again.");
          cleanup();
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      } catch (error) {
        console.error("Error initializing map:", error);
        toast.error("Failed to initialize map. Please check your connection and try again.");
        cleanup();
      }
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(initTimeout);
      cleanup();
    };
  }, [container, mapboxToken, initialCenter, zoom]);

  return { 
    map: map.current, 
    isMapReady
  };
};