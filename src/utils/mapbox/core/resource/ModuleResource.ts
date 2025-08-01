
import { ResourceBase } from './ResourceBase';
import { ResourceType, ResourceState, ModuleResourceConfig } from './resourceTypes';
import { mapboxTokenManager } from '@/utils/mapbox';
import mapboxgl from 'mapbox-gl';

/**
 * Represents the Mapbox GL JS module resource.
 * Responsible for loading the Mapbox GL JS module.
 */
export class ModuleResource extends ResourceBase {
  constructor() {
    super('module');
  }

  async acquire(): Promise<boolean> {
    try {
      this.setState('loading');

      // Check if mapboxgl is already available (loaded via import)
      if (mapboxgl) {
        console.log('Mapbox module already available globally');
        window.mapboxgl = mapboxgl;
        this.setState('ready');
        return true;
      }

      // Check if token is available before loading
      const tokenState = mapboxTokenManager.getTokenState();
      if (!tokenState.token) {
        this.setState('error', 'Mapbox token not available');
        return false;
      }

      // Get the instance manager for loading modules
      const instanceManager = mapboxTokenManager.getInstanceManager();
      
      try {
        // Try to load module using instance manager
        await instanceManager.getMapboxModule();
        
        // Verify the module was loaded correctly
        if (!window.mapboxgl) {
          window.mapboxgl = mapboxgl;
        }
        
        if (!window.mapboxgl) {
          this.setState('error', 'Failed to load Mapbox GL JS module');
          return false;
        }
        
        // Set the token on the mapboxgl object
        if (tokenState.token && window.mapboxgl) {
          window.mapboxgl.accessToken = tokenState.token;
        }
        
        this.setState('ready');
        return true;
      } catch (error) {
        console.error('Error loading Mapbox module:', error);
        this.setState('error', error instanceof Error ? error.message : 'Failed to load Mapbox GL JS module');
        return false;
      }
    } catch (error) {
      console.error('Resource load error:', error);
      this.setState('error', error instanceof Error ? error.message : 'Unknown error loading Mapbox GL JS module');
      return false;
    }
  }

  async release(): Promise<void> {
    this.setState('pending');
  }

  async validate(): Promise<boolean> {
    if (window.mapboxgl || mapboxgl) {
      window.mapboxgl = window.mapboxgl || mapboxgl;
      this.setState('ready');
      return true;
    }
    this.setState('error', 'Mapbox GL JS module not loaded');
    return false;
  }

  async configure<T extends ResourceType>(config: ModuleResourceConfig): Promise<boolean> {
    // No special configuration needed for module resource
    return true;
  }

  getState(): ResourceState {
    return this.state;
  }
}
