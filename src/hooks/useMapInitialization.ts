import { useEffect, useRef, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';

export const useMapInitialization = (
  mapContainer: MutableRefObject<HTMLDivElement | null>,
  mapboxToken: string | null
) => {
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) {
      console.log("Missing required map initialization parameters");
      return;
    }

    try {
      console.log("Starting map initialization...");
      mapboxgl.accessToken = mapboxToken;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [25.9231, -24.6282],
        zoom: 12,
        preserveDrawingBuffer: true // This can help with certain rendering issues
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapInstanceRef.current = map;

      // Wait for map to load before considering initialization complete
      map.on('load', () => {
        console.log("Map loaded successfully");
      });

      return () => {
        console.log("Cleaning up map instance...");
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error during map initialization:", error);
      return undefined;
    }
  }, [mapContainer, mapboxToken]);

  return mapInstanceRef;
};