import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  useEffect(() => {
    if (!mapInstance || !("geolocation" in navigator)) return;

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      console.log("User location:", { latitude, longitude });
      
      mapInstance.flyTo({
        center: [longitude, latitude],
        zoom: 14
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error.message);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
  }, [mapInstance]);
};