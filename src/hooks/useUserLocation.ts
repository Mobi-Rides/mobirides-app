import { useState, useEffect } from "react";
import { Location } from "@/utils/mapbox/location/LocationManager";
import { eventBus } from "@/utils/mapbox/core/eventBus";
import { locationStateManager } from "@/utils/mapbox/location/LocationStateManager";

export const useUserLocation = (current: unknown) => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  useEffect(() => {
    const eventSubscriber = {
      onEvent: (event: { type: string; payload: Location }) => {
        if (event.type === "locationUpdate" && event.payload.latitude) {
          setUserLocation(event.payload);
        }
      }
    };

    eventBus.subscribe(eventSubscriber);
    locationStateManager.enableTracking();

    return () => {
      eventBus.unsubscribe(eventSubscriber);
      locationStateManager.disableTracking();
    };
  }, []);

  return { userLocation };
};
