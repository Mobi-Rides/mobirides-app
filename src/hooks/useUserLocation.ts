import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from '@/components/ui/use-toast';
import { createUserMarker, handleLocationError, getLocationOptions } from '@/utils/locationUtils';
import type { LocationState } from '@/types/location';

/**
 * Hook to handle user location tracking on a Mapbox map instance
 * 
 * KNOWN ISSUES:
 * - Location accuracy may vary significantly depending on:
 *   1. Device GPS capabilities
 *   2. Environmental factors (indoor/outdoor, urban canyons)
 *   3. Browser implementation of Geolocation API
 * 
 * TODO: Future optimizations needed:
 * - Implement accuracy threshold filtering
 * - Add fallback to IP-based geolocation
 * - Consider using device orientation for better positioning
 * - Add location accuracy confidence indicator
 * - Implement retry mechanism for failed location attempts
 */
export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  const { toast } = useToast();
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
        latitude, 
        longitude, 
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

        // Only fly to location on first fix
        if (!state.watchId) {
          mapInstance.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            essential: true
          });

          toast({
            title: "Location Found",
            description: `Accuracy: ${Math.round(accuracy)} meters`,
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

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleLocationError,
      getLocationOptions()
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
  }, [mapInstance, toast]);

  return state.watchId;
};