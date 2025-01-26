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

  useEffect(() => {
    console.log('useMap effect starting');
    let isMounted = true;

    const initializeMap = async () => {
      if (!mapContainer.current) {
        console.log('Map container not ready');
        return;
      }

      // Check container dimensions
      if (mapContainer.current.offsetWidth === 0 || mapContainer.current.offsetHeight === 0) {
        console.log('Container has no dimensions:', {
          width: mapContainer.current.offsetWidth,
          height: mapContainer.current.offsetHeight
        });
        return;
      }

      try {
        const token = await mapboxTokenManager.getToken();
        if (!token) {
          console.error('No Mapbox token available');
          setError('Failed to load map configuration');
          return;
        }

        if (!isMounted) {
          console.log('Component unmounted during initialization');
          return;
        }

        console.log('Initializing map with dimensions:', {
          width: mapContainer.current.offsetWidth,
          height: mapContainer.current.offsetHeight
        });

        mapboxgl.accessToken = token;

        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [initialLongitude, initialLatitude],
          zoom: 12
        });

        newMap.on('load', () => {
          console.log('Map loaded successfully');
          if (isMounted) {
            setIsLoaded(true);
          }
        });

        newMap.on('error', (e) => {
          console.error('Map error:', e);
          if (isMounted) {
            setError('Error loading map');
            toast.error('Error loading map. Please try again.');
          }
        });

        if (onMapClick) {
          newMap.on('click', (e) => {
            console.log('Map clicked:', e.lngLat);
            onMapClick(e.lngLat);
          });
        }

        newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current = newMap;

      } catch (error) {
        console.error('Error initializing map:', error);
        if (isMounted) {
          setError('Failed to initialize map');
          toast.error('Failed to initialize map. Please check your connection and try again.');
        }
      }
    };

    // Initialize map when container is ready
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        console.log('Container dimensions ready:', entry.contentRect);
        initializeMap();
        observer.disconnect();
      }
    });

    if (mapContainer.current) {
      observer.observe(mapContainer.current);
    }

    return () => {
      console.log('Cleaning up map');
      isMounted = false;
      observer.disconnect();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialLatitude, initialLongitude, onMapClick]);

  return {
    mapContainer,
    map: map.current,
    isLoaded,
    error
  };
};