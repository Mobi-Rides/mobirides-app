
import { locationManager } from './LocationManager';
import { eventBus } from '../core/eventBus';
import { supabase } from '@/integrations/supabase/client';
import { updateCarLocation } from '@/services/carLocation';
import { toast } from "sonner";
import { subscribeToLocationUpdates, unsubscribeFromLocationUpdates } from '@/services/locationSubscription';

export type LocationTrackingState = 'disabled' | 'enabled' | 'permission_denied' | 'error';
export type LocationSharingScope = 'none' | 'trip_only' | 'all';

class LocationStateManager {
  private static instance: LocationStateManager;
  private state: LocationTrackingState = 'disabled';
  private permissionStatus: PermissionState | null = null;
  private sharingScope: LocationSharingScope = 'none';
  private carId: string | null = null;

  private constructor() {
    this.checkPermissionStatus();
  }

  static getInstance(): LocationStateManager {
    if (!LocationStateManager.instance) {
      LocationStateManager.instance = new LocationStateManager();
    }
    return LocationStateManager.instance;
  }

  private async checkPermissionStatus() {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      this.permissionStatus = permission.state;
      
      permission.addEventListener('change', () => {
        this.permissionStatus = permission.state;
        this.handlePermissionChange(permission.state);
      });
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  }

  private handlePermissionChange(state: PermissionState) {
    switch (state) {
      case 'granted':
        if (this.state === 'enabled') {
          locationManager.startTracking();
        }
        break;
      case 'denied':
        this.setState('permission_denied');
        toast.error("Location permission was denied. Please enable location services to use this feature.");
        break;
      case 'prompt':
        // Will handle during next enableTracking attempt
        break;
    }
  }

  private setState(newState: LocationTrackingState) {
    this.state = newState;
    eventBus.emit({
      type: 'locationUpdate',
      payload: { state: newState, sharingScope: this.sharingScope }
    });
  }

  setSharingScope(scope: LocationSharingScope, carId?: string) {
    this.sharingScope = scope;
    if (carId) {
      this.carId = carId;
    }
    
    if (scope !== 'none' && this.state === 'enabled') {
      this.startRealTimeSharing();
    } else {
      this.stopRealTimeSharing();
    }
    
    eventBus.emit({
      type: 'locationUpdate',
      payload: { state: this.state, sharingScope: scope }
    });
    
    return this.sharingScope;
  }

  getSharingScope(): LocationSharingScope {
    return this.sharingScope;
  }

  private async startRealTimeSharing() {
    if (!this.carId) {
      const cars = await this.getUserCar();
      if (cars && cars.length > 0) {
        this.carId = cars[0].id;
      } else {
        console.warn('No car found for real-time location sharing');
        return;
      }
    }
    
    subscribeToLocationUpdates(this.carId);
    toast.success(`Real-time location sharing ${this.sharingScope === 'trip_only' ? 'for trips' : ''} enabled`);
  }

  private stopRealTimeSharing() {
    if (this.carId) {
      unsubscribeFromLocationUpdates(this.carId);
      toast.success("Real-time location sharing disabled");
    }
  }

  private async getUserCar() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: cars } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", user.id);
        
      return cars;
    } catch (error) {
      console.error('Error fetching user car:', error);
      return null;
    }
  }

  async enableTracking(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to enable location tracking");
        return false;
      }

      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return false;
      }

      // This will trigger the permission prompt if needed
      locationManager.startTracking();
      this.setState('enabled');
      
      // If sharing was already configured, start real-time sharing
      if (this.sharingScope !== 'none') {
        this.startRealTimeSharing();
      }
      
      // toast.success("Location tracking enabled");
      return true;

    } catch (error) {
      console.error('Error enabling tracking:', error);
      this.setState('error');
      toast.error("Failed to enable location tracking");
      return false;
    }
  }   

  disableTracking() {
    locationManager.stopTracking();
    this.stopRealTimeSharing();
    this.setState('disabled');
    // toast.success("Location tracking disabled");
  }

  getCurrentState(): LocationTrackingState {
    return this.state;
  }
}

export const locationStateManager = LocationStateManager.getInstance();
