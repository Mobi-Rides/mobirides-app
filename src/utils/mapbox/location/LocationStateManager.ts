
import { locationManager } from './LocationManager';
import { eventBus } from '../core/eventBus';
import { supabase } from '@/integrations/supabase/client';
import { updateCarLocation } from '@/services/carLocation';
import { toast } from "sonner";

export type LocationTrackingState = 'disabled' | 'enabled' | 'permission_denied' | 'error';

class LocationStateManager {
  private static instance: LocationStateManager;
  private state: LocationTrackingState = 'disabled';
  private permissionStatus: PermissionState | null = null;

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
      payload: { state: newState }
    });
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
      toast.success("Location tracking enabled");
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
    this.setState('disabled');
    toast.success("Location tracking disabled");
  }

  getCurrentState(): LocationTrackingState {
    return this.state;
  }
}

export const locationStateManager = LocationStateManager.getInstance();
