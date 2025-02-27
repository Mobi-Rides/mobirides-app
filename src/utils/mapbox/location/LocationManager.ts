
import mapboxgl from 'mapbox-gl';
import { mapCore } from '../core/MapCore';
import { viewportManager } from '../viewport/ViewportManager';
import { createMarkerElement } from '@/utils/domUtils';
import { eventBus } from '../core/eventBus';
import { toast } from "sonner";

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export class LocationManager {
  private static instance: LocationManager;
  private watchId: number | null = null;
  private userMarker: mapboxgl.Marker | null = null;

  private constructor() {}

  static getInstance(): LocationManager {
    if (!LocationManager.instance) {
      LocationManager.instance = new LocationManager();
    }
    return LocationManager.instance;
  }

  startTracking(): void {
    if (!navigator.geolocation) {
      eventBus.emit({
        type: 'error',
        payload: 'Geolocation is not supported by your browser'
      });
      return;
    }

    if (this.watchId !== null) {
      // Already tracking
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      this.handleLocationUpdate.bind(this),
      this.handleLocationError.bind(this),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.userMarker) {
      this.userMarker.remove();
      this.userMarker = null;
    }
  }

  private handleLocationUpdate(position: GeolocationPosition): void {
    const location: Location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };

    this.updateMarker(location);
    eventBus.emit({
      type: 'locationUpdate',
      payload: location
    });
  }

  private handleLocationError(error: GeolocationPositionError): void {
    let message = 'Location error: ';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message += 'Location permission denied';
        toast.error(message);
        break;
      case error.POSITION_UNAVAILABLE:
        message += 'Location information unavailable';
        toast.error(message);
        break;
      case error.TIMEOUT:
        message += 'Location request timed out';
        toast.error(message);
        break;
      default:
        message += 'Unknown error occurred';
        toast.error(message);
    }
    eventBus.emit({
      type: 'error',
      payload: message
    });
  }

  private updateMarker(location: Location): void {
    const map = mapCore.getMap();
    if (!map) return;

    if (this.userMarker) {
      this.userMarker.remove();
    }

    const el = createMarkerElement(location.accuracy);
    this.userMarker = new mapboxgl.Marker({ element: el })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map);

    viewportManager.updateView({
      center: [location.longitude, location.latitude],
      zoom: 14
    });
  }
}

export const locationManager = LocationManager.getInstance();
