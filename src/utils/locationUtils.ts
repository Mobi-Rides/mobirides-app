import mapboxgl from 'mapbox-gl';
import { toast } from '@/components/ui/use-toast';

export const createUserMarker = (
  longitude: number,
  latitude: number,
  accuracy: number,
  mapInstance: mapboxgl.Map
): mapboxgl.Marker => {
  const marker = new mapboxgl.Marker({
    color: "#FF0000",
    scale: 0.8
  })
    .setLngLat([longitude, latitude])
    .setPopup(new mapboxgl.Popup().setHTML(`
      <div class="p-2">
        <p class="font-semibold">Your Location</p>
        <p class="text-sm">Accuracy: ${Math.round(accuracy)}m</p>
      </div>
    `))
    .addTo(mapInstance);

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