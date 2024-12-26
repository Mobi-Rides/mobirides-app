import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";

interface UseMapLocationProps {
  initialLatitude: number;
  initialLongitude: number;
  mapboxToken: string | null;
  isAdjusting: boolean;
}

export const useMapLocation = ({ 
  initialLatitude, 
  initialLongitude, 
  mapboxToken, 
  isAdjusting 
}: UseMapLocationProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [newCoordinates, setNewCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || !initialLatitude || !initialLongitude) {
      console.log("Missing required parameters for map:", { 
        token: !!mapboxToken, 
        latitude: initialLatitude, 
        longitude: initialLongitude 
      });
      return;
    }

    console.log("Initializing map with coordinates:", { 
      latitude: initialLatitude.toFixed(6), 
      longitude: initialLongitude.toFixed(6) 
    });
    
    mapboxgl.accessToken = mapboxToken;
    
    try {
      // Initialize map if it doesn't exist
      if (!map.current) {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [initialLongitude, initialLatitude],
          zoom: 15,
          pitchWithRotate: false,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      } else {
        // If map exists, just update the center
        map.current.setCenter([initialLongitude, initialLatitude]);
      }

      // Remove existing marker if it exists
      if (marker.current) {
        marker.current.remove();
      }

      // Create new marker
      marker.current = new mapboxgl.Marker({
        color: "#FF0000",
        draggable: isAdjusting
      })
        .setLngLat([initialLongitude, initialLatitude])
        .addTo(map.current);

      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        if (isAdjusting && marker.current) {
          const newLng = e.lngLat.lng;
          const newLat = e.lngLat.lat;
          
          console.log("New marker position from click:", { lat: newLat, lng: newLng });
          marker.current.setLngLat([newLng, newLat]);
          setNewCoordinates({ lat: newLat, lng: newLng });
        }
      };

      map.current.on('click', handleMapClick);

      map.current.on('load', () => {
        console.log("Map loaded successfully at coordinates:", {
          center: map.current?.getCenter(),
          zoom: map.current?.getZoom()
        });
      });

      return () => {
        if (marker.current) {
          marker.current.remove();
          marker.current = null;
        }
        // Don't remove the map on cleanup, just remove the marker
      };
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Error initializing map");
    }
  }, [initialLatitude, initialLongitude, mapboxToken, isAdjusting]);

  return {
    mapContainer,
    map: map.current,
    newCoordinates,
    setNewCoordinates
  };
};