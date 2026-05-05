import { useState, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { useGeocoding } from "./useGeocoding";

interface UseMapCenterPinProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
  mapboxToken?: string;
}

export const useMapCenterPin = ({ map, enabled, mapboxToken = "" }: UseMapCenterPinProps) => {
  const [centerCoords, setCenterCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [centerAddress, setCenterAddress] = useState<string>("");
  const { fetchAddressFromCoordinates } = useGeocoding(mapboxToken);

  const updateCenter = useCallback(async () => {
    if (!map || !enabled) return;

    const center = map.getCenter();
    setCenterCoords({ lng: center.lng, lat: center.lat });

    try {
      const address = await fetchAddressFromCoordinates(center.lat, center.lng);
      setCenterAddress(address ?? "");
    } catch (error) {
      console.error("Failed to geocode center:", error);
    }
  }, [map, enabled, fetchAddressFromCoordinates]);

  // Subscribe to moveend events
  useEffect(() => {
    if (!map || !enabled) return;

    map.on("moveend", updateCenter);

    return () => {
      map.off("moveend", updateCenter);
    };
  }, [map, enabled, updateCenter]);

  // Separate effect for initial center fetch — avoids synchronous setState in subscription effect
  useEffect(() => {
    if (!map || !enabled) return;
    const timeoutId = setTimeout(() => {
      updateCenter();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [map, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    centerCoords,
    centerAddress,
    refreshCenter: updateCenter
  };
};
