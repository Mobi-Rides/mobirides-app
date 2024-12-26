import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';
import { useLocationTracking } from './useLocationTracking';
import { useLocationMarker } from './useLocationMarker';

export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  const { updateMarker, bestAccuracy } = useLocationMarker(mapInstance);
  const { locationState, setLocationState, startTracking, refreshLocation } = useLocationTracking(
    (position: GeolocationPosition) => {
      try {
        const newMarker = updateMarker(position, locationState.userMarker);
        setLocationState(prev => ({ ...prev, userMarker: newMarker }));
      } catch (error) {
        console.error("Error updating user location:", error);
        toast.error("Could not update your location on the map");
      }
    }
  );

  useEffect(() => {
    if (!mapInstance) {
      console.log("Map instance not available for location tracking");
      return;
    }

    const watchId = startTracking();
    
    return () => {
      if (locationState.watchId) {
        navigator.geolocation.clearWatch(locationState.watchId);
        console.log("Stopped watching user location");
      }
      if (locationState.userMarker) {
        locationState.userMarker.remove();
      }
    };
  }, [mapInstance, startTracking, locationState.watchId, locationState.userMarker]);

  return { watchId: locationState.watchId, bestAccuracy, refreshLocation };
};