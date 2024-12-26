import { useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';
import { createUserMarker, handleLocationError } from '@/utils/locationUtils';
import type { LocationState } from '@/types/location';

export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  const [locationState, setLocationState] = useState<LocationState>({
    watchId: null,
    userMarker: null
  });
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    if (!mapInstance) return;

    const { latitude, longitude, accuracy } = position.coords;
    console.log("User location update:", { 
      latitude: latitude.toFixed(6), 
      longitude: longitude.toFixed(6), 
      accuracyInMeters: accuracy,
      // Log additional position information if available
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      speed: position.coords.speed,
      timestamp: new Date(position.timestamp).toISOString()
    });

    // Update best accuracy achieved
    setBestAccuracy(prev => {
      if (!prev || accuracy < prev) {
        console.log("New best accuracy achieved:", accuracy, "meters");
        return accuracy;
      }
      return prev;
    });
    
    try {
      // Remove existing user marker if it exists
      if (locationState.userMarker) {
        locationState.userMarker.remove();
      }

      // Create a new marker for user's location
      const newMarker = createUserMarker(longitude, latitude, accuracy, mapInstance);
      setLocationState(prev => ({ ...prev, userMarker: newMarker }));

      // Calculate the vertical offset to center the marker
      const mapDiv = mapInstance.getContainer();
      const verticalOffset = mapDiv.clientHeight * 0.25; // Offset by 25% of the viewport height

      // Always fly to location when manually refreshing, with vertical offset
      mapInstance.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        essential: true,
        duration: 1000,
        offset: [0, verticalOffset], // This ensures the marker appears in the center-bottom area
        padding: { top: 50, bottom: 50, left: 50, right: 50 } // Add padding to ensure visibility
      });

      // Provide more detailed feedback about location accuracy
      if (accuracy <= 50) {
        if (accuracy <= 10) {
          toast.success(`High accuracy location obtained (${Math.round(accuracy)}m)`);
        } else {
          toast.success(`Good accuracy location obtained (${Math.round(accuracy)}m)`);
        }
      } else {
        toast.warning(`Still improving accuracy... Current: ${Math.round(accuracy)}m`);
      }
    } catch (error) {
      console.error("Error updating user location:", error);
      toast.error("Could not update your location on the map");
    }
  }, [mapInstance, locationState.userMarker]);

  const refreshLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    console.log("Manually refreshing location with high accuracy settings...");
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true, // This enables use of WiFi and other sources
        timeout: 30000, // Increased timeout for better accuracy
        maximumAge: 0 // Always get fresh position
      }
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
      {
        enableHighAccuracy: true, // Enable WiFi and other sources
        timeout: 30000,
        maximumAge: 0
      }
    );
    
    setLocationState(prev => ({ ...prev, watchId: id }));
    console.log("Started watching user location with high accuracy settings (WiFi enabled), ID:", id);

    // Cleanup function
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