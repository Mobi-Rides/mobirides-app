import mapboxgl from 'mapbox-gl';
import { createMarkerElement } from './domUtils';

export const createUserMarker = (
  longitude: number,
  latitude: number,
  accuracy: number,
  mapInstance: mapboxgl.Map
): mapboxgl.Marker => {
  const el = createMarkerElement(accuracy);

  // Create and return the marker
  const marker = new mapboxgl.Marker({
    element: el,
    anchor: 'center'
  })
    .setLngLat([longitude, latitude])
    .setPopup(createMarkerPopup(accuracy))
    .addTo(mapInstance);

  console.log("Created user location marker at:", { 
    longitude: longitude.toFixed(6), 
    latitude: latitude.toFixed(6),
    accuracy: `${accuracy.toFixed(1)}m`
  });

  return marker;
};

const createMarkerPopup = (accuracy: number) => {
  return new mapboxgl.Popup({ offset: 25 }).setHTML(`
    <div class="p-2">
      <p class="font-semibold">Your Location</p>
      <p class="text-sm text-muted-foreground">Accuracy: ${Math.round(accuracy)}m</p>
      ${accuracy > 50 ? 
        '<p class="text-xs text-orange-500">⚠️ Low accuracy. Try moving to an open area.</p>' : 
        '<p class="text-xs text-green-500">✓ Good accuracy</p>'
      }
    </div>
  `);
};