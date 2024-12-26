import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';
import { useLocationTracking } from './useLocationTracking';
import { useLocationMarker } from './useLocationMarker';

export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  const { updateMarker, bestAccuracy } = useLocationMarker(mapInstance);
  const { 
    locationState, 
    setLocationState, 
    startTracking, 
    refreshLocation,
    watchIdRef 
  } = useLocationTracking(
    (position: GeolocationPosition) => {
      try {
        const newMarker = updateMarker(position, locationState.userMarker);
        if (newMarker) {
          setLocationState(prev => {
            // Remove old marker if it exists
            if (prev.userMarker) {
              console.log("Cleaning up old marker from state");
              prev.userMarker.remove();
            }
            return { ...prev, userMarker: newMarker };
          });
        }
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

    startTracking();
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationState.userMarker) {
        console.log("Cleaning up marker on unmount");
        locationState.userMarker.remove();
      }
    };
  }, [mapInstance, startTracking, locationState.userMarker, watchIdRef]);

  return { 
    watchId: locationState.watchId, 
    bestAccuracy, 
    refreshLocation 
  };
};