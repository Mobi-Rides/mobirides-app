import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { toast } from "sonner";
import Dpad from "./Dpad";
import { OnlineStatusToggle } from "../profile/OnlineStatusToggle";
import { ExtendedProfile } from "@/utils/profileTypes";
import { useHandover } from "@/contexts/HandoverContext";
import { HandoverLocation } from "@/services/handoverService";
import { HostPopup } from "./HostPopup";
import { HostCarsSideTray } from "./HostCarsSideTray";
import { Host } from "@/services/hostService";
import ReactDOM from "react-dom";

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
}: CustomMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const [mapInit, setMapInit] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState({ latitude, longitude });
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [handoverMarkers, setHandoverMarkers] = useState<mapboxgl.Marker[]>([]);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [isHostTrayOpen, setIsHostTrayOpen] = useState(false);

  // Always call hooks - move conditional logic to usage
  const handoverData = useHandover();
  const handover = isHandoverMode ? handoverData : null;

  useEffect(() => {
    if (!returnLocation) {
      return;
    }
    const long = userLocation.longitude;
    const lat = userLocation.latitude;
    returnLocation(long, lat);
  }, [userLocation]);

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

      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      });

      map.current.addControl(geolocateControl, "top-right");
      geolocateControlRef.current = geolocateControl;

      geolocateControl.on("error", (e: any) => {
        console.error("Geolocation error:", e);
        toast.error(
          "Unable to access your location. Please check your browser permissions."
        );

        if (isHandoverMode && handover) {
          toast.error(
            "Location sharing is required for the handover process. Please enable location access."
          );
        }
      });

      map.current.on("load", () => {
        console.log("Map loaded successfully");
        setMapInit(true);
        if (geolocateControlRef.current) {
          geolocateControlRef.current.on("geolocate", (e: any) => {
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

        setTimeout(() => {
          if (geolocateControlRef.current) {
            geolocateControlRef.current.trigger();
          }
        }, 1000);
      });

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
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapbox_token, longitude, latitude, mapStyle, isHandoverMode, handover]);

  const fetchAddressFromCoordinates = async (
    lat: number,
    lng: number
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapbox_token}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
      return null;
    } catch (error) {
      console.error("Error fetching address:", error);
      return null;
    }
  };

  useEffect(() => {
    if (map.current && mapInit) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle, mapInit]);

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

  useEffect(() => {
    if (!map.current || !mapInit || !onlineHosts?.length || isHandoverMode)
      return;

    markers.forEach((marker) => marker.remove());
    setMarkers([]);

    const newMarkers = onlineHosts
      .map((host) => {
        if (!host.latitude || !host.longitude) return null;

        // Create marker element
        const el = document.createElement("div");
        el.className = "host-marker";
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#4ade80";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";
        el.style.cursor = "pointer";

        // Create popup container
        const popupDiv = document.createElement('div');
        
        // Create marker with custom popup
        const marker = new mapboxgl.Marker(el)
          .setLngLat([host.longitude, host.latitude])
          .addTo(map.current!);

        // Add hover events
        el.addEventListener('mouseenter', () => {
          ReactDOM.render(
            <HostPopup host={host as Host} onViewCars={handleViewHostCars} />,
            popupDiv
          );
          
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
            className: 'host-popup'
          })
          .setDOMContent(popupDiv)
          .addTo(map.current!);

          marker.setPopup(popup);
          popup.addTo(map.current!);
        });

        el.addEventListener('mouseleave', () => {
          setTimeout(() => {
            const popup = marker.getPopup();
            if (popup) {
              popup.remove();
            }
          }, 100);
        });

        // Click to open side tray
        el.addEventListener('click', () => {
          handleViewHostCars(host.id);
        });

        return marker;
      })
      .filter(Boolean) as mapboxgl.Marker[];

    setMarkers(newMarkers);
  }, [onlineHosts, mapInit, isHandoverMode]);

  useEffect(() => {
    if (!map.current || !mapInit || !destination) return;

    const { latitude, longitude } = destination;

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
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<p class="font-medium">Destination</p>`
        )
      )
      .addTo(map.current!);

    return () => {
      marker.remove();
    };
  });

  useEffect(() => {
    if (!map.current || !mapInit || !destination) return;

    const { latitude, longitude } = destination;

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.longitude},${userLocation.latitude};${longitude},${latitude}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0].geometry;

          if (map.current.getSource("route")) {
            (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData(route);
          } else {
            map.current.addSource("route", {
              type: "geojson",
              data: route,
            });

            map.current.addLayer({
              id: "route",
              type: "line",
              source: "route",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#3b82f6",
                "line-width": 5,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };

    fetchRoute();

    return () => {
      if (map.current) {
        if (map.current.getStyle() && map.current.getLayer("route")) {
          map.current.removeLayer("route");
        }
        if (map.current.getStyle() && map.current.getSource("route")) {
          map.current.removeSource("route");
        }
      }
    };
  }, [mapInit, destination, userLocation]);

  useEffect(() => {
    if (
      !map.current ||
      !mapInit ||
      !isHandoverMode ||
      !handover?.handoverStatus
    )
      return;

    handoverMarkers.forEach((marker) => marker.remove());
    setHandoverMarkers([]);

    const newHandoverMarkers: mapboxgl.Marker[] = [];

    if (handover.handoverStatus.host_location) {
      const hostLocation = handover.handoverStatus.host_location;
      const hostEl = document.createElement("div");
      hostEl.className = "host-handover-marker";
      hostEl.style.width = "24px";
      hostEl.style.height = "24px";
      hostEl.style.borderRadius = "50%";
      hostEl.style.backgroundColor = "#3b82f6";
      hostEl.style.border = "3px solid white";
      hostEl.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";

      const hostMarker = new mapboxgl.Marker(hostEl)
        .setLngLat([hostLocation.longitude, hostLocation.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<p class="font-medium">Host Location</p>
             <p class="text-xs">${hostLocation.address}</p>`
          )
        )
        .addTo(map.current!);

      newHandoverMarkers.push(hostMarker);
    }

    if (handover.handoverStatus.renter_location) {
      const renterLocation = handover.handoverStatus.renter_location;
      const renterEl = document.createElement("div");
      renterEl.className = "renter-handover-marker";
      renterEl.style.width = "24px";
      renterEl.style.height = "24px";
      renterEl.style.borderRadius = "50%";
      renterEl.style.backgroundColor = "#ec4899";
      renterEl.style.border = "3px solid white";
      renterEl.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";

      const renterMarker = new mapboxgl.Marker(renterEl)
        .setLngLat([renterLocation.longitude, renterLocation.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<p class="font-medium">Renter Location</p>
             <p class="text-xs">${renterLocation.address}</p>`
          )
        )
        .addTo(map.current!);

      newHandoverMarkers.push(renterMarker);
    }

    if (newHandoverMarkers.length === 2 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      newHandoverMarkers.forEach((marker) => {
        bounds.extend(marker.getLngLat());
      });

      map.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 15,
      });
    }

    setHandoverMarkers(newHandoverMarkers);
  }, [handover?.handoverStatus, mapInit, isHandoverMode]);

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

      <HostCarsSideTray
        isOpen={isHostTrayOpen}
        onClose={() => setIsHostTrayOpen(false)}
        host={selectedHost}
      />
    </div>
  );
};

export default CustomMapbox;
