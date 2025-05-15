
import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapMarkersProps {
  map: mapboxgl.Map | null;
  isLoaded: boolean;
  hostLocation: { lat: number; lng: number; } | null;
  renterDetails: {
    startLocation: {
      coordinates: { lat: number; lng: number; };
    };
    destination: {
      coordinates: { lat: number; lng: number; };
    };
  };
}

export const MapMarkers = ({ map, isLoaded, hostLocation, renterDetails }: MapMarkersProps) => {
  useEffect(() => {
    if (!map || !isLoaded) {
      console.log("Map not ready yet");
      return;
    }

    // Clear existing markers
    const markers = document.querySelectorAll('.host-marker, .user-marker, .destination-marker');
    console.log("Clearing existing markers:", markers.length);
    markers.forEach(marker => marker.remove());

    // Add fixed renter location marker
    if (renterDetails.startLocation.coordinates) {
      const renterMarker = document.createElement('div');
      renterMarker.className = 'user-marker';
      renterMarker.innerHTML = `
        <div class="bg-blue-500 text-white p-2 rounded-full shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
        </div>
      `;

      new mapboxgl.Marker({ element: renterMarker })
        .setLngLat([renterDetails.startLocation.coordinates.lng, renterDetails.startLocation.coordinates.lat])
        .addTo(map);
    }

    // Add destination marker
    if (renterDetails.destination.coordinates) {
      const destinationMarker = document.createElement('div');
      destinationMarker.className = 'destination-marker';
      destinationMarker.innerHTML = `
        <div class="bg-destructive text-white p-2 rounded-full shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `;

      new mapboxgl.Marker({ element: destinationMarker })
        .setLngLat([renterDetails.destination.coordinates.lng, renterDetails.destination.coordinates.lat])
        .addTo(map);
    }

    // Add host marker
    if (hostLocation) {
      const hostMarker = document.createElement('div');
      hostMarker.className = 'host-marker';
      hostMarker.innerHTML = `
        <div class="bg-primary text-white p-2 rounded-full shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.7 0-1.4.3-1.8.8L2 9.1V15c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
      `;

      new mapboxgl.Marker({ element: hostMarker })
        .setLngLat([hostLocation.lng, hostLocation.lat])
        .addTo(map);

      // Fit bounds to include all markers
      const bounds = new mapboxgl.LngLatBounds()
        .extend([hostLocation.lng, hostLocation.lat])
        .extend([renterDetails.startLocation.coordinates.lng, renterDetails.startLocation.coordinates.lat])
        .extend([renterDetails.destination.coordinates.lng, renterDetails.destination.coordinates.lat]);

      map.fitBounds(bounds, {
        padding: 100,
        maxZoom: 15
      });
    }
  }, [map, isLoaded, hostLocation, renterDetails]);

  return null;
};
