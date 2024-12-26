import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { LOCATION_SETTINGS } from '@/utils/locationConstants';
import { handleLocationError } from '@/utils/locationUtils';
import type { LocationState } from '@/types/location';

export const useLocationTracking = (handleSuccess: (position: GeolocationPosition) => void) => {
  const [locationState, setLocationState] = useState<LocationState>({
    watchId: null,
    userMarker: null
  });

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      console.log("Geolocation not supported");
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    // Start watching position with maximum accuracy settings
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleLocationError,
      LOCATION_SETTINGS.HIGH_ACCURACY
    );
    
    setLocationState(prev => ({ ...prev, watchId: id }));
    console.log("Started watching user location with high accuracy settings (WiFi enabled), ID:", id);

    return id;
  }, [handleSuccess]);

  const refreshLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    console.log("Manually refreshing location with high accuracy settings...");
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleLocationError,
      LOCATION_SETTINGS.HIGH_ACCURACY
    );
  }, [handleSuccess]);

  return { locationState, setLocationState, startTracking, refreshLocation };
};