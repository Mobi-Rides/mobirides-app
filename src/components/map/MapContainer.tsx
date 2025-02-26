
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { MapboxConfig } from "@/components/MapboxConfig";
import { mapboxTokenManager } from '@/utils/mapbox';

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
  const [isModuleLoading, setIsModuleLoading] = useState(true);
  const [tokenState, setTokenState] = useState(mapboxTokenManager.getTokenState());
  const [isDomReady, setIsDomReady] = useState(false);

  useEffect(() => {
    const initToken = async () => {
      const token = await mapboxTokenManager.getToken();
      setTokenState(mapboxTokenManager.getTokenState());
    };
    initToken();
  }, []);

  // New effect to track DOM readiness
  useEffect(() => {
    if (mapContainer.current) {
      console.log('[MapContainer] DOM element is ready');
      setIsDomReady(true);
    }
  }, []);

  const initializeMap = useCallback(async () => {
    if (!mapContainer.current || !tokenState.token) {
      console.log('[MapContainer] Initialization requirements not met:', {
        hasContainer: !!mapContainer.current,
        hasToken: !!tokenState.token
      });
      return;
    }

    try {
      console.log('[MapContainer] Starting map initialization...');
      setIsModuleLoading(true);

      const instanceManager = mapboxTokenManager.getInstanceManager();
      if (!instanceManager.isReady()) {
        console.log('[MapContainer] Loading Mapbox module...');
        await instanceManager.getMapboxModule();
      }

      if (!window.mapboxgl) {
        throw new Error('Mapbox GL JS module not properly initialized');
      }

      if (map.current) {
        console.log('[MapContainer] Cleaning up existing map instance');
        map.current.remove();
        map.current = null;
      }

      console.log('[MapContainer] Creating new map instance:', {
        center: [initialLongitude, initialLatitude],
        zoom: isMobile ? 13 : 12,
        mobile: isMobile
      });

      const newMap = new window.mapboxgl.Map({
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
        newMap.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
      }

      console.log('[MapContainer] Adding geolocation control');
      const geolocateControl = new window.mapboxgl.GeolocateControl({
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
    } finally {
      setIsModuleLoading(false);
    }
  }, [initialLatitude, initialLongitude, isMobile, onMapLoad, onMapError, tokenState.token]);

  // Updated initialization effect to consider DOM readiness
  useEffect(() => {
    if (tokenState.token && isDomReady) {
      console.log('[MapContainer] All prerequisites met, initializing map...');
      initializeMap();
    } else {
      console.log('[MapContainer] Waiting for prerequisites:', {
        hasToken: !!tokenState.token,
        isDomReady
      });
    }

    return () => {
      if (map.current) {
        console.log('[MapContainer] Cleaning up map instance');
        map.current.remove();
        map.current = null;
      }
    };
  }, [initializeMap, tokenState.token, isDomReady]);

  if (tokenState.status === 'loading' || isModuleLoading) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${height} ${className}`}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  if (tokenState.status === 'error' || !tokenState.token) {
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
