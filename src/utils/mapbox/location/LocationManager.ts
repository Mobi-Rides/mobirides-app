
import mapboxgl from 'mapbox-gl';
import { mapCore } from '../core/MapCore';
import { viewportManager } from '../viewport/ViewportManager';
import { createMarkerElement } from '@/utils/domUtils';
import { eventBus } from '../core/eventBus';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { saveLocation } from '@/services/locationService';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  altitude?: number;
  altitudeAccuracy?: number;
}

export class LocationManager {
  private static instance: LocationManager;
  private watchId: number | null = null;
  private userMarker: mapboxgl.Marker | null = null;
  private carId: string | null = null;
  private lastSave: number = 0;
  private saveInterval: number = 5000; // 5 seconds between location saves
  private sharingScope: 'none' | 'trip_only' | 'all' = 'none';

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

    // Try to get the user's car ID for tracking
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
    this.sharingScope = 'none';
  }

  setSharingScope(scope: 'none' | 'trip_only' | 'all'): void {
    this.sharingScope = scope;
    console.log(`Location sharing scope set to: ${scope}`);
  }

  private async getUserCar() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cars } = await supabase
        .from("cars")
        .select("id, location_sharing_scope")
        .eq("owner_id", user.id);
      
      if (cars && cars.length > 0) {
        this.carId = cars[0].id;
        if (cars[0].location_sharing_scope) {
          this.sharingScope = cars[0].location_sharing_scope as 'none' | 'trip_only' | 'all';
        }
        console.log(`Set active car ID for location tracking: ${this.carId}`);
        console.log(`Sharing scope: ${this.sharingScope}`);
      }
    } catch (error) {
      console.error('Error fetching user car:', error);
    }
  }

  private handleLocationUpdate(position: GeolocationPosition): void {
    const location: Location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined
    };

    this.updateMarker(location);
    
    // Emit standard location update event
    eventBus.emit({
      type: 'locationUpdate',
      payload: location
    });
    
    // Save location to database at regulated intervals
    const now = Date.now();
    if (now - this.lastSave > this.saveInterval) {
      this.saveLocationToDatabase(location);
      this.lastSave = now;
    }
  }

  private async saveLocationToDatabase(location: Location) {
    if (this.sharingScope === 'none') return;
    
    const saved = await saveLocation(location, this.carId, this.sharingScope);
    if (saved && this.carId) {
      // Also update the car's location
      try {
        await supabase
          .from('cars')
          .update({
            latitude: location.latitude,
            longitude: location.longitude,
            last_location_update: new Date().toISOString(),
          })
          .eq('id', this.carId);
      } catch (error) {
        console.error('Error updating car location:', error);
      }
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

    const el = createMarkerElement(location.accuracy || 0);
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
