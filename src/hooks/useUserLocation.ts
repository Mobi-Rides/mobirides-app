import { useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';
import { createUserMarker, handleLocationError } from '@/utils/locationUtils';
import { LOCATION_SETTINGS } from '@/utils/locationConstants';
import { useLocationAccuracy } from './useLocationAccuracy';
import { useMapCentering } from './useMapCentering';
import type { LocationState } from '@/types/location';

export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  const [locationState, setLocationState] = useState<LocationState>({
    watchId: null,
    userMarker: null
  });

  const { bestAccuracy, updateAccuracy } = useLocationAccuracy();
  const { centerMapOnLocation } = useMapCentering(mapInstance);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    if (!mapInstance) return;

    const { latitude, longitude, accuracy } = position.coords;
    console.log("User location update:", { 
      latitude: latitude.toFixed(6), 
      longitude: longitude.toFixed(6), 
      accuracyInMeters: accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      speed: position.coords.speed,
      timestamp: new Date(position.timestamp).toISOString()
    });

    updateAccuracy(accuracy);
    
    try {
      // Remove existing user marker if it exists
      if (locationState.userMarker) {
        locationState.userMarker.remove();
      }

      // Create a new marker for user's location
      const newMarker = createUserMarker(longitude, latitude, accuracy, mapInstance);
      setLocationState(prev => ({ ...prev, userMarker: newMarker }));

      // Center map on new location
      centerMapOnLocation(longitude, latitude);
    } catch (error) {
      console.error("Error updating user location:", error);
      toast.error("Could not update your location on the map");
    }
  }, [mapInstance, locationState.userMarker, updateAccuracy, centerMapOnLocation]);

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

    // Start watching position with maximum accuracy settings
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleLocationError,
      LOCATION_SETTINGS.HIGH_ACCURACY
    );
    
    setLocationState(prev => ({ ...prev, watchId: id }));
    console.log("Started watching user location with high accuracy settings (WiFi enabled), ID:", id);

    return () => {
      if (locationState.watchId) {
        navigator.geolocation.clearWatch(locationState.watchId);
        console.log("Stopped watching user location");
      }
      if (locationState.userMarker) {
        locationState.userMarker.remove();
      }
    };
  }, [mapInstance, handleSuccess]);

  return { watchId: locationState.watchId, bestAccuracy, refreshLocation };
};