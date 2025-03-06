
import mapboxgl from 'mapbox-gl';
import { mapCore } from '../core/MapCore';
import { viewportManager } from '../viewport/ViewportManager';
import { createMarkerElement } from '@/utils/domUtils';
import { eventBus } from '../core/eventBus';
import { toast } from "sonner";
import { broadcastLocationUpdate } from '@/services/locationSubscription';
import { supabase } from '@/integrations/supabase/client';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export class LocationManager {
  private static instance: LocationManager;
  private watchId: number | null = null;
  private userMarker: mapboxgl.Marker | null = null;
  private carId: string | null = null;
  private lastBroadcast: number = 0;
  private broadcastInterval: number = 5000; // 5 seconds between broadcasts

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

    // Try to get the user's car ID for broadcasting
    this.getUserCar();

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
    this.carId = null;
  }

  private async getUserCar() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cars } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", user.id);
      
      if (cars && cars.length > 0) {
        this.carId = cars[0].id;
        console.log(`Set active car ID for location broadcasting: ${this.carId}`);
      }
    } catch (error) {
      console.error('Error fetching user car:', error);
    }
  }

  private handleLocationUpdate(position: GeolocationPosition): void {
    const location: Location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };

    this.updateMarker(location);
    
    // Emit standard location update event
    eventBus.emit({
      type: 'locationUpdate',
      payload: location
    });
    
    // Broadcast location update at regulated intervals
    const now = Date.now();
    if (this.carId && now - this.lastBroadcast > this.broadcastInterval) {
      broadcastLocationUpdate(location, this.carId);
      this.lastBroadcast = now;
    }
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
