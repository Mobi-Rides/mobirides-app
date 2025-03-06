
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useUserLocation } from "@/hooks/useUserLocation";
import { locationStateManager } from "@/utils/mapbox/location/LocationStateManager";
import { Button } from "@/components/ui/button";
import { eventBus } from "@/utils/mapbox/core/eventBus";

interface Location {
  lat: number;
  lng: number;
  label?: string;
}

interface RealtimeLocation {
  carId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  userId: string;
  timestamp: string;
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
  const realtimeMarkers = useRef<Record<string, mapboxgl.Marker>>({});
  const { userLocation } = useUserLocation(map.current);
  const [isTracking, setIsTracking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const toggleLocationTracking = async () => {
    if (isTracking) {
      locationStateManager.disableTracking();
      setIsTracking(false);
      setIsSharing(false);
    } else {
      const success = await locationStateManager.enableTracking();
      if (success) {
        setIsTracking(true);
      }
    }
  };

  const toggleLocationSharing = () => {
    const currentScope = locationStateManager.getSharingScope();
    const newScope = currentScope !== 'none' ? 'none' : 'all';
    locationStateManager.setSharingScope(newScope);
    setIsSharing(newScope !== 'none');
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
      Object.values(realtimeMarkers.current).forEach(marker => marker.remove());
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

  // Subscribe to real-time location updates
  useEffect(() => {
    const handleRealtimeUpdate = (event: any) => {
      if (event.type === 'realtimeLocationUpdate' && map.current) {
        const update = event.payload as RealtimeLocation;
        console.log('Real-time location update received:', update);
        
        // If we already have a marker for this car, update its position
        if (realtimeMarkers.current[update.carId]) {
          realtimeMarkers.current[update.carId].setLngLat([
            update.location.longitude,
            update.location.latitude
          ]);
          console.log('Updated existing marker position');
        } else {
          // Create a new marker for this car
          const carMarker = new mapboxgl.Marker({ color: "green" })
            .setLngLat([update.location.longitude, update.location.latitude])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<p>Car ID: ${update.carId}</p>
               <p>Updated: ${new Date(update.timestamp).toLocaleTimeString()}</p>`
            ))
            .addTo(map.current);
            
          realtimeMarkers.current[update.carId] = carMarker;
          console.log('Created new real-time marker');
        }
      }
    };

    // Subscribe to real-time location events
    const subscriber = {
      onEvent: handleRealtimeUpdate
    };
    
    eventBus.subscribe(subscriber);
    
    return () => {
      eventBus.unsubscribe(subscriber);
    };
  }, []);

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
      
      {/* Location controls */}
      <div className="absolute bottom-6 left-6 bg-white p-2 rounded-lg shadow-lg z-10 flex flex-col gap-2">
        <Button 
          onClick={toggleLocationTracking}
          variant={isTracking ? "outline" : "default"}
          className="flex items-center gap-2"
        >
          {isTracking ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
              Stop Tracking
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
              Start Tracking
            </>
          )}
        </Button>
        
        {isTracking && (
          <Button 
            onClick={toggleLocationSharing}
            variant={isSharing ? "outline" : "default"}
            className="flex items-center gap-2"
          >
            {isSharing ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                Stop Sharing
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share Location
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Map navigation controls */}
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
