import { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { toast } from "sonner";
import Dpad from "./Dpad";
import { OnlineStatusToggle } from "../profile/OnlineStatusToggle";
import { ExtendedProfile } from "@/utils/profileTypes";
import { useHandoverSafe } from "@/contexts/HandoverContext";
import { HandoverLocation } from "@/services/handoverService";
import { HostPopup } from "./HostPopup";
import { HostCarsSideTray } from "./HostCarsSideTray";
import { Host } from "@/services/hostService";
import { createRoot, Root } from "react-dom/client";
import { RouteLayer } from "@/components/navigation/RouteLayer";
import { useMapboxNavigation } from "@/hooks/useMapboxNavigation";
import { useVehicleClustering } from "@/hooks/useVehicleClustering";
import { useGeocoding } from "@/hooks/useGeocoding";
import { useMapMarkers } from "@/hooks/useMapMarkers";
import { useMapControls } from "@/hooks/useMapControls";
import { useMapCenterPin } from "@/hooks/useMapCenterPin";
import { MapCenterPin } from "./MapCenterPin";

// Host interface for route calculations
interface HostLocation {
  longitude?: number;
  latitude?: number;
  isActiveHandover?: boolean;
}

interface CustomMapboxProps {
  mapbox_token: string;
  longitude: number;
  latitude: number;
  onlineHosts?: ExtendedProfile[];
  mapStyle?: string;
  isHandoverMode?: boolean;
  bookingId?: string | null;
  returnLocation?: (long: number, lat: number) => void;
  interactive?: boolean;
  dpad?: boolean;
  zoom?: number;
  locationToggle?: boolean;
  destination?: { latitude: number; longitude: number } | null;
  onRouteFound?: (steps: any[]) => void;
}

const CustomMapbox = ({
  mapbox_token,
  longitude,
  latitude,
  onlineHosts,
  mapStyle = "mapbox://styles/mapbox/streets-v12",
  isHandoverMode = false,
  bookingId,
  zoom,
  interactive,
  dpad,
  locationToggle,
  destination,
  returnLocation,
  onRouteFound,
}: CustomMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const geolocateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoRouteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mapInit, setMapInit] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState({ latitude, longitude });
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [isHostTrayOpen, setIsHostTrayOpen] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  
  const { 
    navigationState, 
    fetchRoute, 
    clearRoute 
  } = useMapboxNavigation(mapInstance, mapInit);

  const { fetchAddressFromCoordinates } = useGeocoding(mapbox_token);

  // MOB-20: Manage markers
  useMapMarkers({
    map: mapInstance,
    mapInit,
    destination,
    isHandoverMode,
    handover
  });

  const { onUp, onDown, onLeft, onRight, onReset } = useMapControls({
    map: mapInstance,
    userLocation
  });

  const { centerAddress, centerCoords } = useMapCenterPin({
    map: mapInstance,
    enabled: true // Always show for now, can be toggled via props later
  });

  // MOB-18: Enable vehicle clustering
  useVehicleClustering({
    map: mapInstance,
    mapInit,
    onlineHosts: onlineHosts || [],
    onHostSelect: (hostId) => handleViewHostCars(hostId),
    HostPopup
  });

  // Always call hooks - move conditional logic to usage
  const handoverData = useHandoverSafe();
  const handover = isHandoverMode ? handoverData : null;

  // Memoize returnLocation callback to prevent unnecessary re-renders
  const returnLocationCallback = useCallback(() => {
    if (!returnLocation) {
      return;
    }
    const long = userLocation.longitude;
    const lat = userLocation.latitude;
    returnLocation(long, lat);
  }, [returnLocation, userLocation.longitude, userLocation.latitude]);

  useEffect(() => {
    returnLocationCallback();
  }, [returnLocationCallback]);

  useEffect(() => {
    if (mapbox_token) {
      mapboxgl.accessToken = mapbox_token;
    }

    if (!map.current && mapContainer.current && mapbox_token) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [longitude, latitude],
        zoom: zoom ? zoom : 14,
        interactive: interactive ? interactive : true,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Only add GeolocateControl if in a secure context or not localhost (browsers block geolocation on insecure origins)
      // Also allow if it looks like a local network IP (192.168.x.x, 10.x.x.x, etc)
      const isLocalNetwork = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.endsWith('.local');

      if (window.isSecureContext || isLocalNetwork) {
        try {
          const geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true,
              timeout: 10000, // 10 seconds timeout
            },
            trackUserLocation: true,
            showUserHeading: true,
          });

          map.current.addControl(geolocateControl, "top-right");
          geolocateControlRef.current = geolocateControl;

          geolocateControl.on("error", (e: GeolocationPositionError) => {
            console.error("Geolocation error:", e);

            // If geolocation fails (e.g. denied or timeout), fallback to default
            if (!userLocation.latitude || !userLocation.longitude) {
              console.log("Geolocation failed, using default location");
              // Default to Gaborone if no location
              setUserLocation({
                latitude: -24.65451,
                longitude: 25.90859
              });
            }

            toast.error(
              "Unable to access your location. Using default location."
            );
          });
        } catch (e) {
          console.warn("GeolocateControl failed to initialize:", e);
        }
      } else {
        console.warn("Insecure context detected, skipping GeolocateControl");
        toast.info("Location services unavailable (Insecure connection). Using default location.");
      }

      map.current.on("load", () => {
        console.log("Map loaded successfully");
        setMapInit(true);
        setMapInstance(map.current);

        // If on localhost/insecure context, fly to default location manually since GeolocateControl might fail
        if (isLocalNetwork) {
          // Try to trigger geolocation first
          if (geolocateControlRef.current) {
            console.log("Triggering geolocation on local network...");
            geolocateControlRef.current.trigger();
          } else {
            // Fallback if no control
            map.current?.flyTo({
              center: [25.90859, -24.65451], // Gaborone
              zoom: 14
            });
          }
        }
        if (geolocateControlRef.current) {
          geolocateControlRef.current.on("geolocate", (e: { coords: { latitude: number; longitude: number } }) => {
            console.log("Geolocate event fired:", e.coords);
            const newLocation = {
              longitude: e.coords.longitude,
              latitude: e.coords.latitude,
            };

            setUserLocation(newLocation);
            console.log("User location updated:", newLocation);

            if (isHandoverMode && handover) {
              console.log("In handover mode, updating handover location...");
              fetchAddressFromCoordinates(
                newLocation.latitude,
                newLocation.longitude
              ).then((address) => {
                console.log("Address fetched:", address);
                handover.updateLocation({
                  latitude: newLocation.latitude,
                  longitude: newLocation.longitude,
                  address: address || "Unknown location",
                });
              });
            }
          });
        }

        geolocateTimeoutRef.current = setTimeout(() => {
          if (geolocateControlRef.current) {
            geolocateControlRef.current.trigger();
          }
        }, 1000);
      });

      map.current.on("movestart", () => setIsMapMoving(true));
      map.current.on("moveend", () => setIsMapMoving(false));

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        toast.error("Error loading map. Please refresh.");
      });

      // Add click handler for location selection if returnLocation is provided
      if (returnLocation) {
        map.current.on("click", (e) => {
          console.log("Map clicked at coordinates:", e.lngLat);
          returnLocation(e.lngLat.lng, e.lngLat.lat);
        });
      }
    }

    return () => {
      // Clear all timeouts
      if (geolocateTimeoutRef.current) {
        clearTimeout(geolocateTimeoutRef.current);
        geolocateTimeoutRef.current = null;
      }
      if (autoRouteTimeoutRef.current) {
        clearTimeout(autoRouteTimeoutRef.current);
        autoRouteTimeoutRef.current = null;
      }

      // Clean up markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Remove map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapbox_token, longitude, latitude, mapStyle, isHandoverMode, handover, zoom, interactive, returnLocation]);



  useEffect(() => {
    if (map.current && mapInit) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle, mapInit]);

  // Fly to user location when it's updated
  useEffect(() => {
    if (map.current && mapInit && userLocation.latitude && userLocation.longitude) {
      // Only fly if we have actual user location (not the default)
      const hasUserLocation = userLocation.latitude !== latitude || userLocation.longitude !== longitude;
      if (hasUserLocation) {
        console.log("Flying to user location:", userLocation);
        map.current.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 15,
          duration: 1500,
          essential: true
        });
      }
    }
  }, [userLocation, mapInit, latitude, longitude]);

  const handleViewHostCars = (hostId: string) => {
    console.log("Trying to view cars for host:", hostId);
    const host = onlineHosts?.find(h => h.id === hostId);
    console.log("Found host:", host);
    if (host) {
      // Convert ExtendedProfile to Host type
      const hostData: Host = {
        id: host.id,
        full_name: host.full_name,
        avatar_url: host.avatar_url,
        latitude: host.latitude,
        longitude: host.longitude,
        updated_at: host.updated_at
      };
      console.log("Setting selected host:", hostData);
      setSelectedHost(hostData);
      setIsHostTrayOpen(true);
    } else {
      console.log("No host found with ID:", hostId);
    }
  };

  // Function to show route to a specific host
  const showRouteToHost = (host: HostLocation) => {
    if (!host.latitude || !host.longitude || !userLocation.latitude || !userLocation.longitude) return;
    
    fetchRoute(
      [userLocation.longitude, userLocation.latitude],
      [host.longitude, host.latitude],
      "host-route",
      onRouteFound,
      host.isActiveHandover ? "#ef4444" : "#3b82f6",
      host.isActiveHandover ? 6 : 4
    );
  };

  // MOB-18: Auto-route logic for active handover
  useEffect(() => {
    if (!mapInit || !onlineHosts?.length || !userLocation.latitude) return;

    const activeHandoverHost = onlineHosts?.find(host => host.isActiveHandover);
    if (activeHandoverHost) {
      if (autoRouteTimeoutRef.current) clearTimeout(autoRouteTimeoutRef.current);

      autoRouteTimeoutRef.current = setTimeout(() => {
        showRouteToHost(activeHandoverHost);
      }, 1000);
    }
  }, [onlineHosts, mapInit, userLocation]);





  return (
    <div className="relative w-full h-full bottom-0 left-0 right-0 top-0">
      <div ref={mapContainer} className="w-full h-full" />

      {!isHandoverMode && (
        <div className="absolute top-4 left-0 right-0 z-10 mx-auto flex justify-center pointer-events-none">
          <div
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg rounded-full py-2 px-4 
                        max-w-xs w-auto pointer-events-auto transition-all duration-300 
                        border border-gray-200 dark:border-gray-700"
          >
            {locationToggle && (
              <OnlineStatusToggle
                lat={userLocation.latitude}
                long={userLocation.longitude}
              />
            )}
          </div>
        </div>
      )}

      {isHandoverMode && handover?.handoverStatus && (
        <div className="absolute top-4 left-0 right-0 z-10 mx-auto flex justify-center pointer-events-none">
          <div
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg rounded-full py-2 px-4 
                        max-w-xs w-auto pointer-events-auto transition-all duration-300 
                        border border-gray-200 dark:border-gray-700"
          >
            <div className="text-center">
              <p className="text-sm font-medium">
                {handover.isHost ? "Host" : "Renter"} Mode
              </p>
              <p className="text-xs text-muted-foreground">
                {handover.handoverStatus.host_location &&
                  handover.handoverStatus.renter_location
                  ? "Both locations shared"
                  : "Waiting for location..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {dpad && (
        <Dpad
          onUp={onUp}
          onDown={onDown}
          onLeft={onLeft}
          onRight={onRight}
          onReset={onReset}
        />
      )}

      <MapCenterPin
        isVisible={!navigationState.isNavigating}
        address={centerAddress}
        isMoving={isMapMoving}
      />

      <HostCarsSideTray
        isOpen={isHostTrayOpen}
        onClose={() => setIsHostTrayOpen(false)}
        host={selectedHost}
      />

      {navigationState.isNavigating && (
        <RouteLayer
          map={mapInstance}
          route={navigationState.activeRoute}
          userLocation={userLocation}
          showTraffic={navigationState.showTraffic}
        />
      )}
    </div>
  );
};

export default CustomMapbox;
