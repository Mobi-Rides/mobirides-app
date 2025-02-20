
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { mapboxTokenManager } from '@/utils/mapboxTokenManager';
import { toast } from 'sonner';

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

  useEffect(() => {
    console.log('useMap effect starting, initialization status:', isInitializing);
    let isMounted = true;
    let initializationAttempts = 0;
    const MAX_ATTEMPTS = 3;

    const initializeMap = async () => {
      try {
        if (isInitializing) {
          console.log('Map initialization already in progress');
          return;
        }

        if (!mapContainer.current) {
          throw new Error('Map container is not available');
        }

        // Verify container dimensions
        const { offsetWidth, offsetHeight } = mapContainer.current;
        if (offsetWidth === 0 || offsetHeight === 0) {
          throw new Error(`Invalid container dimensions: ${offsetWidth}x${offsetHeight}`);
        }

        setIsInitializing(true);
        console.log('Fetching Mapbox token...');
        
        const token = await mapboxTokenManager.getToken();
        if (!token) {
          throw new Error('No Mapbox token available');
        }

        if (!isMounted) {
          throw new Error('Component unmounted during initialization');
        }

        console.log('Creating map instance...');
        mapboxgl.accessToken = token;

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
          console.log('Map loaded successfully');
          if (isMounted) {
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

        // Handle click events if callback provided
        if (onMapClick) {
          newMap.on('click', (e) => {
            try {
              console.log('Map clicked:', e.lngLat);
              onMapClick(e.lngLat);
            } catch (error) {
              console.error('Error in map click handler:', error);
              toast.error('Failed to handle map click');
            }
          });
        }

        // Add navigation controls with error handling
        try {
          newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
        } catch (error) {
          console.warn('Failed to add navigation controls:', error);
        }

        map.current = newMap;

        // Add resize handler
        const handleResize = () => {
          if (map.current && map.current.loaded()) {
            try {
              map.current.resize();
            } catch (error) {
              console.error('Error resizing map:', error);
            }
          }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

      } catch (error) {
        console.error('Error in map initialization:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map';
        setError(errorMessage);
        toast.error(errorMessage);
        setIsInitializing(false);

        // Retry initialization if under max attempts
        if (initializationAttempts < MAX_ATTEMPTS) {
          initializationAttempts++;
          console.log(`Retrying map initialization (attempt ${initializationAttempts})`);
          setTimeout(initializeMap, 1000 * initializationAttempts);
        }
      }
    };

    // Use ResizeObserver to wait for container to have dimensions
    const observer = new ResizeObserver((entries) => {
      try {
        const entry = entries[0];
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          console.log('Container dimensions ready:', entry.contentRect);
          observer.disconnect();
          initializeMap();
        } else {
          console.log('Container still has no dimensions:', entry.contentRect);
        }
      } catch (error) {
        console.error('Error in ResizeObserver:', error);
      }
    });

    if (mapContainer.current) {
      observer.observe(mapContainer.current);
    }

    return () => {
      console.log('Cleaning up map instance...');
      isMounted = false;
      observer.disconnect();
      
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
