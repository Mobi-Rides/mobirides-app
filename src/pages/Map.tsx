
import { useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { mapCore } from "@/utils/mapbox/core/MapCore";
import { locationManager } from "@/utils/mapbox/location/LocationManager";
import { resourceManager } from "@/utils/mapbox/core/resource/ResourceManager";
import { toast } from "sonner";
import { eventBus } from "@/utils/mapbox/core/eventBus";
import { MapStateEvent } from "@/utils/mapbox/core/types";

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current) return;

      // Set DOM container resource
      resourceManager.getResource('dom')?.setContainer(mapContainer.current);

      // Initialize map with default settings
      const success = await mapCore.initialize(mapContainer.current, {
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-24.6282, 25.9692],
        zoom: 12,
        pitchWithRotate: true,
        dragRotate: true,
        attributionControl: true,
        preserveDrawingBuffer: true
      });

      if (success) {
        // Start location tracking
        locationManager.startTracking();
      }
    };

    initializeMap();

    // Subscribe to events
    const handleEvent = (event: MapStateEvent) => {
      if (event.type === 'error') {
        toast.error(event.payload);
      }
    };

    eventBus.subscribe({ onEvent: handleEvent });

    // Cleanup
    return () => {
      locationManager.stopTracking();
      mapCore.cleanup();
      eventBus.unsubscribe({ onEvent: handleEvent });
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
