
import { ResourceBase } from './ResourceBase';
import { ResourceType, ResourceLoadingState } from './resourceTypes';
import { mapboxTokenManager } from '@/utils/mapbox';

/**
 * Represents the Mapbox GL JS module resource.
 * Responsible for loading the Mapbox GL JS module.
 */
export class ModuleResource extends ResourceBase {
  protected resourceType: ResourceType = 'module';

  constructor() {
    super();
  }

  async load(): Promise<boolean> {
    try {
      this.setState({ loading: true, error: null });

      // Check if mapboxgl is already available (loaded via script tag)
      if (window.mapboxgl) {
        this.setState({ loading: false, loaded: true });
        return true;
      }

      // Check if token is available before loading
      const tokenState = mapboxTokenManager.getTokenState();
      if (!tokenState.token) {
        throw new Error('Mapbox token not available');
      }

      // Get the instance manager for loading modules
      const instanceManager = mapboxTokenManager.getInstanceManager();
      
      try {
        // Try to load module using instance manager
        await instanceManager.getMapboxModule();
        
        // Verify the module was loaded correctly
        if (!window.mapboxgl) {
          throw new Error('Failed to load Mapbox GL JS module');
        }
        
        this.setState({ loading: false, loaded: true });
        return true;
      } catch (error) {
        console.error('Error loading Mapbox module:', error);
        this.setState({ 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to load Mapbox GL JS module'
        });
        return false;
      }
    } catch (error) {
      console.error('Resource load error:', error);
      this.setState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error loading Mapbox GL JS module'
      });
      return false;
    }
  }

  async reload(): Promise<boolean> {
    // Reset state before reloading
    this.setState({ loading: false, loaded: false, error: null });
    
    // For module reloading, we'll leverage the instance manager
    const instanceManager = mapboxTokenManager.getInstanceManager();
    await instanceManager.getMapboxModule();
    
    return this.load();
  }

  getState(): ResourceLoadingState {
    return { ...this.state };
  }
}
