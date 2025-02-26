
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { mapboxTokenManager } from '@/utils/mapboxTokenManager';
import { toast } from "sonner";

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

  useEffect(() => {
    console.log('useMap effect starting');
    let isMounted = true;
    let initializationTimeout: NodeJS.Timeout;

    const initializeMap = async () => {
      try {
        if (!mapContainer.current) {
          throw new Error('Map container is not available');
        }

        if (isInitializing) {
          console.log('Map initialization already in progress');
          return;
        }

        setIsInitializing(true);
        console.log('Fetching Mapbox token...');
        
        const token = await mapboxTokenManager.getToken();
        if (!token) {
          throw new Error('No Mapbox token available');
        }

        if (!isMounted) {
          console.log('Component unmounted during initialization');
          return;
        }

        console.log('Creating map instance...');
        mapboxgl.accessToken = token;

        // Clear any existing map instance
        if (map.current) {
          console.log('Removing existing map instance');
          map.current.remove();
          map.current = null;
        }

        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [initialLongitude, initialLatitude],
          zoom: 12,
          failIfMajorPerformanceCaveat: true,
          preserveDrawingBuffer: true
        });

        // Set up event listeners
        newMap.on('load', () => {
          if (isMounted) {
            console.log('Map loaded successfully');
            setIsLoaded(true);
            setIsInitializing(false);
          }
        });

        newMap.on('error', (e) => {
          console.error('Map error:', e);
          if (isMounted) {
            const errorMessage = e.error ? e.error.message : 'Error loading map';
            setError(errorMessage);
            toast.error(errorMessage);
            setIsInitializing(false);
          }
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
        if (isMounted) {
          setError(errorMessage);
          toast.error(errorMessage);
          setIsInitializing(false);
        }
      }
    };

    // Set up ResizeObserver
    if (mapContainer.current && !observerRef.current) {
      observerRef.current = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          console.log('Container has dimensions:', entry.contentRect);
          clearTimeout(initializationTimeout);
          initializationTimeout = setTimeout(() => {
            initializeMap();
          }, 100); // Debounce initialization
        }
      });
      observerRef.current.observe(mapContainer.current);
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
    };
  }, [initialLatitude, initialLongitude, onMapClick]);

  return {
    mapContainer,
    map: map.current,
    isLoaded,
    error,
    isInitializing
  };
};
