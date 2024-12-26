import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';
import { createUserMarker, handleLocationError } from '@/utils/locationUtils';
import type { LocationState } from '@/types/location';

export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  const [state, setState] = useState<LocationState>({
    watchId: null,
    userMarker: null
  });
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);

  useEffect(() => {
    if (!mapInstance) {
      console.log("Map instance not available for location tracking");
      return;
    }

    if (!("geolocation" in navigator)) {
      console.log("Geolocation not supported");
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log("User location update:", { 
        latitude: latitude.toFixed(6), 
        longitude: longitude.toFixed(6), 
        accuracyInMeters: accuracy 
      });

      // Update best accuracy achieved
      if (!bestAccuracy || accuracy < bestAccuracy) {
        setBestAccuracy(accuracy);
        console.log("New best accuracy achieved:", accuracy, "meters");
      }
      
      try {
        // Remove existing user marker if it exists
        if (state.userMarker) {
          state.userMarker.remove();
        }

        // Create a new marker for user's location
        const newMarker = createUserMarker(longitude, latitude, accuracy, mapInstance);
        setState(prev => ({ ...prev, userMarker: newMarker }));

        // Only fly to location if accuracy is good enough
        if (accuracy <= 50) {
          mapInstance.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            essential: true
          });

          if (accuracy <= 10) {
            toast.success(`High accuracy location obtained: ${Math.round(accuracy)}m`);
          }
        } else {
          toast.warning(`Waiting for better accuracy... Current: ${Math.round(accuracy)}m`);
        }
      } catch (error) {
        console.error("Error updating user location:", error);
        toast.error("Could not update your location on the map");
      }
    };

    // Start watching position with maximum accuracy settings
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 30000, // Increased timeout for better accuracy
        maximumAge: 0 // Always get fresh position
      }
    );
    
    setState(prev => ({ ...prev, watchId: id }));
    console.log("Started watching user location with high accuracy settings, ID:", id);

    // Cleanup function
    return () => {
      if (state.watchId) {
        navigator.geolocation.clearWatch(state.watchId);
        console.log("Stopped watching user location");
      }
      if (state.userMarker) {
        state.userMarker.remove();
      }
    };
  }, [mapInstance]);

  return { watchId: state.watchId, bestAccuracy };
};