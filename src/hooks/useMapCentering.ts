import { useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_SETTINGS } from '@/utils/locationConstants';

export const useMapCentering = (mapInstance: mapboxgl.Map | null) => {
  const centerMapOnLocation = useCallback((longitude: number, latitude: number) => {
    if (!mapInstance) return;

    const mapDiv = mapInstance.getContainer();
    const verticalOffset = -mapDiv.clientHeight * MAP_SETTINGS.VERTICAL_OFFSET_PERCENT;

    // Use flyTo instead of easeTo for smoother animation
    mapInstance.flyTo({
      center: [longitude, latitude],
      zoom: MAP_SETTINGS.ZOOM_LEVEL,
      duration: MAP_SETTINGS.ANIMATION_DURATION,
      offset: [0, verticalOffset],
      essential: true // This ensures the animation won't be interrupted
    });
  }, [mapInstance]);

  return { centerMapOnLocation };
};