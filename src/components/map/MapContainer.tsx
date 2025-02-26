
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { MapboxConfig } from "@/components/MapboxConfig";
import { useMapboxToken } from "@/contexts/MapboxTokenContext";

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
  const { token, isLoading: isTokenLoading, error: tokenError } = useMapboxToken();
  const mapboxgl = useRef<typeof import('mapbox-gl')>();

  const initializeMap = useCallback(async () => {
    if (!mapContainer.current || !token) {
      console.log('[MapContainer] No container ref or token available, skipping initialization');
      return;
    }

    try {
      // Dynamic import of mapbox-gl to avoid preload issues
      if (!mapboxgl.current) {
        console.log('[MapContainer] Loading mapbox-gl...');
        mapboxgl.current = await import('mapbox-gl');
        await import('mapbox-gl/dist/mapbox-gl.css');
      }

      if (map.current) {
        console.log('[MapContainer] Removing existing map instance');
        map.current.remove();
        map.current = null;
      }

      console.log('[MapContainer] Initializing map with config:', {
        center: [initialLongitude, initialLatitude],
        zoom: isMobile ? 13 : 12,
        mobile: isMobile
      });

      const newMap = new mapboxgl.current.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialLongitude, initialLatitude],
        zoom: isMobile ? 13 : 12,
        pitchWithRotate: !isMobile,
        dragRotate: !isMobile,
        attributionControl: !isMobile,
        preserveDrawingBuffer: true
      });

      if (!isMobile) {
        console.log('[MapContainer] Adding navigation controls (desktop mode)');
        newMap.addControl(new mapboxgl.current.NavigationControl(), 'top-right');
      }

      console.log('[MapContainer] Adding geolocation control');
      const geolocateControl = new mapboxgl.current.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      newMap.addControl(geolocateControl, 'top-right');

      newMap.once('load', () => {
        console.log('[MapContainer] Map loaded successfully');
        setIsLoaded(true);
        map.current = newMap;
        onMapLoad?.(newMap);
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

    } catch (error) {
      console.error('[MapContainer] Error initializing map:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map';
      onMapError?.(new Error(errorMessage));
      toast.error(errorMessage);
    }
  }, [initialLatitude, initialLongitude, isMobile, onMapLoad, onMapError, token]);

  useEffect(() => {
    if (token) {
      console.log('[MapContainer] Token available, initializing map...');
      initializeMap();
    }

    return () => {
      console.log('[MapContainer] Cleaning up...');
      if (map.current) {
        console.log('[MapContainer] Removing map instance');
        map.current.remove();
        map.current = null;
      }
    };
  }, [initializeMap, token]);

  if (isTokenLoading) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${height} ${className}`}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  if (tokenError || !token) {
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
