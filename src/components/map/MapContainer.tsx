
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { getMapboxToken } from "@/components/MapboxConfig";
import { MapboxConfig } from "@/components/MapboxConfig";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapContainerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  height?: string;
  className?: string;
  onMapLoad?: (map: mapboxgl.Map) => void;
  onMapError?: (error: Error) => void;
}

export const MapContainer = ({
  initialLatitude = -24.6282,
  initialLongitude = 25.9692,
  height = "h-[400px]",
  className = "",
  onMapLoad,
  onMapError
}: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    let isMounted = true;
    console.log('[MapContainer] Starting initialization...', {
      initialLatitude,
      initialLongitude,
      isMobile
    });

    const initializeMap = async () => {
      if (!mapContainer.current) {
        console.log('[MapContainer] No container ref available, skipping initialization');
        return;
      }

      try {
        console.log('[MapContainer] Attempting to get Mapbox token...');
        const token = await getMapboxToken();
        
        if (!token) {
          console.log('[MapContainer] No token available, showing config screen');
          setHasToken(false);
          return;
        }

        console.log('[MapContainer] Token retrieved successfully');
        setHasToken(true);

        if (!isMounted) {
          console.log('[MapContainer] Component unmounted during token retrieval');
          return;
        }

        console.log('[MapContainer] Setting Mapbox access token');
        mapboxgl.accessToken = token;

        console.log('[MapContainer] Initializing map with config:', {
          center: [initialLongitude, initialLatitude],
          zoom: isMobile ? 13 : 12,
          mobile: isMobile
        });

        // Initialize map with mobile-optimized settings
        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [initialLongitude, initialLatitude],
          zoom: isMobile ? 13 : 12,
          pitchWithRotate: !isMobile,
          dragRotate: !isMobile,
          attributionControl: !isMobile,
          preserveDrawingBuffer: true
        });

        // Add navigation controls (desktop only)
        if (!isMobile) {
          console.log('[MapContainer] Adding navigation controls (desktop mode)');
          newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }

        console.log('[MapContainer] Adding geolocation control');
        // Add geolocate control for both desktop and mobile
        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        });
        newMap.addControl(geolocateControl, 'top-right');

        newMap.on('load', () => {
          console.log('[MapContainer] Map loaded successfully');
          if (isMounted) {
            setIsLoaded(true);
            onMapLoad?.(newMap);
          }
        });

        newMap.on('error', (e) => {
          console.error('[MapContainer] Map error:', {
            error: e.error,
            message: e.error ? e.error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
          const error = new Error(e.error ? e.error.message : 'Error loading map');
          onMapError?.(error);
          toast.error(error.message);
        });

        map.current = newMap;

        // Add debug listeners
        newMap.on('movestart', () => console.log('[MapContainer] Map move started'));
        newMap.on('moveend', () => console.log('[MapContainer] Map move ended'));
        newMap.on('zoomstart', () => console.log('[MapContainer] Map zoom started'));
        newMap.on('zoomend', () => console.log('[MapContainer] Map zoom ended'));
        newMap.on('dragstart', () => console.log('[MapContainer] Map drag started'));
        newMap.on('dragend', () => console.log('[MapContainer] Map drag ended'));

      } catch (error) {
        console.error('[MapContainer] Error initializing map:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map';
        onMapError?.(new Error(errorMessage));
        toast.error(errorMessage);
      }
    };

    initializeMap();

    return () => {
      console.log('[MapContainer] Cleaning up...');
      isMounted = false;
      if (map.current) {
        console.log('[MapContainer] Removing map instance');
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialLatitude, initialLongitude, isMobile, onMapLoad, onMapError]);

  if (!hasToken) {
    console.log('[MapContainer] No token available, rendering MapboxConfig');
    return <MapboxConfig />;
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${height} ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      {!isLoaded && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
          <Skeleton className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

