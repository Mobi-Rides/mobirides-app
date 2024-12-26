import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from '@/components/ui/use-toast';
import { createUserMarker, handleLocationError, getLocationOptions } from '@/utils/locationUtils';
import type { LocationState } from '@/types/location';

export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  const [state, setState] = useState<LocationState>({
    watchId: null,
    userMarker: null
  });

  useEffect(() => {
    if (!mapInstance) {
      console.log("Map instance not available for location tracking");
      return;
    }

    if (!("geolocation" in navigator)) {
      console.log("Geolocation not supported");
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log("User location updated:", { 
        latitude: latitude.toFixed(6), 
        longitude: longitude.toFixed(6), 
        accuracyInMeters: accuracy 
      });
      
      try {
        // Remove existing user marker if it exists
        if (state.userMarker) {
          state.userMarker.remove();
        }

        // Create a new marker for user's location
        const newMarker = createUserMarker(longitude, latitude, accuracy, mapInstance);
        setState(prev => ({ ...prev, userMarker: newMarker }));

        // Only fly to location on first fix or if accuracy improves significantly
        if (!state.watchId || accuracy < 50) {
          mapInstance.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            essential: true
          });
        }
      } catch (error) {
        console.error("Error updating user location:", error);
        toast({
          title: "Location Error",
          description: "Could not update your location on the map",
          variant: "destructive",
        });
      }
    };

    // Start watching position with high accuracy
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
    
    setState(prev => ({ ...prev, watchId: id }));
    console.log("Started watching user location with ID:", id);

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

  return state.watchId;
};