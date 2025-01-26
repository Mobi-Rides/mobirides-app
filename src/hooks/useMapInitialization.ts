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
  const initTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset state when dependencies change
    setIsMapReady(false);
    initializationAttempted.current = false;

    // Validate dependencies
    if (!mapboxToken || !container) {
      console.log("Missing map initialization requirements:", {
        hasToken: !!mapboxToken,
        hasContainer: !!container
      });
      return;
    }

    // Wait for container to have dimensions
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.log("Container not ready:", {
        width: container.offsetWidth,
        height: container.offsetHeight
      });
      return;
    }

    console.log("Starting map initialization with:", {
      containerDimensions: {
        width: container.offsetWidth,
        height: container.offsetHeight
      },
      hasToken: !!mapboxToken
    });

    // Cleanup function
    const cleanup = () => {
      if (initTimeout.current) {
        clearTimeout(initTimeout.current);
        initTimeout.current = null;
      }
      if (map.current) {
        console.log("Cleaning up existing map instance");
        map.current.remove();
        map.current = null;
      }
    };

    // Initialize map
    const initializeMap = () => {
      if (initializationAttempted.current || map.current) {
        console.log("Map already initialized or attempting initialization");
        return;
      }

      try {
        console.log("Creating new map instance");
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
    };

    // Add a small delay to ensure container is fully ready
    initTimeout.current = setTimeout(initializeMap, 100);

    return cleanup;
  }, [container, mapboxToken, initialCenter, zoom]);

  return { 
    map: map.current, 
    isMapReady
  };
};