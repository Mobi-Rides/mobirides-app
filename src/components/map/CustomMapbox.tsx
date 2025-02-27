import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface CustomMapboxProps {
  mapbox_token: string;
  longitude: number;
  latitude: number;
  location?: {
    lat: number;
    lng: number;
    label?: string;
  };
  zoom?: number;
  style?: string;
}

const CustomMapbox = ({
  mapbox_token,
  longitude,
  latitude,
  location,
  zoom = 13,
  style = "mapbox://styles/mapbox/streets-v12",
}: CustomMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapbox_token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: style,
      center: [longitude, latitude],
      zoom: zoom,
      attributionControl: true,
    });

    return () => {
      if (marker.current) {
        marker.current.remove();
      }
      map.current?.remove();
    };
  }, [mapbox_token, longitude, latitude, zoom, style]);

  useEffect(() => {
    if (!map.current || !location) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Create new marker
    marker.current = new mapboxgl.Marker().setLngLat([
      location.lng,
      location.lat,
    ]);

    if (location.label) {
      marker.current.setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`<p>${location.label}</p>`)
      );
    }

    marker.current.addTo(map.current);

    // Center map on marker
    map.current.flyTo({
      center: [location.lng, location.lat],
      essential: true,
    });
  }, [location]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full overflow-hidden"
      style={{ minHeight: "400px" }}
    />
  );
};

export default CustomMapbox;
