import { useEffect, useRef, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';

export const useMapInitialization = (
  mapContainer: MutableRefObject<HTMLDivElement | null>,
  mapboxToken: string | null
) => {
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    console.log("Starting map initialization...");
    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [25.9231, -24.6282],
      zoom: 12
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapInstanceRef.current = map;

    return () => {
      console.log("Cleaning up map instance...");
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapContainer, mapboxToken]);

  return mapInstanceRef;
};