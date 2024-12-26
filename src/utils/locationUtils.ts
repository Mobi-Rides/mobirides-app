import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';

export const createUserMarker = (
  longitude: number,
  latitude: number,
  accuracy: number,
  mapInstance: mapboxgl.Map
): mapboxgl.Marker => {
  // Create a DOM element for the custom marker
  const el = document.createElement('div');
  el.className = 'relative';
  
  // Create the main marker dot
  const dot = document.createElement('div');
  dot.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg';
  
  // Create the accuracy circle with dynamic size based on accuracy
  const circle = document.createElement('div');
  // Adjust circle size based on accuracy (smaller when more accurate)
  const circleSize = Math.min(Math.max(accuracy / 5, 16), 100); // Min 16px, Max 100px
  circle.style.width = `${circleSize}px`;
  circle.style.height = `${circleSize}px`;
  circle.style.left = `${-circleSize/2 + 8}px`; // Center relative to dot
  circle.style.top = `${-circleSize/2 + 8}px`;
  circle.className = 'absolute rounded-full bg-blue-500/20 animate-pulse';
  
  // Add elements to the marker container
  el.appendChild(circle);
  el.appendChild(dot);

  // Create and return the marker
  const marker = new mapboxgl.Marker({
    element: el,
    anchor: 'center'
  })
    .setLngLat([longitude, latitude])
    .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
      <div class="p-2">
        <p class="font-semibold">Your Location</p>
        <p class="text-sm text-muted-foreground">Accuracy: ${Math.round(accuracy)}m</p>
        ${accuracy > 50 ? 
          '<p class="text-xs text-orange-500">⚠️ Low accuracy. Try moving to an open area.</p>' : 
          '<p class="text-xs text-green-500">✓ Good accuracy</p>'
        }
      </div>
    `))
    .addTo(mapInstance);

  console.log("Created user location marker at:", { 
    longitude: longitude.toFixed(6), 
    latitude: latitude.toFixed(6),
    accuracy: `${accuracy.toFixed(1)}m`
  });

  return marker;
};

export const handleLocationError = (error: GeolocationPositionError) => {
  console.error("Geolocation error:", error.message);
  
  let errorMessage = "Could not get your location. ";
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage += "Please enable location services in your browser settings.";
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage += "Try moving to an area with better GPS signal.";
      break;
    case error.TIMEOUT:
      errorMessage += "It's taking too long to get an accurate position. Try again in an open area.";
      break;
    default:
      errorMessage += error.message;
  }
  
  toast.error(errorMessage);
};