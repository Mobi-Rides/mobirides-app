import mapboxgl from 'mapbox-gl';
import { toast } from '@/components/ui/use-toast';

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
  
  // Create the accuracy circle
  const circle = document.createElement('div');
  circle.className = 'absolute -inset-2 rounded-full bg-blue-500/20 animate-pulse';
  
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
      </div>
    `))
    .addTo(mapInstance);

  console.log("Created user location marker at:", { 
    longitude: longitude.toFixed(6), 
    latitude: latitude.toFixed(6) 
  });

  return marker;
};

export const handleLocationError = (error: GeolocationPositionError) => {
  console.error("Geolocation error:", error.message);
  toast({
    title: "Location Error",
    description: error.message,
    variant: "destructive",
  });
};

export const getLocationOptions = (): PositionOptions => ({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000
});