
import { useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { mapCore } from "@/utils/mapbox/core/MapCore";
import { locationManager } from "@/utils/mapbox/location/LocationManager";
import { resourceManager } from "@/utils/mapbox/core/resource/ResourceManager";
import { toast } from "sonner";
import { eventBus } from "@/utils/mapbox/core/eventBus";
import { MapStateEvent } from "@/utils/mapbox/core/types";
import { locationStateManager } from "@/utils/mapbox/location/LocationStateManager";
import { stateManager } from "@/utils/mapbox/core/stateManager";

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        // Initialize map with default settings
        const success = await mapCore.initialize(mapContainer.current, {
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-24.6282, 25.9692] as [number, number],
          zoom: 12,
          pitchWithRotate: true,
          dragRotate: true,
          attributionControl: true,
          preserveDrawingBuffer: true
        });

        if (success && locationStateManager.getCurrentState() === 'enabled') {
          // Only start tracking if it's enabled in the state manager
          locationManager.startTracking();
        }
      } catch (error) {
        console.error('[Map] Initialization error:', error);
        toast.error('Failed to initialize map. Please try again.');
      }
    };

    initializeMap();

    // Subscribe to events
    const handleEvent = (event: MapStateEvent) => {
      if (event.type === 'error') {
        toast.error(event.payload);
      } else if (event.type === 'stateChange') {
        switch (event.payload.state) {
          case 'style_loaded':
            toast.success('Map loaded successfully');
            break;
          case 'error':
            toast.error('An error occurred with the map');
            break;
        }
      }
    };

    eventBus.subscribe({ onEvent: handleEvent });

    // Subscribe to state changes
    const handleStateChange = (state: string) => {
      switch (state) {
        case 'resources_acquiring':
          toast.loading('Loading map resources...');
          break;
        case 'ready':
          toast.success('Map is ready');
          break;
        case 'error':
          toast.error('Failed to initialize map');
          break;
      }
    };

    stateManager.subscribe({ onStateChange: handleStateChange });

    // Cleanup
    return () => {
      locationManager.stopTracking();
      mapCore.cleanup();
      eventBus.unsubscribe({ onEvent: handleEvent });
      stateManager.unsubscribe({ onStateChange: handleStateChange });
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="h-[calc(100vh-4rem)]">
          <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Map;
