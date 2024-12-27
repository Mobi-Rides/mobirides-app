import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';
import { useLocationTracking } from './useLocationTracking';
import { useLocationMarker } from './useLocationMarker';

export const useUserLocation = (mapInstance: mapboxgl.Map | null, initialCenter: boolean = false) => {
  const { updateMarker, bestAccuracy } = useLocationMarker(mapInstance);
  const { 
    locationState, 
    setLocationState, 
    startTracking, 
    refreshLocation,
    watchIdRef 
  } = useLocationTracking(
    (position: GeolocationPosition, forceCenter?: boolean) => {
      if (!mapInstance) {
        console.log("Map instance not available, skipping marker update");
        return;
      }

      try {
        const newMarker = updateMarker(position, locationState.userMarker);
        if (newMarker) {
          setLocationState(prev => {
            // Clean up old marker if it exists
            if (prev.userMarker && prev.userMarker !== locationState.userMarker) {
              console.log("Cleaning up previous marker from state");
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

    const watchId = startTracking();
    console.log("Started location tracking with watch ID:", watchId);
    
    return () => {
      // Cleanup on unmount
      if (watchIdRef.current) {
        console.log("Cleaning up location watch:", watchIdRef.current);
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationState.userMarker) {
        console.log("Removing marker on cleanup");
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