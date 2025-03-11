
import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { mapCore } from "@/utils/mapbox/core/MapCore";
import { toast } from "sonner";

interface CustomMapboxProps {
  mapbox_token: string;
  longitude: number;
  latitude: number;
  mapStyle?: string;
}

const CustomMapbox = ({
  mapbox_token,
  longitude,
  latitude,
  mapStyle = "mapbox://styles/mapbox/streets-v12"
}: CustomMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapInit, setMapInit] = useState<boolean>(false);

  useEffect(() => {
    if (mapbox_token) {
      mapboxgl.accessToken = mapbox_token;
    }

    // Initialize map only if it hasn't been initialized
    if (!map.current && mapContainer.current && mapbox_token) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [longitude, latitude],
        zoom: 14,
      });

      // Add navigation control (zoom in/out)
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add geolocate control
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      });

      map.current.addControl(geolocateControl, "top-right");

      map.current.on("load", () => {
        console.log("Map loaded successfully");
        setMapInit(true);

        if (location.pathname === "/map") {
          // Trigger geolocation on map page
          setTimeout(() => {
            geolocateControl.trigger();
          }, 1000);
        }
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        toast.error("Error loading map. Please refresh.");
      });
    }

    // Cleanup function to remove map on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapbox_token, longitude, latitude, mapStyle]);

  // Update map style when mapStyle prop changes
  useEffect(() => {
    if (map.current && mapInit) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle, mapInit]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 z-10 bg-white dark:bg-gray-800 shadow-md rounded-md p-2">
        <button 
          className="text-xs text-gray-700 dark:text-gray-300" 
          onClick={() => {
            if (map.current) {
              map.current.flyTo({
                center: [longitude, latitude],
                zoom: 14,
                essential: true
              });
            }
          }}
        >
          Reset View
        </button>
      </div>
    </div>
  );
};

export default CustomMapbox;
