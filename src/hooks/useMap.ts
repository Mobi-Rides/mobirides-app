
import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapboxToken } from "../utils/mapbox";

interface UseMapProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
}

export const useMap = ({
  initialLatitude = -24.6282,
  initialLongitude = 25.9692,
  onMapClick,
}: UseMapProps = {}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);
  const attemptCount = useRef(0);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);
  const mountedRef = useRef(true);
  const clickListenerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
  const loadListenerRef = useRef<(() => void) | null>(null);
  const errorListenerRef = useRef<((e: ErrorEvent) => void) | null>(null);
  
  // Get token on mount
  useEffect(() => {
    mountedRef.current = true;
    
    getMapboxToken()
      .then((token) => {
        if (!mountedRef.current) return;
        
        if (token) {
          setLoading(false);
          setToken(token);
        }
        console.log("Mapbox token loaded:", token ? "✓" : "✗");
      })
      .catch((error) => {
        if (!mountedRef.current) return;
        
        console.error("Error getting Mapbox token:", error);
        setError("Failed to get Mapbox token");
        setLoading(false);
      });
      
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const initializeMap = useCallback(async () => {
    try {
      if (!mapContainer.current) {
        console.log("Map container is not available");
        return;
      }

      if (isInitializing) {
        console.log("Map initialization already in progress");
        return;
      }

      if (hasInitializedRef.current && map.current) {
        console.log("Map already initialized");
        return;
      }

      // Check container size
      const rect = mapContainer.current.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) {
        console.log("Container too small, delaying initialization:", rect);
        return;
      }

      if (!token) {
        console.log("No Mapbox token available, cannot initialize map");
        setError("No Mapbox token available");
        return;
      }

      setIsInitializing(true);
      console.log("Using Mapbox token:", token.substring(0, 5) + "...");

      // Set token globally to ensure it's available
      mapboxgl.accessToken = token;
      console.log(
        "Token set on mapboxgl:",
        mapboxgl.accessToken ? "Yes" : "No"
      );

      // Clear any existing map instance
      if (map.current) {
        console.log("Removing existing map instance");
        
        // Clean up any existing listeners before removing
        if (clickListenerRef.current && onMapClick) {
          map.current.off('click', clickListenerRef.current);
          clickListenerRef.current = null;
        }
        
        if (loadListenerRef.current) {
          map.current.off('load', loadListenerRef.current);
          loadListenerRef.current = null;
        }
        
        if (errorListenerRef.current) {
          map.current.off('error', errorListenerRef.current);
          errorListenerRef.current = null;
        }
        
        map.current.remove();
        map.current = null;
      }

      console.log("Initializing new map in container:", {
        width: rect.width,
        height: rect.height,
        center: [initialLongitude, initialLatitude],
      });

      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [initialLongitude, initialLatitude],
        zoom: 12,
        failIfMajorPerformanceCaveat: false, // Change to false to be more permissive
        preserveDrawingBuffer: true,
      });

      // Store the reference to event handlers so we can properly remove them later
      loadListenerRef.current = () => {
        if (!mountedRef.current) return;
        console.log("Map loaded successfully");
        setIsLoaded(true);
        setIsInitializing(false);
        hasInitializedRef.current = true;
        attemptCount.current = 0;
      };
      
      errorListenerRef.current = (e) => {
        if (!mountedRef.current) return;
        console.error("Map error:", e);
        const errorMessage = e.error ? e.error.message : "Error loading map";
        setError(errorMessage);
        toast.error(errorMessage);
        setIsInitializing(false);
      };
      
      // Set up event listeners
      newMap.on("load", loadListenerRef.current);
      newMap.on("error", errorListenerRef.current);

      // Add navigation controls
      try {
        newMap.addControl(new mapboxgl.NavigationControl(), "top-right");
      } catch (error) {
        console.warn("Failed to add navigation controls:", error);
      }

      // Handle click events if callback provided
      if (onMapClick) {
        clickListenerRef.current = (e) => {
          try {
            onMapClick(e.lngLat);
          } catch (error) {
            console.error("Error in map click handler:", error);
          }
        };
        
        newMap.on("click", clickListenerRef.current);
      }

      map.current = newMap;
    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error("Error in map initialization:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initialize map";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsInitializing(false);

      // Retry initialization after delay if not too many attempts
      if (attemptCount.current < 3) {
        attemptCount.current++;
        setTimeout(() => {
          setIsInitializing(false);
        }, 1000);
      }
    }
  }, [token, initialLatitude, initialLongitude, onMapClick]);

  useEffect(() => {
    console.log(
      "useMap effect starting, token loading:",
      loading,
      "token:",
      token ? "available" : "not available"
    );

    // Don't initialize until we have the token
    if (loading) {
      console.log("Token still loading, waiting...");
      return;
    }

    if (!token) {
      console.log("No token available, cannot initialize map");
      setError("No token available");
      return;
    }

    let initializationTimeout: NodeJS.Timeout;

    // Clean up any previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Set up ResizeObserver to monitor container size
    if (mapContainer.current) {
      observerRef.current = new ResizeObserver((entries) => {
        if (!mountedRef.current) return;

        const entry = entries[0];
        if (entry.contentRect.width > 10 && entry.contentRect.height > 10) {
          console.log("Container has dimensions:", entry.contentRect);
          clearTimeout(initializationTimeout);
          initializationTimeout = setTimeout(() => {
            if (
              mountedRef.current &&
              !isLoaded &&
              !isInitializing &&
              !hasInitializedRef.current
            ) {
              initializeMap();
            }
          }, 200); // Debounce initialization
        }
      });
      observerRef.current.observe(mapContainer.current);

      // Initial initialization attempt with short delay
      initializationTimeout = setTimeout(() => {
        if (
          mountedRef.current &&
          !isLoaded &&
          !isInitializing &&
          !hasInitializedRef.current
        ) {
          console.log("Attempting initial map initialization");
          initializeMap();
        }
      }, 300);
    }

    return () => {
      console.log("Cleaning up map instance...");
      mountedRef.current = false;
      clearTimeout(initializationTimeout);

      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (map.current) {
        try {
          // Remove event listeners
          if (clickListenerRef.current && onMapClick) {
            map.current.off('click', clickListenerRef.current);
            clickListenerRef.current = null;
          }
          
          if (loadListenerRef.current) {
            map.current.off('load', loadListenerRef.current);
            loadListenerRef.current = null;
          }
          
          if (errorListenerRef.current) {
            map.current.off('error', errorListenerRef.current);
            errorListenerRef.current = null;
          }
          
          map.current.remove();
        } catch (error) {
          console.error("Error removing map:", error);
        }
        map.current = null;
      }

      setIsInitializing(false);
      hasInitializedRef.current = false;
    };
  }, [initializeMap, isLoaded, isInitializing, token, loading, onMapClick]);

  // Method to manually trigger map resize
  const resizeMap = useCallback(() => {
    if (map.current) {
      console.log("Manually resizing map");
      map.current.resize();
    }
  }, []);

  return {
    mapContainer,
    map: map.current,
    isLoaded,
    error,
    isInitializing,
    resizeMap,
  };
};
