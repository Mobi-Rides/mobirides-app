import { useCallback } from "react";
import mapboxgl from "mapbox-gl";

export const useGeocoding = (mapboxToken: string) => {
  const fetchAddressFromCoordinates = useCallback(async (
    lat: number,
    lng: number
  ): Promise<string | null> => {
    if (!mapboxToken) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
      return null;
    } catch (error) {
      console.error("[useGeocoding] Error fetching address:", error);
      return null;
    }
  }, [mapboxToken]);

  const fetchCoordinatesFromAddress = useCallback(async (
    address: string
  ): Promise<[number, number] | null> => {
    if (!mapboxToken || !address) return null;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features[0].center;
      }
      return null;
    } catch (error) {
      console.error("[useGeocoding] Error fetching coordinates:", error);
      return null;
    }
  }, [mapboxToken]);

  return {
    fetchAddressFromCoordinates,
    fetchCoordinatesFromAddress
  };
};
