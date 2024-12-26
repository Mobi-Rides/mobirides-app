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

    // Check if user is currently interacting with the map
    if (mapInstance.isEasing() || mapInstance.isMoving()) {
      console.log("Map is currently being manipulated by user, skipping centering");
      return;
    }

    // Use panTo for immediate response without animation when user is interacting
    mapInstance.panTo(
      [longitude, latitude],
      {
        duration: 0, // No animation duration
        essential: false // Allow interruption
      }
    );

    // Set zoom level separately to avoid locking
    if (mapInstance.getZoom() !== MAP_SETTINGS.ZOOM_LEVEL) {
      mapInstance.setZoom(MAP_SETTINGS.ZOOM_LEVEL);
    }
  }, [mapInstance]);

  return { centerMapOnLocation };
};