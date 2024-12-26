import { useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_SETTINGS } from '@/utils/locationConstants';

export const useMapCentering = (mapInstance: mapboxgl.Map | null) => {
  const centerMapOnLocation = useCallback((longitude: number, latitude: number) => {
    if (!mapInstance) return;

    console.log("Centering map on coordinates:", {
      longitude: longitude.toFixed(6),
      latitude: latitude.toFixed(6)
    });

    // Use easeTo for smoother movement without locking controls
    mapInstance.easeTo({
      center: [longitude, latitude],
      zoom: MAP_SETTINGS.ZOOM_LEVEL,
      duration: MAP_SETTINGS.ANIMATION_DURATION,
      essential: false // Allow interruption of animation
    });
  }, [mapInstance]);

  return { centerMapOnLocation };
};