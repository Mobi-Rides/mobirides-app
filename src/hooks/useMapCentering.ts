import { useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_SETTINGS } from '@/utils/locationConstants';

export const useMapCentering = (mapInstance: mapboxgl.Map | null) => {
  const initialCenterDone = useRef(false);

  const centerMapOnLocation = useCallback((longitude: number, latitude: number, forceCenter: boolean = false) => {
    if (!mapInstance) return;

    console.log("Centering map request:", {
      longitude: longitude.toFixed(6),
      latitude: latitude.toFixed(6),
      isInitialCenter: !initialCenterDone.current,
      forceCenter
    });

    // Skip centering if it's not initial load or forced centering
    if (initialCenterDone.current && !forceCenter) {
      console.log("Skipping center - not initial or forced");
      return;
    }

    // Check if user is currently interacting with the map
    if (mapInstance.isEasing() || mapInstance.isMoving()) {
      console.log("Map is currently being manipulated by user, skipping centering");
      return;
    }

    // For initial load, use flyTo for smooth animation
    if (!initialCenterDone.current) {
      console.log("Performing initial center with animation");
      mapInstance.flyTo({
        center: [longitude, latitude],
        zoom: MAP_SETTINGS.ZOOM_LEVEL,
        duration: MAP_SETTINGS.ANIMATION_DURATION,
        essential: true
      });
      initialCenterDone.current = true;
      return;
    }

    // For forced centering (e.g., locate button), use panTo without animation
    if (forceCenter) {
      console.log("Performing forced center without animation");
      mapInstance.panTo([longitude, latitude], {
        duration: 0,
        essential: false
      });
    }
  }, [mapInstance]);

  return { centerMapOnLocation };
};