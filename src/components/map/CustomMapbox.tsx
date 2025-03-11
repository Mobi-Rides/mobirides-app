
import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapCore } from "@/utils/mapbox/core/MapCore";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useLocation } from "react-router-dom";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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
  const [MapInit, setMapInit] = useState<boolean>(false);
  const { setToken } = useMapboxToken();
  const location = useLocation();

  useEffect(() => {
    if (mapbox_token) {
      mapboxgl.accessToken = mapbox_token;
      setToken(mapbox_token);
    }

    // Initialize map only if it hasn't been initialized
    if (!map.current && mapContainer.current && mapbox_token) {
      const mapCore = new MapCore();
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
  }, [mapbox_token, longitude, latitude, location.pathname, mapStyle, setToken]);

  // Update map style when mapStyle prop changes
  useEffect(() => {
    if (map.current && MapInit) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle, MapInit]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="absolute bottom-4 right-4 z-10 bg-white dark:bg-gray-800 shadow-md"
          >
            Help
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <h3 className="font-medium">Map Controls</h3>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              • Use the + and - buttons to zoom in and out
            </p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              • Click and drag to move around
            </p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              • Click the location button to find your current position
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CustomMapbox;
