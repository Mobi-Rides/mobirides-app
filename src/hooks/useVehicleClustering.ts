import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { createRoot, Root } from "react-dom/client";
import { ExtendedProfile } from "@/utils/profileTypes";
import { Host } from "@/services/hostService";

interface UseVehicleClusteringProps {
  map: mapboxgl.Map | null;
  mapInit: boolean;
  onlineHosts: ExtendedProfile[];
  onHostSelect: (hostId: string) => void;
  HostPopup: React.ComponentType<{ host: Host; onViewCars: (id: string) => void }>;
}

export const useVehicleClustering = ({
  map,
  mapInit,
  onlineHosts,
  onHostSelect,
  HostPopup
}: UseVehicleClusteringProps) => {
  const popupRootsRef = useRef<Map<HTMLElement, Root>>(new Map());

  useEffect(() => {
    if (!map || !mapInit || !onlineHosts) return;

    const sourceId = "vehicles";
    const clusterLayerId = "clusters";
    const clusterCountLayerId = "cluster-count";
    const unclusteredLayerId = "unclustered-point";

    // Prepare GeoJSON data
    const features = onlineHosts
      .filter(host => host.longitude && host.latitude)
      .map(host => ({
        type: "Feature" as const,
        properties: {
          id: host.id,
          full_name: host.full_name,
          avatar_url: host.avatar_url,
          isActiveHandover: host.isActiveHandover || false,
          updated_at: host.updated_at,
          latitude: host.latitude,
          longitude: host.longitude
        },
        geometry: {
          type: "Point" as const,
          coordinates: [host.longitude!, host.latitude!],
        },
      }));

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    const setupLayers = () => {
      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojson);
        return;
      }

      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: clusterLayerId,
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            10,
            "#f1f075",
            30,
            "#f28cb1",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            10,
            30,
            30,
            40,
          ],
        },
      });

      map.addLayer({
        id: clusterCountLayerId,
        type: "symbol",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
      });

      map.addLayer({
        id: unclusteredLayerId,
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "case",
            ["get", "isActiveHandover"],
            "#ef4444",
            "#4ade80"
          ],
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Handle cluster clicks
      map.on("click", clusterLayerId, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayerId] });
        const clusterId = features[0].properties?.cluster_id;
        (map.getSource(sourceId) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom,
          });
        });
      });

      // Handle host selection on click
      map.on("click", unclusteredLayerId, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [unclusteredLayerId] });
        const hostId = features[0].properties?.id;
        if (hostId) onHostSelect(hostId);
      });

      // Handle popups on hover
      map.on("mouseenter", unclusteredLayerId, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [unclusteredLayerId] });
        if (!features.length) return;
        
        const props = features[0].properties as any;
        const host: Host = {
          id: props.id,
          full_name: props.full_name,
          avatar_url: props.avatar_url,
          updated_at: props.updated_at,
          latitude: props.latitude,
          longitude: props.longitude
        };

        const popupDiv = document.createElement('div');
        const root = createRoot(popupDiv);
        popupRootsRef.current.set(popupDiv, root);
        root.render(<HostPopup host={host} onViewCars={onHostSelect} />);

        new mapboxgl.Popup({
          offset: 15,
          closeButton: false,
          className: 'host-popup'
        })
        .setLngLat((features[0].geometry as any).coordinates)
        .setDOMContent(popupDiv)
        .addTo(map);

        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", unclusteredLayerId, () => {
        map.getCanvas().style.cursor = "";
        // Popups auto-close if configured or we can manage them
      });

      map.on("mouseenter", clusterLayerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", clusterLayerId, () => {
        map.getCanvas().style.cursor = "";
      });
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once("styledata", setupLayers);
    }

    return () => {
      // Cleanup roots
      popupRootsRef.current.forEach(root => root.unmount());
      popupRootsRef.current.clear();
    };
  }, [map, mapInit, onlineHosts, onHostSelect, HostPopup]);

  return null;
};
