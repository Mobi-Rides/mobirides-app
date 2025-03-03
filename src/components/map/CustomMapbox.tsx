import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useUserLocation } from "@/hooks/useUserLocation";
import { locationStateManager } from "@/utils/mapbox/location/LocationStateManager";

interface Location {
  lat: number;
  lng: number;
  label?: string;
}

interface CustomMapboxProps {
  mapbox_token: string;
  longitude?: number;
  latitude?: number;
  locations?: Location[];
  zoom?: number;
  style?: string;
}

const CustomMapbox = ({
  mapbox_token,
  longitude,
  latitude,
  locations = [],
  zoom = 13,
  style = "mapbox://styles/mapbox/streets-v12",
}: CustomMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const { userLocation } = useUserLocation(map.current);
  const [isTracking, setIsTracking] = useState(false);

  const toggleLocationTracking = async () => {
    if (isTracking) {
      locationStateManager.disableTracking();
      setIsTracking(false);
    } else {
      const success = await locationStateManager.enableTracking();
      if (success) {
        setIsTracking(true);
      }
    }
  };

  useEffect(() => {
    if (!locationStateManager.enableTracking) {
      locationStateManager.enableTracking();
    }

    locationStateManager.enableTracking();

    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapbox_token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: style,
      center: [longitude, latitude],
      zoom: zoom,
      pitchWithRotate: true,
      dragRotate: true,
      attributionControl: true,
      preserveDrawingBuffer: true,
    });

    // Add zoom and rotation controls to the map.
    const nav = new mapboxgl.NavigationControl();
    map.current.addControl(nav, "top-right");

    return () => {
      markers.current.forEach((marker) => marker.remove());
      map.current?.remove();
    };
  }, [mapbox_token, longitude, latitude, zoom, style]);

  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Create new markers for locations
    locations.forEach((location) => {
      const marker = new mapboxgl.Marker().setLngLat([
        location.lng,
        location.lat,
      ]);

      if (location.label) {
        marker.setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`<p>${location.label}</p>`)
        );
      }

      marker.addTo(map.current);
      markers.current.push(marker);
    });

    // Optionally, adjust the map view to fit all markers
    if (locations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach((location) =>
        bounds.extend([location.lng, location.lat])
      );
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [locations]);

  useEffect(() => {
    console.log("User location updated:", userLocation);
    if (!map.current || !userLocation) return;

    // Create a marker for the user's location
    const userMarker = new mapboxgl.Marker({ color: "blue" })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map.current);

    // Center map on user's location
    map.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      essential: true,
    });

    // Clean up the user marker on unmount
    return () => {
      userMarker.remove();
    };
  }, [userLocation]);

  const panMap = (direction: "left" | "up" | "right" | "down") => {
    if (!map.current) return;

    const distance = 100; // Distance to pan in pixels
    switch (direction) {
      case "left":
        map.current.panBy([-distance, 0]);
        break;
      case "up":
        map.current.panBy([0, -distance]);
        break;
      case "right":
        map.current.panBy([distance, 0]);
        break;
      case "down":
        map.current.panBy([0, distance]);
        break;
    }
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className="w-full h-full overflow-hidden"
        style={{ minHeight: "400px" }}
      />
      <div className="absolute bottom-6 right-6 bg-white p-2 rounded-full shadow-lg z-10 flex flex-col items-center">
        <button onClick={() => panMap("up")} className="p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4l-8 8h16l-8-8z"
            />
          </svg>
        </button>
        <div className="flex">
          <button onClick={() => panMap("left")} className="p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 12l8-8v16l-8-8z"
              />
            </svg>
          </button>
          <button
            onClick={toggleLocationTracking}
            className="bg-white p-2 rounded-full shadow-lg z-10"
          >
            {isTracking ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
          <button onClick={() => panMap("right")} className="p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12l-8 8V4l8 8z"
              />
            </svg>
          </button>
        </div>
        <button onClick={() => panMap("down")} className="p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 20l8-8H4l8 8z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CustomMapbox;
