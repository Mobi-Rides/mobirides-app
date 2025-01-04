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
  const initializationAttempted = useRef(false);

  useEffect(() => {
    // Log initialization attempt
    console.log("Map initialization check:", {
      hasContainer: !!container,
      hasToken: !!mapboxToken,
      containerDimensions: container ? {
        width: container.offsetWidth,
        height: container.offsetHeight
      } : null,
      hasExistingMap: !!map.current,
      initializationAttempted: initializationAttempted.current
    });

    // Clear state when dependencies change
    setIsMapReady(false);

    // Clean up existing map instance if it exists
    if (map.current) {
      console.log("Cleaning up existing map instance");
      map.current.remove();
      map.current = null;
      initializationAttempted.current = false;
    }

    // Don't proceed if we don't have all required dependencies
    if (!mapboxToken || !container) {
      console.log("Missing required dependencies for map initialization:", {
        hasToken: !!mapboxToken,
        hasContainer: !!container
      });
      return;
    }

    // Verify container dimensions
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.log("Container dimensions are invalid:", {
        width: container.offsetWidth,
        height: container.offsetHeight
      });
      return;
    }

    // Prevent multiple initialization attempts
    if (initializationAttempted.current) {
      console.log("Map initialization already attempted");
      return;
    }

    try {
      console.log("Starting map initialization with token:", mapboxToken.substring(0, 10) + '...');
      initializationAttempted.current = true;
      
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
        initializationAttempted.current = false;
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      console.log("Map initialization completed");

    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to initialize map. Please check your connection and try again.");
      initializationAttempted.current = false;
    }

    // Cleanup function
    return () => {
      if (map.current) {
        console.log("Cleaning up map instance on unmount");
        map.current.remove();
        map.current = null;
        initializationAttempted.current = false;
      }
    };
  }, [container, mapboxToken, initialCenter, zoom]);

  return { 
    map: map.current, 
    isMapReady
  };
};