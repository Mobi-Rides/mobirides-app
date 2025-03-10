
import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { mapCore } from "@/utils/mapbox/core/MapCore";
import { createMarkerElement } from "@/utils/domUtils";

interface CustomMapboxProps {
  mapbox_token: string;
  longitude: number;
  latitude: number;
  nearbyUsers?: Array<{
    userId: string;
    location: {
      latitude: number;
      longitude: number;
    };
  }>;
}

const CustomMapbox = ({ mapbox_token, longitude, latitude, nearbyUsers = [] }: CustomMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainer.current || map) return;

    mapboxgl.accessToken = mapbox_token;
    const newMap = mapCore.createMap({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 13,
    });

    newMap.on("load", () => {
      setMap(newMap);
    });

    return () => {
      newMap.remove();
      setMap(null);
    };
  }, [mapbox_token, longitude, latitude, map]);

  // Update map center when coordinates change
  useEffect(() => {
    if (map) {
      map.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        essential: true,
      });
    }
  }, [map, longitude, latitude]);
  
  // Handle nearby users markers
  useEffect(() => {
    if (!map) return;
    
    // Clear old markers that aren't in the new data
    const currentUserIds = new Set(nearbyUsers.map(user => user.userId));
    
    markersRef.current.forEach((marker, userId) => {
      if (!currentUserIds.has(userId)) {
        marker.remove();
        markersRef.current.delete(userId);
      }
    });
    
    // Add or update markers for all users
    nearbyUsers.forEach(user => {
      const existingMarker = markersRef.current.get(user.userId);
      
      if (existingMarker) {
        // Update existing marker position
        existingMarker.setLngLat([
          user.location.longitude,
          user.location.latitude
        ]);
      } else {
        // Create a new marker
        const el = document.createElement('div');
        el.className = 'user-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#3b82f6';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
        
        const newMarker = new mapboxgl.Marker({ element: el })
          .setLngLat([user.location.longitude, user.location.latitude])
          .addTo(map);
          
        markersRef.current.set(user.userId, newMarker);
      }
    });
    
    return () => {
      // Cleanup all markers when component unmounts
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
    };
  }, [map, nearbyUsers]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
};

export default CustomMapbox;
