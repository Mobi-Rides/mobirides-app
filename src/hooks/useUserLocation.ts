import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  useEffect(() => {
    if (!mapInstance) {
      console.log("Map instance not available for location tracking");
      return;
    }

    if (!("geolocation" in navigator)) {
      console.log("Geolocation not supported");
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      console.log("User location:", { latitude, longitude });
      
      try {
        mapInstance.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          essential: true // This animation is considered essential for the map's purpose
        });
      } catch (error) {
        console.error("Error flying to user location:", error);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error.message);
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
  }, [mapInstance]);
};