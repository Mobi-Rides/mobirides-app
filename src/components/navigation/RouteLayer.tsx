import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { NavigationRoute } from '@/services/navigationService';

interface RouteLayerProps {
  map: mapboxgl.Map | null;
  route: NavigationRoute | null;
  userLocation: { latitude: number; longitude: number; heading?: number } | null;
  showTraffic?: boolean;
}

export const RouteLayer = ({ map, route, userLocation, showTraffic = false }: RouteLayerProps) => {
  useEffect(() => {
    if (!map || !route) return;

    // Add route line source
    const sourceData: GeoJSON.Feature<GeoJSON.Geometry> = {
      type: 'Feature',
      properties: {},
      geometry: route.geometry
    };

    if (!map.getSource('route-line-source')) {
      map.addSource('route-line-source', {
        type: 'geojson',
        data: sourceData
      });
    } else {
      (map.getSource('route-line-source') as mapboxgl.GeoJSONSource).setData(sourceData);
    }

    // Add route line layer
    if (!map.getLayer('route-line-layer')) {
      map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: 'route-line-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 6,
          'line-opacity': 0.8
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (map.getLayer('route-line-layer')) map.removeLayer('route-line-layer');
      if (map.getSource('route-line-source')) map.removeSource('route-line-source');
    };
  }, [map, route]);

  // Traffic Layer
  useEffect(() => {
    if (!map) return;

    if (showTraffic) {
      if (!map.getLayer('traffic')) {
        map.addSource('mapbox-traffic', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1'
        });
        
        map.addLayer({
          id: 'traffic',
          type: 'line',
          source: 'mapbox-traffic',
          'source-layer': 'traffic',
          paint: {
            'line-width': 2,
            'line-color': [
              'match',
              ['get', 'congestion'],
              'low', '#4caf50',
              'moderate', '#ff9800',
              'heavy', '#f44336',
              'severe', '#b71c1c',
              '#000000'
            ]
          }
        }, 'route-line-layer'); // Place below route line
      }
    } else {
      if (map.getLayer('traffic')) map.removeLayer('traffic');
      if (map.getSource('mapbox-traffic')) map.removeSource('mapbox-traffic');
    }
  }, [map, showTraffic]);

  // Update camera to follow user
  useEffect(() => {
    if (!map || !userLocation) return;

    // Only ease to location if we are in active navigation mode (implied by this component being mounted)
    map.easeTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 17,
      pitch: 45,
      bearing: userLocation.heading || 0,
      duration: 1000
    });
  }, [map, userLocation]);

  return null;
};
