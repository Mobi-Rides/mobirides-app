
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

    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        const token = await getMapboxToken();
        if (!token) {
          setHasToken(false);
          return;
        }
        setHasToken(true);

        if (!isMounted) return;

        mapboxgl.accessToken = token;

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
          newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }

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
          if (isMounted) {
            console.log('Map loaded successfully');
            setIsLoaded(true);
            onMapLoad?.(newMap);
          }
        });

        newMap.on('error', (e) => {
          console.error('Map error:', e);
          const error = new Error(e.error ? e.error.message : 'Error loading map');
          onMapError?.(error);
          toast.error(error.message);
        });

        map.current = newMap;

      } catch (error) {
        console.error('Error initializing map:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize map';
        onMapError?.(new Error(errorMessage));
        toast.error(errorMessage);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialLatitude, initialLongitude, isMobile, onMapLoad, onMapError]);

  if (!hasToken) {
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
