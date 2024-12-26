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
    existingMarker: mapboxgl.Marker | null
  ) => {
    if (!mapInstance) return null;

    const { latitude, longitude, accuracy } = position.coords;
    console.log("Updating user location marker:", { 
      latitude: latitude.toFixed(6), 
      longitude: longitude.toFixed(6), 
      accuracyInMeters: accuracy
    });

    updateAccuracy(accuracy);

    // Remove existing marker if it exists
    if (existingMarker) {
      existingMarker.remove();
    }

    // Create and return new marker
    const newMarker = createUserMarker(longitude, latitude, accuracy, mapInstance);
    centerMapOnLocation(longitude, latitude);

    return newMarker;
  }, [mapInstance, updateAccuracy, centerMapOnLocation]);

  return { updateMarker, bestAccuracy };
};