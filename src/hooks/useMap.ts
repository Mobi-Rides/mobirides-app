
import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from "sonner";
import { useMapboxToken } from '@/contexts/MapboxTokenContext';
import 'mapbox-gl/dist/mapbox-gl.css';

interface UseMapProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
}

export const useMap = ({
  initialLatitude = -24.6282,
  initialLongitude = 25.9692,
  onMapClick
}: UseMapProps = {}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);
  const attemptCount = useRef(0);
  const { token: contextToken, loading: tokenLoading } = useMapboxToken();
  const hasInitializedRef = useRef(false);

  const initializeMap = useCallback(async () => {
    try {
      if (!mapContainer.current) {
        console.log('Map container is not available');
        return;
      }

      if (isInitializing) {
        console.log('Map initialization already in progress');
        return;
      }

      if (hasInitializedRef.current && map.current) {
        console.log('Map already initialized');
        return;
      }

      // Check container size
      const rect = mapContainer.current.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) {
        console.log('Container too small, delaying initialization:', rect);
        return;
      }

      if (!contextToken) {
        console.log('No Mapbox token available, cannot initialize map');
        setError('No Mapbox token available');
        return;
      }

      setIsInitializing(true);
      console.log('Using Mapbox token:', contextToken.substring(0, 5) + '...');
      
      // Set token globally to ensure it's available
      mapboxgl.accessToken = contextToken;
      console.log('Token set on mapboxgl:', mapboxgl.accessToken ? 'Yes' : 'No');

      // Clear any existing map instance
      if (map.current) {
        console.log('Removing existing map instance');
        map.current.remove();
        map.current = null;
      }

      console.log('Initializing new map in container:', {
        width: rect.width,
        height: rect.height,
        center: [initialLongitude, initialLatitude]
      });

      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialLongitude, initialLatitude],
        zoom: 12,
        failIfMajorPerformanceCaveat: false, // Change to false to be more permissive
        preserveDrawingBuffer: true
      });

      // Set up event listeners
      newMap.on('load', () => {
        console.log('Map loaded successfully');
        setIsLoaded(true);
        setIsInitializing(false);
        hasInitializedRef.current = true;
        attemptCount.current = 0;
      });

      newMap.on('error', (e) => {
        console.error('Map error:', e);
        const errorMessage = e.error ? e.error.message : 'Error loading map';
        setError(errorMessage);
        toast.error(errorMessage);
        setIsInitializing(false);
      });

      // Add navigation controls
      try {
        newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      } catch (error) {
        console.warn('Failed to add navigation controls:', error);
      }

      // Handle click events if callback provided
      if (onMapClick) {
        newMap.on('click', (e) => {
          try {
            onMapClick(e.lngLat);
          } catch (error) {
            console.error('Error in map click handler:', error);
          }
        });
      }

      map.current = newMap;

    } catch (error) {
      console.error('Error in map initialization:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map';
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
  }, [contextToken, initialLatitude, initialLongitude, onMapClick]);

  useEffect(() => {
    console.log('useMap effect starting, token loading:', tokenLoading, 'token:', contextToken ? 'available' : 'not available');
    
    // Don't initialize until we have the token
    if (tokenLoading) {
      console.log('Token still loading, waiting...');
      return;
    }
    
    if (!contextToken) {
      console.log('No token available, cannot initialize map');
      setError('No token available');
      return;
    }
    
    let isMounted = true;
    let initializationTimeout: NodeJS.Timeout;

    // Clean up any previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Set up ResizeObserver to monitor container size
    if (mapContainer.current) {
      observerRef.current = new ResizeObserver((entries) => {
        if (!isMounted) return;
        
        const entry = entries[0];
        if (entry.contentRect.width > 10 && entry.contentRect.height > 10) {
          console.log('Container has dimensions:', entry.contentRect);
          clearTimeout(initializationTimeout);
          initializationTimeout = setTimeout(() => {
            if (isMounted && !isLoaded && !isInitializing && !hasInitializedRef.current) {
              initializeMap();
            }
          }, 200); // Debounce initialization
        }
      });
      observerRef.current.observe(mapContainer.current);
      
      // Initial initialization attempt with short delay
      initializationTimeout = setTimeout(() => {
        if (isMounted && !isLoaded && !isInitializing && !hasInitializedRef.current) {
          console.log('Attempting initial map initialization');
          initializeMap();
        }
      }, 300);
    }

    return () => {
      console.log('Cleaning up map instance...');
      isMounted = false;
      clearTimeout(initializationTimeout);
      
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        map.current = null;
      }
      
      setIsInitializing(false);
      hasInitializedRef.current = false;
    };
  }, [initializeMap, isLoaded, isInitializing, contextToken, tokenLoading]);

  // Method to manually trigger map resize
  const resizeMap = useCallback(() => {
    if (map.current) {
      console.log('Manually resizing map');
      map.current.resize();
    }
  }, []);

  return {
    mapContainer,
    map: map.current,
    isLoaded,
    error,
    isInitializing,
    resizeMap
  };
};
