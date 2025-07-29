import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface LocationSelectionMarkerProps {
  map: mapboxgl.Map | null;
  coordinates: { lat: number; lng: number } | null;
  onLocationChange?: (coordinates: { lat: number; lng: number }) => void;
}

export const LocationSelectionMarker = ({
  map,
  coordinates,
  onLocationChange,
}: LocationSelectionMarkerProps) => {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map || !coordinates) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create custom marker element
    const el = document.createElement("div");
    el.className = "location-selection-marker";
    el.style.width = "30px";
    el.style.height = "30px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = "#10b981";
    el.style.border = "3px solid white";
    el.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    el.style.cursor = "pointer";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";

    // Add pulse animation
    el.style.animation = "pulse 2s infinite";

    // Add CSS animation if not already present
    if (!document.querySelector("#location-marker-styles")) {
      const style = document.createElement("style");
      style.id = "location-marker-styles";
      style.textContent = `
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 10px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Create marker
    markerRef.current = new mapboxgl.Marker(el, { draggable: true })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(map);

    // Add drag event listener
    if (onLocationChange) {
      markerRef.current.on("dragend", () => {
        const lngLat = markerRef.current?.getLngLat();
        if (lngLat) {
          onLocationChange({ lat: lngLat.lat, lng: lngLat.lng });
        }
      });
    }

    // Add popup
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(
        `<div class="text-center">
          <p class="font-medium text-green-600">Pickup Location</p>
          <p class="text-xs text-muted-foreground">Drag to adjust</p>
        </div>`
      );

    markerRef.current.setPopup(popup);

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, coordinates, onLocationChange]);

  return null;
};