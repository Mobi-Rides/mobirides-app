import { useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { createUserMarker } from '@/utils/markerUtils';
import { useLocationAccuracy } from './useLocationAccuracy';
import { useMapCentering } from './useMapCentering';

export const useLocationMarker = (mapInstance: mapboxgl.Map | null) => {
  const { bestAccuracy, updateAccuracy } = useLocationAccuracy();
  const { centerMapOnLocation } = useMapCentering(mapInstance);

  const updateMarker = useCallback((
    position: GeolocationPosition,
    existingMarker: mapboxgl.Marker | null,
    forceCenter?: boolean
  ) => {
    if (!mapInstance) return null;

    const { latitude, longitude, accuracy } = position.coords;
    console.log("Updating user location marker:", { 
      latitude: latitude.toFixed(6), 
      longitude: longitude.toFixed(6), 
      accuracy: `${accuracy.toFixed(1)}m`,
      hasExistingMarker: !!existingMarker,
      forceCenter
    });

    // First remove existing marker
    if (existingMarker) {
      console.log("Removing existing marker before creating new one");
      existingMarker.remove();
    }

    // Create new marker
    const newMarker = createUserMarker(longitude, latitude, accuracy, mapInstance);
    console.log("Created new marker");

    // Update accuracy after marker creation
    updateAccuracy(accuracy);
    
    // Center map with animation but don't lock controls
    if (forceCenter) {
      centerMapOnLocation(longitude, latitude);
    }

    return newMarker;
  }, [mapInstance, updateAccuracy, centerMapOnLocation]);

  return { updateMarker, bestAccuracy };
};