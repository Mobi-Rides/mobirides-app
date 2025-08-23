import { useState, useEffect } from "react";
import { Location } from "@/utils/mapbox/location/LocationManager";
import { eventBus } from "@/utils/mapbox/core/eventBus";
import { MapStateEvent, EventSubscriber } from "@/utils/mapbox/core/types";
import { locationStateManager } from "@/utils/mapbox/location/LocationStateManager";

export const useUserLocation = (current: unknown) => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  useEffect(() => {
    const eventSubscriber: EventSubscriber = {
      onEvent: (event: MapStateEvent) => {
        if (event.type === "locationUpdate" && event.payload) {
          const location = event.payload as Location;
          if (location.latitude) {
            setUserLocation(location);
          }
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
