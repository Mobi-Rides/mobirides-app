import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { toast } from "sonner";

interface LocationAwareCustomMapboxProps {
  mapboxToken: string | null;
  selectedLocation: { lat: number; lng: number } | null;
  onMapClick: (lng: number, lat: number) => void;
  onMapRef: (map: mapboxgl.Map | null) => void;
  onGeolocateRef: (control: mapboxgl.GeolocateControl | null) => void;
  onUserLocationUpdate: (location: { latitude: number; longitude: number }) => void;
  mapStyle?: string;
}

export const LocationAwareCustomMapbox = ({
  mapboxToken,
  selectedLocation,
  onMapClick,
  onMapRef,
  onGeolocateRef,
  onUserLocationUpdate,
  mapStyle = "mapbox://styles/mapbox/streets-v12",
}: LocationAwareCustomMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [25.9087, -24.6541], // Gaborone, Botswana
      zoom: 14,
      interactive: true,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add geolocation control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    map.current.addControl(geolocateControl, "top-right");
    onGeolocateRef(geolocateControl);

    // Handle geolocation events
    geolocateControl.on("geolocate", (e: any) => {
      console.log("Geolocate event:", e.coords);
      onUserLocationUpdate({
        latitude: e.coords.latitude,
        longitude: e.coords.longitude,
      });
    });

    geolocateControl.on("error", (e: any) => {
      console.error("Geolocation error:", e);
      toast.error("Unable to access your location. Please check permissions.");
    });

    // Handle map events
    map.current.on("load", () => {
      console.log("Map loaded successfully");
      setMapInitialized(true);
      onMapRef(map.current);
    });

    map.current.on("error", (e) => {
      console.error("Map error:", e);
      toast.error("Error loading map. Please refresh.");
    });

    // Add click handler for location selection
    map.current.on("click", (e) => {
      console.log("Map clicked at:", e.lngLat);
      onMapClick(e.lngLat.lng, e.lngLat.lat);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        onMapRef(null);
        onGeolocateRef(null);
      }
    };
  }, [mapboxToken, mapStyle]);

  // Update marker when selected location changes
  useEffect(() => {
    if (!map.current || !mapInitialized) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }

    // Add new marker if location is selected
    if (selectedLocation) {
      const el = document.createElement("div");
      el.className = "location-marker";
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#ef4444";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";
      el.style.cursor = "pointer";

      // Add pulsing animation
      el.style.animation = "pulse 2s infinite";
      
      // Add CSS for pulse animation if not already added
      if (!document.querySelector("#location-marker-styles")) {
        const style = document.createElement("style");
        style.id = "location-marker-styles";
        style.textContent = `
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        `;
        document.head.appendChild(style);
      }

      marker.current = new mapboxgl.Marker(el, { draggable: true })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(map.current);

      // Handle marker drag
      marker.current.on("dragend", () => {
        const lngLat = marker.current?.getLngLat();
        if (lngLat) {
          console.log("Marker dragged to:", lngLat);
          onMapClick(lngLat.lng, lngLat.lat);
        }
      });

      // Center map on selected location
      map.current.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 16,
        essential: true,
      });
    }
  }, [selectedLocation, mapInitialized]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};