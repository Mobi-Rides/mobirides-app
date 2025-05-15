
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import MapboxConfig from "@/components/MapboxConfig";
import { mapboxTokenManager } from '@/utils/mapbox';
import { stateManager } from '@/utils/mapbox/core/stateManager';
import { eventBus } from '@/utils/mapbox/core/eventBus';
import { MapInitializationState, StateSubscriber, EventSubscriber, MapStateEvent } from '@/utils/mapbox/core/types';

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
  const [currentState, setCurrentState] = useState<MapInitializationState>(stateManager.getCurrentState());

  useEffect(() => {
    const stateSubscriber: StateSubscriber = {
      onStateChange: (newState) => {
        setCurrentState(newState);
      }
    };

    const eventSubscriber: EventSubscriber = {
      onEvent: (event: MapStateEvent) => {
        if (event.type === 'error') {
          onMapError?.(new Error(event.payload));
          toast.error(event.payload);
        }
      }
    };

    stateManager.subscribe(stateSubscriber);
    eventBus.subscribe(eventSubscriber);

    return () => {
      stateManager.unsubscribe(stateSubscriber);
      eventBus.unsubscribe(eventSubscriber);
    };
  }, [onMapError]);

  useEffect(() => {
    if (mapContainer.current) {
      stateManager.updateResourceState({ dom: true });
    }
  }, []);

  useEffect(() => {
    const initToken = async () => {
      try {
        await stateManager.transition('prerequisites_checking');
        const token = await mapboxTokenManager.getToken();
        if (token) {
          stateManager.updateResourceState({ token: true });
          await stateManager.transition('resources_acquiring');
        } else {
          throw new Error('No token available');
        }
      } catch (error) {
        await stateManager.transition('error');
        eventBus.emit({
          type: 'error',
          payload: error instanceof Error ? error.message : 'Failed to initialize token'
        });
      }
    };

    if (currentState === 'uninitialized') {
      initToken();
    }
  }, [currentState]);

  const initializeMap = useCallback(async () => {
    try {
      const instanceManager = mapboxTokenManager.getInstanceManager();
      if (!instanceManager.isReady()) {
        await instanceManager.getMapboxModule();
      }
      stateManager.updateResourceState({ module: true });

      if (!window.mapboxgl) {
        throw new Error('Mapbox GL JS module not properly initialized');
      }

      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      const newMap = new window.mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialLongitude, initialLatitude],
        zoom: isMobile ? 13 : 12,
        pitchWithRotate: !isMobile,
        dragRotate: !isMobile,
        attributionControl: !isMobile,
        preserveDrawingBuffer: true
      });

      if (!isMobile) {
        newMap.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
      }

      const geolocateControl = new window.mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      newMap.addControl(geolocateControl, 'top-right');

      newMap.once('load', async () => {
        setIsLoaded(true);
        map.current = newMap;
        onMapLoad?.(newMap);
        await stateManager.transition('features_activating');
        await stateManager.transition('ready');
      });

      newMap.on('error', async (e) => {
        const errorMessage = e.error ? e.error.message : 'Error loading map';
        await stateManager.transition('error');
        eventBus.emit({
          type: 'error',
          payload: errorMessage
        });
      });

    } catch (error) {
      await stateManager.transition('error');
      eventBus.emit({
        type: 'error',
        payload: error instanceof Error ? error.message : 'Failed to initialize map'
      });
    }
  }, [initialLatitude, initialLongitude, isMobile, onMapLoad]);

  useEffect(() => {
    if (currentState === 'core_initializing') {
      initializeMap();
    }
  }, [currentState, initializeMap]);

  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (currentState === 'error' || !mapboxTokenManager.getTokenState().token) {
    return <MapboxConfig />;
  }

  if (currentState !== 'ready' && !isLoaded) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${height} ${className}`}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
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
