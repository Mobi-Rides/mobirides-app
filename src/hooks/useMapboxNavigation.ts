import { useState, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";
import { navigationService } from "@/services/navigationService";

interface NavigationState {
  activeRoute: any;
  currentStepIndex: number;
  isNavigating: boolean;
  showTraffic: boolean;
}

export const useMapboxNavigation = (map: mapboxgl.Map | null, mapInit: boolean) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeRoute: null,
    currentStepIndex: 0,
    isNavigating: false,
    showTraffic: false
  });

  useEffect(() => {
    return navigationService.subscribe((state) => {
      setNavigationState(state);
    });
  }, []);

  const fetchRoute = useCallback(async (
    start: [number, number], 
    end: [number, number], 
    sourceId: string, 
    onRouteFound?: (steps: any[]) => void,
    color: string = "#3b82f6",
    lineWidth: number = 5
  ) => {
    if (!map || !mapInit || !mapboxgl.accessToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`
      );

      if (!response.ok) {
        console.warn('Route fetch failed:', response.statusText);
        return;
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry;
        const steps = data.routes[0].legs[0].steps;

        if (onRouteFound && steps) {
          onRouteFound(steps.map((step: any) => ({
            instruction: step.maneuver.instruction,
            distance: step.distance,
            duration: step.duration,
            maneuver: step.maneuver.type,
            road_name: step.name
          })));
        }

        const layerId = `${sourceId}-layer`;

        if (map.getSource(sourceId)) {
          (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(route);
        } else {
          map.addSource(sourceId, {
            type: "geojson",
            data: route,
          });

          map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": color,
              "line-width": lineWidth,
            },
          });
        }

        // Fit map to show both locations
        const bounds = new mapboxgl.LngLatBounds()
          .extend(start)
          .extend(end);

        map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });

        return route;
      }
    } catch (error) {
      console.error("[useMapboxNavigation] Error fetching route:", error);
      toast.error("Unable to calculate route");
    }
  }, [map, mapInit]);

  const clearRoute = useCallback((sourceId: string) => {
    if (!map) return;
    const layerId = `${sourceId}-layer`;
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }, [map]);

  return { 
    navigationState, 
    fetchRoute,
    clearRoute
  };
};
