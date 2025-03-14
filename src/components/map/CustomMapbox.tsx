
import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { toast } from "sonner";
import Dpad from "./Dpad";
import { OnlineStatusToggle } from "../profile/OnlineStatusToggle";

interface CustomMapboxProps {
  mapbox_token: string;
  longitude: number;
  latitude: number;
  mapStyle?: string;
  onlineHosts?: any[];
}

const CustomMapbox = ({
  mapbox_token,
  longitude,
  latitude,
  onlineHosts,
  mapStyle = "mapbox://styles/mapbox/streets-v12",
}: CustomMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const [mapInit, setMapInit] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState({ latitude, longitude });
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);

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
      geolocateControlRef.current = geolocateControl;

      map.current.on("load", () => {
        console.log("Map loaded successfully");
        setMapInit(true);
        if (geolocateControlRef.current) {
          geolocateControlRef.current.on("geolocate", (e: any) => {
            setUserLocation({
              longitude: e.coords.longitude,
              latitude: e.coords.latitude,
            });
          });
        }

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

  // Display host markers when onlineHosts change
  useEffect(() => {
    if (!map.current || !mapInit || !onlineHosts?.length) return;

    // Remove existing markers
    markers.forEach(marker => marker.remove());
    setMarkers([]);

    // Add new markers
    const newMarkers = onlineHosts.map(host => {
      if (!host.latitude || !host.longitude) return null;

      const el = document.createElement('div');
      el.className = 'host-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#4ade80';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([host.longitude, host.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<p class="font-medium">${host.full_name || 'Host'}</p>`)
        )
        .addTo(map.current!);
      
      return marker;
    }).filter(Boolean) as mapboxgl.Marker[];

    setMarkers(newMarkers);
  }, [onlineHosts, mapInit]);

  // dpad controls
  const onUp = () => {
    if (map.current) {
      map.current.panBy([0, -100], { duration: 500 });
    }
  };

  const onDown = () => {
    if (map.current) {
      map.current.panBy([0, 100], { duration: 500 });
    }
  };

  const onLeft = () => {
    if (map.current) {
      map.current.panBy([-100, 0], { duration: 500 });
    }
  };

  const onRight = () => {
    if (map.current) {
      map.current.panBy([100, 0], { duration: 500 });
    }
  };

  const onReset = () => {
    if (map.current) {
      map.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 20,
        essential: true,
      });
    }
  };

  return (
    <div className="relative w-full h-full bottom-0 left-0 right-0 top-0">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Floating location sharing control */}
      <div className="absolute top-4 left-0 right-0 z-10 mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-3 max-w-md mx-auto flex items-center transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <OnlineStatusToggle />
        </div>
      </div>
      
      <Dpad
        onUp={onUp}
        onDown={onDown}
        onLeft={onLeft}
        onRight={onRight}
        onReset={onReset}
      />
    </div>
  );
};

export default CustomMapbox;
