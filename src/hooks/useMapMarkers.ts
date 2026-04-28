import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

interface UseMapMarkersProps {
  map: mapboxgl.Map | null;
  mapInit: boolean;
  destination?: { latitude: number; longitude: number } | null;
  isHandoverMode?: boolean;
  handover?: any; // Context data
}

export const useMapMarkers = ({
  map,
  mapInit,
  destination,
  isHandoverMode,
  handover
}: UseMapMarkersProps) => {
  const [handoverMarkers, setHandoverMarkers] = useState<mapboxgl.Marker[]>([]);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Destination Marker
  useEffect(() => {
    if (!map || !mapInit || !destination) return;

    const { latitude, longitude } = destination;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const el = document.createElement("div");
    el.className = "destination-marker";
    el.style.width = "24px";
    el.style.height = "24px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = "#f59e0b";
    el.style.border = "3px solid white";
    el.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";

    const marker = new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML("<p class='font-medium'>Destination</p>"))
      .addTo(map);

    destinationMarkerRef.current = marker;

    return () => {
      marker.remove();
      destinationMarkerRef.current = null;
    };
  }, [map, mapInit, destination]);

  // Handover Markers
  useEffect(() => {
    if (!map || !mapInit || !isHandoverMode || !handover?.handoverStatus) return;

    handoverMarkers.forEach((m) => m.remove());
    const newMarkers: mapboxgl.Marker[] = [];

    // Host location
    if (handover.handoverStatus.host_location) {
      const loc = handover.handoverStatus.host_location;
      const el = document.createElement("div");
      el.className = "host-handover-marker";
      Object.assign(el.style, {
        width: "24px", height: "24px", borderRadius: "50%",
        backgroundColor: "#3b82f6", border: "3px solid white",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)"
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([loc.longitude, loc.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<p class="font-medium">Host Location</p><p class="text-xs">${loc.address}</p>`
        ))
        .addTo(map);
      newMarkers.push(marker);
    }

    // Renter location
    if (handover.handoverStatus.renter_location) {
      const loc = handover.handoverStatus.renter_location;
      const el = document.createElement("div");
      el.className = "renter-handover-marker";
      Object.assign(el.style, {
        width: "24px", height: "24px", borderRadius: "50%",
        backgroundColor: "#ec4899", border: "3px solid white",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)"
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([loc.longitude, loc.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<p class="font-medium">Renter Location</p><p class="text-xs">${loc.address}</p>`
        ))
        .addTo(map);
      newMarkers.push(marker);
    }

    // Fit bounds if both locations exist
    if (newMarkers.length === 2) {
      const bounds = new mapboxgl.LngLatBounds();
      newMarkers.forEach(m => bounds.extend(m.getLngLat()));
      map.fitBounds(bounds, { padding: 100, maxZoom: 15 });
    }

    setHandoverMarkers(newMarkers);

    return () => {
      newMarkers.forEach(m => m.remove());
    };
  }, [map, mapInit, isHandoverMode, handover?.handoverStatus]);

  return {
    handoverMarkers,
    destinationMarker: destinationMarkerRef.current
  };
};
